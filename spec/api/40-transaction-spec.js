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

describe("TRANSACTION REST API", function () {

  let api;

  let userId;
  let authorization;

  let login;
  let password;

  let $testClient;

  beforeEach(function (done) {

    api = jasmine.startTestApi();
    $testClient = jasmine.createTestClient();

    login = $testClient.uniqueLogin();
    password = $testClient.generatePassword();

    $testClient.initUser(login, password, function (err, d) {
      if (err) return done(err);
      userId = d.UserId;
      authorization = d.TokenKey;
      done();
    });

  });

  afterEach(function (done) {
    api.server.close(done);
  });

  describe("/transactions", function () {

    let logbookData;
    let logbook;
    let logbookId;

    let transactionData;
    let transactionOccurred;

    beforeEach(function (done) {
      transactionOccurred = Math.round((Date.now()/1000)-36000);
      transactionData = {
        Summary: "My Test Transaction",
        Amount: 1238,
        Occurred: transactionOccurred,
      };
      logbookData = {
        Name: "My Test Logbook",
        Currency: "aud",
      };
      $testClient.$post(authorization, `/logbooks`, logbookData, function (err, res) {
        logbook = res.d;
        logbookId = logbook.Id;

        transactionData.LogbookId = logbookId;

        done();
      });
    });

    describe("createTransaction <POST> with valid parameters", function () {

      describe("top-level transactions", function () {

        it("RETURNS `HTTP/1.1 403 Forbidden` WHEN `Authorization` HEADER IS NOT PROVIDED", function (done) {
          $testClient.$post(null, `/transactions`, transactionData, function (err, res) {
            expect(res.statusCode).toBe(403);
            done();
          });
        });

        it("RETURNS `HTTP/1.1 200 OK` WHEN `Authorization` HEADER IS PROVIDED", function (done) {
          $testClient.$post(authorization, `/transactions`, transactionData, function (err, res) {
            expect(res.statusCode).toBe(200);
            done();
          });
        });

        it("RETURNS AN OBJECT IN THE RESPONSE BODY FOR A SUCCESSFUL REQUEST", function (done) {
          $testClient.$post(authorization, `/transactions`, transactionData, function (err, res) {
            expect(res.statusCode).toBe(200);
            expect(res.d).toEqual(jasmine.any(Object));
            done();
          });
        });

        it("RETURNS AN `Id` PROPERTY IN THE RESPONSE BODY OBJECT FOR A SUCCESSFUL REQUEST", function (done) {
          $testClient.$post(authorization, `/transactions`, transactionData, function (err, res) {
            expect(res.statusCode).toBe(200);
            expect(res.d).toEqual(jasmine.objectContaining({
              "Id": jasmine.any(String),
            }));
            done();
          });
        });

        it("CREATES A TRANSACTION REACHABLE USING THE `Id` PROPERTY IN THE RESPONSE BODY", function (done) {
          $testClient.$post(authorization, `/transactions`, transactionData, function (err, res) {
            let transactionId = res.d.Id;
            $testClient.$get(authorization, `/transaction/${transactionId}`, function (err, res) {
              expect(res.statusCode).toBe(200);
              done();
            });
          });
        });

        it("SETS THE CORRECT VALUE FOR THE `Summary` PROPERTY", function (done) {
          $testClient.$post(authorization, `/transactions`, transactionData, function (err, res) {
            let transactionId = res.d.Id;
            $testClient.$get(authorization, `/transaction/${transactionId}`, function (err, res) {
              expect(res.d.Summary).toBe("My Test Transaction");
              done();
            });
          });
        });

        it("SETS THE CORRECT VALUE FOR THE `Amount` PROPERTY", function (done) {
          $testClient.$post(authorization, `/transactions`, transactionData, function (err, res) {
            let transactionId = res.d.Id;
            $testClient.$get(authorization, `/transaction/${transactionId}`, function (err, res) {
              expect(res.d.Amount).toBe(1238);
              done();
            });
          });
        });

        it("SETS THE CORRECT VALUE FOR THE `Occurred` PROPERTY", function (done) {
          $testClient.$post(authorization, `/transactions`, transactionData, function (err, res) {
            let transactionId = res.d.Id;
            $testClient.$get(authorization, `/transaction/${transactionId}`, function (err, res) {
              expect(res.d.Occurred).toBe(transactionOccurred);
              done();
            });
          });
        });

        it("ADDS THE TRANSACTION TO THE LOGBOOK'S TRANSACTIONS PROPERTY", function (done) {
          $testClient.$post(authorization, `/transactions`, transactionData, function (err, res) {
            let transactionId = res.d.Id;
            $testClient.$get(authorization, `/logbook/${logbookId}`, function (err, res) {
              expect(res.statusCode).toBe(200);
              expect(res.d).toEqual(jasmine.objectContaining({
                "Transactions": jasmine.arrayContaining([
                  jasmine.objectContaining({
                    "Id": transactionId,
                  }),
                ]),
              }));
              done();
            });
          });
        });

        it("ADDS THE TRANSACTION TO THE LOGBOOK'S LIST OF TRANSACTIONS", function (done) {
          $testClient.$post(authorization, `/transactions`, transactionData, function (err, res) {
            let transactionId = res.d.Id;
            $testClient.$get(authorization, `/logbook/${logbookId}/transactions`, function (err, res) {
              expect(res.statusCode).toBe(200);
              expect(res.d).toEqual(jasmine.arrayContaining([
                jasmine.objectContaining({
                  "Id": transactionId,
                }),
              ]));
              done();
            });
          });
        });

      });

    });

    describe("/transaction/:transactionId", function () {

      describe("updating transaction properties", function () {

        let transactionId;
        let transactionData;

        beforeEach(function (done) {
          transactionData = {
            Summary: "Test Transaction",
            LogbookId: logbookId,
          };
          $testClient.$post(authorization, `/transactions`, transactionData, function (err, res) {
            transactionId = res.d.Id;
            done();
          });
        });

        describe("changing the value for the 'Occurred' property", function () {

          describe("to 'now'", function () {

            it("RETURNS `HTTP/1.1 200 OK`", function (done) {
              let data = {
                newValue: "now",
              };
              $testClient.$put(authorization, `/transaction/${transactionId}/occurred`, data, function (err, res) {
                expect(res.statusCode).toBe(200);
                done();
              });
            });

            it("UPDATES THE VALUE CORRECTLY", function (done) {
              let data = {
                newValue: "now",
              };
              $testClient.$put(authorization, `/transaction/${transactionId}/occurred`, data, function (err, res) {
                $testClient.$get(authorization, `/transaction/${transactionId}`, function (err, res) {
                  expect(res.d.Occurred).toEqual(jasmine.any(Number));
                  done();
                });
              });
            });

          });

          describe("to a timestamp", function () {

            let timestamp;

            beforeEach(function () {
              timestamp = Math.floor(Date.now()/1000);
            });

            it("RETURNS `HTTP/1.1 200 OK`", function (done) {
              let data = {
                newValue: timestamp,
              };
              $testClient.$put(authorization, `/transaction/${transactionId}/occurred`, data, function (err, res) {
                expect(res.statusCode).toBe(200);
                done();
              });
            });

            it("UPDATES THE VALUE CORRECTLY", function (done) {
              let data = {
                newValue: timestamp,
              };
              $testClient.$put(authorization, `/transaction/${transactionId}/occurred`, data, function (err, res) {
                $testClient.$get(authorization, `/transaction/${transactionId}`, function (err, res) {
                  expect(res.d.Occurred).toBe(timestamp);
                  done();
                });
              });
            });

          });

          describe("to null", function () {

            it("RETURNS `HTTP/1.1 400 BAD REQUEST`", function (done) {
              let data = {
                newValue: null,
              };
              $testClient.$put(authorization, `/transaction/${transactionId}/occurred`, data, function (err, res) {
                expect(res.statusCode).toBe(400);
                done();
              });
            });

          });

        });

        describe("changing the value for the 'Summary' property", function () {

          it("RETURNS `HTTP/1.1 200 OK`", function (done) {
            let data = {
              newValue: "New Transaction Summary",
            };
            $testClient.$put(authorization, `/transaction/${transactionId}/summary`, data, function (err, res) {
              expect(res.statusCode).toBe(200);
              done();
            });
          });

          it("UPDATES THE VALUE CORRECTLY", function (done) {
            let data = {
              newValue: "New Transaction Summary",
            };
            $testClient.$put(authorization, `/transaction/${transactionId}/summary`, data, function (err, res) {
              $testClient.$get(authorization, `/transaction/${transactionId}`, function (err, res) {
                expect(res.d.Summary).toBe("New Transaction Summary");
                done();
              });
            });
          });

        });

        describe("changing the value for the 'Amount' property", function () {

          it("RETURNS `HTTP/1.1 200 OK`", function (done) {
            let data = {
              newValue: 1369,
            };
            $testClient.$put(authorization, `/transaction/${transactionId}/amount`, data, function (err, res) {
              expect(res.statusCode).toBe(200);
              done();
            });
          });

          it("UPDATES THE VALUE CORRECTLY", function (done) {
            let data = {
              newValue: 1369,
            };
            $testClient.$put(authorization, `/transaction/${transactionId}/amount`, data, function (err, res) {
              $testClient.$get(authorization, `/transaction/${transactionId}`, function (err, res) {
                expect(res.d.Amount).toBe(1369);
                done();
              });
            });
          });

        });

      });

      describe("deleting transactions", function () {

        let transactionId;
        let transactionData;

        beforeEach(function (done) {
          transactionData = {
            Summary: "Test Transaction",
            Amount: 1238,
            LogbookId: logbookId,
          };
          $testClient.$post(authorization, `/transactions`, transactionData, function (err, res) {
            transactionId = res.d.Id;
            done();
          });
        });

        describe("as the resource owner", function () {

          it("RETURNS `HTTP/1.1 403 Forbidden` WHEN `Authorization` HEADER IS NOT PROVIDED", function (done) {
            $testClient.$delete(null, `/transaction/${transactionId}`, function (err, res) {
              expect(res.statusCode).toBe(403);
              done();
            });
          });

          describe("successful request", function () {

            it("RETURNS `HTTP/1.1 200 OK` WHEN `Authorization` HEADER IS PROVIDED", function (done) {
              $testClient.$delete(authorization, `/transaction/${transactionId}`, function (err, res) {
                expect(res.statusCode).toBe(200);
                done();
              });
            });

            it("REMOVES THE TRANSACTION FROM THE LOGBOOK'S TRANSACTIONS PROPERTY", function (done) {
              $testClient.$delete(authorization, `/transaction/${transactionId}`, function (err, res) {
                $testClient.$get(authorization, `/logbook/${logbookId}`, function (err, res) {
                  expect(res.statusCode).toBe(200);
                  expect(res.d).not.toEqual(jasmine.objectContaining({
                    "Transactions": jasmine.arrayContaining([
                      jasmine.objectContaining({
                        "Id": transactionId,
                      }),
                    ]),
                  }));
                  done();
                });
              });
            });

            it("REMOVES THE TRANSACTION FROM THE LOGBOOK'S LIST OF TRANSACTIONS", function (done) {
              $testClient.$delete(authorization, `/transaction/${transactionId}`, function (err, res) {
                $testClient.$get(authorization, `/logbook/${logbookId}/transactions`, function (err, res) {
                  expect(res.statusCode).toBe(200);
                  expect(res.d).not.toEqual(jasmine.arrayContaining([
                    jasmine.objectContaining({
                      "Id": transactionId,
                    }),
                  ]));
                  done();
                });
              });
            });

          });

        });

      });

    });

  });

});
