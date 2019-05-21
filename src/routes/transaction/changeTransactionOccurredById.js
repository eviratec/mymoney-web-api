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

function changeTransactionOccurredById (mymoney) {

  const api = mymoney.expressApp;
  const db = mymoney.db;
  const events = mymoney.events;
  const authz = mymoney.authz;

  return function (req, res) {
    let transactionId = req.params.transactionId;
    let userId = req.authUser.get("Id");
    let transactionUri = `/transaction/${transactionId}`;

    authz.verifyOwnership(transactionUri, userId)
      .then(fetchTransaction)
      .then(changeTransactionOccurred)
      .then(returnSuccess)
      .catch(onError);

    function fetchTransaction () {
      return db.fetchTransactionById(transactionId);
    }

    function changeTransactionOccurred (transaction) {
      if ("now" === req.body.newValue) {
        return setTransactionOccurredNow();
      }

      if (null === req.body.newValue) {
        return clearTransactionOccurred();
      }

      if ('number' === typeof req.body.newValue) {
        return transaction.save({
          Occurred: req.body.newValue,
        });
      }

      function setTransactionOccurredNow () {
        return transaction.save({
          Occurred: Math.floor(Date.now()/1000),
        });
      }

      function clearTransactionOccurred () {
        return transaction.save({
          Occurred: null,
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

module.exports = changeTransactionOccurredById;
