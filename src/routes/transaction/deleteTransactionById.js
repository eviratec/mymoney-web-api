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

function deleteTransactionById (mymoney) {

  const api = mymoney.expressApp;
  const db = mymoney.db;
  const events = mymoney.events;
  const authz = mymoney.authz;

  return function (req, res) {
    let transactionAmount;

    let transactionId = req.params.transactionId;
    let userId = req.authUser.get("Id");
    let transactionUri = `/transaction/${transactionId}`;

    authz.verifyOwnership(transactionUri, userId)
      .then(fetchTransaction)
      .then(setTransactionDeletedNow)
      .then(fetchRelatedLogbook)
      .then(updateLogbookBalance)
      .then(returnSuccess)
      .catch(onError);

    function fetchTransaction () {
      return db.fetchTransactionById(transactionId);
    }

    function setTransactionDeletedNow (transaction) {
      transactionAmount = transaction.get('Amount');
      return transaction.save({
        Deleted: Math.floor(Date.now()/1000),
      });
    }

    function fetchRelatedLogbook (transaction) {
      return transaction.related('Logbook').fetch();
    }

    function updateLogbookBalance (logbook) {
      return db._bookshelf.transaction(updateLogbookBalanceTransaction);

      function updateLogbookBalanceTransaction (t) {
        return db.Logbook.where({ Id: logbook.get('Id') })
          .query(q => q.forUpdate())
          .fetch({ transacting: t })
          .then(logbook => {
            let initialBalance = logbook.attributes.Balance;
            logbook.set('Balance', initialBalance - transactionAmount);
            return logbook.save(null, { transacting: t });
          });
      }
    }

    function returnSuccess () {
      res.status(200).send();
    }

    function onError () {
      res.status(400).send();
    }
  }

}

module.exports = deleteTransactionById;
