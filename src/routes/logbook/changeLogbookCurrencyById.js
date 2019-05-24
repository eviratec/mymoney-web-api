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

function changeLogbookCurrencyById (mymoney) {

  const api = mymoney.expressApp;
  const db = mymoney.db;
  const events = mymoney.events;
  const authz = mymoney.authz;

  return function (req, res) {
    let logbookId = req.params.logbookId;
    let userId = req.authUser.get("Id");
    let logbookUri = `/logbook/${logbookId}`;

    authz.verifyOwnership(logbookUri, userId)
      .then(fetchLogbook)
      .then(changeLogbookCurrency)
      .then(returnSuccess)
      .catch(onError);

    function fetchLogbook () {
      return db.fetchLogbookById(logbookId);
    }

    function changeLogbookCurrency (logbook) {
      return logbook.save({
        Currency: req.body.newValue || 'My Logbook',
      });
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

}

module.exports = changeLogbookCurrencyById;
