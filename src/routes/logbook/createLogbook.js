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

function createLogbook (mymoney) {

  const DEFAULT_CURRENCY = "usd";

  const api = mymoney.expressApp;
  const db = mymoney.db;
  const events = mymoney.events;
  const authz = mymoney.authz;

  const Logbook = db.Logbook;

  return function (req, res) {
    let logbookId = v4uuid();
    let logbook = Logbook.forge({
      Id: logbookId,
      OwnerId: req.authUser.get("Id"),
      Name: req.body.Name || "New Logbook",
      Currency: req.body.Currency || DEFAULT_CURRENCY,
      Created: Math.floor(Date.now()/1000),
    });

    logbook.save(null, {method: "insert"})
      .then(onCreateSuccess)
      .catch(onError);

    function onCreateSuccess (logbook) {
      let uri = `/logbook/${logbookId}`;
      events.emit("resource:created", uri, req.authUser.get("Id"));
      res.returnNewObject(logbook);
    }

    function onError (err) {
      console.log(err);
      console.log(err.stack);
      res.status(400).send({ ErrorMsg: err.message });
    }
  }

}

module.exports = createLogbook;
