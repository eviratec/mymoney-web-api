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

const v4uuid = require("uuid/v4");

function createTransaction (mymoney) {

  const api = mymoney.expressApp;
  const db = mymoney.db;
  const events = mymoney.events;
  const authz = mymoney.authz;

  const Transaction = db.Transaction;

  return function (req, res) {
    let now = Math.floor(Date.now()/1000);
    let occurred = req.body.Occurred;
    let transactionId = v4uuid();
    let transaction;

    occurred = 'number' === typeof occurred && occurred || now;

    transaction = Transaction.forge({
      Id: transactionId,
      OwnerId: req.authUser.get("Id"),
      LogbookId: req.body.LogbookId || null,
      Summary: req.body.Summary || "New Transaction",
      Amount: req.body.Amount || 0,
      Occurred: occurred,
      Created: now,
    });

    transaction.save(null, {method: "insert"})
      .then(onCreateSuccess)
      .catch(onError);

    function onCreateSuccess (transaction) {
      let uri = `/transaction/${transactionId}`;
      events.emit("resource:created", uri, req.authUser.get("Id"));
      res.returnNewObject(transaction);
    }

    function onError (err) {
      res.status(400).send({ ErrorMsg: err.message });
    }
  }

}

module.exports = createTransaction;
