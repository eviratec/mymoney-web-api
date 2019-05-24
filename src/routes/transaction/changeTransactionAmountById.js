/**
 * Copyright (c) 2019 Callan Peter Milne
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 * LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 * OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 * PERFORMANCE OF THIS SOFTWARE.
 */

function changeTransactionAmountById (mymoney) {

  const api = mymoney.expressApp;
  const db = mymoney.db;
  const events = mymoney.events;
  const authz = mymoney.authz;

  return function (req, res) {
    let oldAmount;

    let newAmount = Number(req.body.newValue || 0);
    let transactionId = req.params.transactionId;
    let userId = req.authUser.get("Id");
    let transactionUri = `/transaction/${transactionId}`;

    authz.verifyOwnership(transactionUri, userId)
      .then(fetchTransaction)
      .then(changeTransactionAmount)
      .then(fetchRelatedLogbook)
      .then(updateLogbookBalance)
      .then(returnSuccess)
      .catch(onError);

    function fetchTransaction () {
      return db.fetchTransactionById(transactionId);
    }

    function changeTransactionAmount (transaction) {
      oldAmount = transaction.get('Amount');
      return transaction.save({
        Amount: newAmount,
      });
    }

    function fetchRelatedLogbook (transaction) {
      return transaction.related('Logbook').fetch();
    }

    function updateLogbookBalance (logbook) {
      let difference = calcDiff(oldAmount, newAmount);

      return db._bookshelf.transaction(updateLogbookBalanceTransaction);

      function updateLogbookBalanceTransaction (t) {
        return db.Logbook.where({ Id: logbook.get('Id') })
          .query(q => q.forUpdate())
          .fetch({ transacting: t })
          .then(logbook => {
            let initialBalance = logbook.attributes.Balance;
            logbook.set('Balance', initialBalance + difference);
            return logbook.save(null, { transacting: t });
          });
      }
    }

    function returnSuccess () {
      res.status(200).send();
    }

    function onError (err) {
      console.log(err);
      console.log(err.stack);
      res.status(400).send();
    }
  }

  function calcDiff (oldValue, newValue) {
    let oldValueIsNeg = oldValue < 0; // old value is less than zero
    let oldValueIsPos = oldValue > 0; // old value is greater than zero
    let newValueIsNeg = newValue < 0; // new value is less than zero
    let newValueIsPos = newValue > 0; // new value is greater than zero

    let negToPos = oldValueIsNeg && newValueIsPos; // convert neg to pos
    let posToNeg = oldValueIsPos && newValueIsNeg; // convert pos to neg

    let isNeg = oldValueIsNeg && newValueIsNeg; // both numbers are negative

    if (posToNeg) {
      return 0 - (oldValue + Math.abs(newValue));
    }

    if (negToPos) {
      return Math.abs(oldValue) + newValue;
    }

    if (isNeg) {
      return Math.abs(oldValue) - Math.abs(newValue);
    }

    return (0 - oldValue) + newValue;
  }

}

module.exports = changeTransactionAmountById;
