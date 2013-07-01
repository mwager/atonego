/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * Storage module
 *
 * XXX code review, cleanup
 *
 * Es wird nur local gespeichert, NIEMALS andersrum: (local db -> sync -> server -> NO!).
 * Wenn also ein Benutzer kein Netz hat, wird der Datensatz weder zum Server, noch
 * in die lokale DB gespeichert.
 *
 * Phonegap Storage docs:
 *     http://docs.phonegap.com/en/2.7.0/cordova_storage_storage.md.html#openDatabase
 *
 * @author Michael Wager <mail@mwager.de>
 */
define(function (require) {
    'use strict';

    // module constants & dependencies
    var ONE_MB           = 1048576; // one megabyte -> 1048576/1024.0/1024.0 === 1 (XXX 1000000/1000/1000 ?!)
    var DATABASE_NAME    = 'atonego_v1_db';
    var DATABASE_SIZE    = ONE_MB * 5; // XXX TEST !
    var DATABASE_VERSION = '1.0';

    // db encryption key
    // XXX KEY IS PUBLIC...
    // ... better than no encryption
    var KEY = 'a|T5R#;4r3d$%6L-;^;>{+35>%>>Eh"QD3*+=?~#8+4-.hN:^"0_8:_.K;25V{??.@"330.yG8##22/:4)0/"1<+8/[,@2871-~5';

    var _ = require('lodash');

    // some records are AES encrypted
    var CryptoJS = require('cryptojs');

    // JsonFormatter
    // @see https://code.google.com/p/crypto-js/#The_Cipher_Algorithms
    // removed base64 stuff because of malformed problems on ios devices )-: see "AtOneGo"
    // see also http://stackoverflow.com/questions/12574160/my-cryptojs-encryption-decryption-is-not-working
    var JsonFormatter;
    JsonFormatter = {
        stringify: function (cipherParams) {
            // create json object with ciphertext
            var jsonObj = {
                // ct: cipherParams.ciphertext.toString(CryptoJS.enc.Base64)
                ct: cipherParams.ciphertext.toString() // AtOneGo
            };

            // optionally add iv and salt
            if(cipherParams.iv) {
                jsonObj.iv = cipherParams.iv.toString();
            }
            if(cipherParams.salt) {
                jsonObj.s = cipherParams.salt.toString();
            }

            // stringify json object
            return JSON.stringify(jsonObj);
        },

        parse: function (jsonStr) {
            // parse json string
            var jsonObj = JSON.parse(jsonStr);

            // extract ciphertext from json object, and create cipher params object
            var cipherParams = CryptoJS.lib.CipherParams.create({
                // ciphertext: CryptoJS.enc.Base64.parse(jsonObj.ct)
                ciphertext: CryptoJS.enc.Hex.parse(jsonObj.ct) // AtOneGo
            });

            // optionally extract iv and salt
            if(jsonObj.iv) {
                cipherParams.iv = CryptoJS.enc.Hex.parse(jsonObj.iv);
            }
            if(jsonObj.s) {
                cipherParams.salt = CryptoJS.enc.Hex.parse(jsonObj.s);
            }

            return cipherParams;
        }
    };

    /**
     * See Apple docs "JavaScript Database" -> better than phonegap's docs!
     * Bei phonegap ist nicht mal dokumentiert dass die error/success
     * callbacks bool returnen MÜSSEN!
     * -->
     * http://developer.apple.com/library/safari/#documentation/iPhone/Conceptual\
     * /SafariJSDatabaseGuide/UsingtheJavascriptDatabase/UsingtheJavascriptDatabase.html
     */
    function errorCB(err, done) {
        // "If the callback returns true, the entire transaction is rolled back.
        // If the callback returns false, the transaction continues as if nothing had gone wrong."

        try {
            err = JSON.stringify(err);
        }
        catch(e) {}

        log('##### DB STORAGE ##### ---> errorCB: ' + err);
        if(_.isFunction(done)) {
            done(err);
            return false; // ok, error checking in done()
        }

        return true; // roll back
    }

    // wenn KEINE DATEN zurückgegeben werden sollen kann "done"
    // hierher übergeben werden
    function successCB(done) {
        // log('##### DB STORAGE ##### ---> successCB!');

        if(_.isFunction(done)) {
            done(null, true);
            return false; // ok
        }

        return false; // ok too
    }

    /**
     * Encryption helper
     */
    function enc(value) {
        var encrypted;
        try {
            encrypted = CryptoJS.AES.encrypt(value, KEY, {
                format: JsonFormatter
            });
            // log('encrypted value: ' + encrypted);

        } catch(e) {
            log(e.message + e.stack);
            return null;
        }
        return encrypted;
    }

    /**
     * Decryption helper
     */
    function dec(val) {
        var value;
        try {
            value = CryptoJS.AES.decrypt(val, KEY, {
                format: JsonFormatter
            });

            // throws exception "Malformed UTF-8 data" on iOS devices!
            value = value.toString(CryptoJS.enc.Utf8);
        } catch(e) {
            log(e.message ? e.message + e.stack : e);
            return null;
        }
        return value;
    }


    /**
     * Constructor
     *
     * Init db object and create the tables if not already done.
     */
    var Storage = function() {
        // If events are needed
        // _.extend(this, {}, Backbone.Events);
        // log(this)

        this.BROWSER_SUPPORT = typeof window.openDatabase === 'function';
    };

    Storage.prototype = {
        hasBrowserSupport: function() {
            return this.BROWSER_SUPPORT;
        },

        /**
         * Open the database
         */
        openDatabase: function() {
            if(!this.BROWSER_SUPPORT) {
                return false;
            }

            log('##### DB STORAGE ##### -> opening database: ',
                DATABASE_NAME, DATABASE_VERSION, DATABASE_NAME, DATABASE_SIZE);

            this.dbShell = window.openDatabase(DATABASE_NAME, DATABASE_VERSION, DATABASE_NAME, DATABASE_SIZE);
        },

        /**
         * Create the database tables if not exists
         */
        initDatabase: function(done) {
            if(!this.BROWSER_SUPPORT) {
                return successCB(done);
            }

            // simple key/value style
            var createDatabaseTables = function(tx) {
                // tx.executeSql('DROP TABLE IF EXISTS USER');
                // tx.executeSql('DROP TABLE IF EXISTS LISTS');
                // tx.executeSql('DROP TABLE IF EXISTS TODOS');

                tx.executeSql('CREATE TABLE IF NOT EXISTS USER  (user)');
                tx.executeSql('CREATE TABLE IF NOT EXISTS LISTS (user_id unique, lists)');
                tx.executeSql('CREATE TABLE IF NOT EXISTS TODOS (list_id unique, todos)');
            };

            this.DATABASE_ACCESS = true;
            this.dbShell.transaction(createDatabaseTables,
                function(err) {
                    return errorCB(err, done);
                }, function() {
                    return successCB(done);
                }
            );
        },

        /**
         * Store the user's data
         */
        storeUser: function(user, done) {
            if(!this.BROWSER_SUPPORT) {
                return successCB(done);
            }

            var __storeUser = function(tx) {
                tx.executeSql('DELETE FROM USER', null, function() {
                    var query = 'INSERT INTO USER (user) VALUES (?);';
                    // log(query, user);

                    user = JSON.stringify(user);

                    // encrypt the user data
                    user = enc(user);

                    tx.executeSql(query, [user]);
                });
            };

            this.dbShell.transaction(__storeUser,
                function(err) {
                    return errorCB(err, done);
                }, function() {
                    return successCB(done);
                }
            );
        },

        /**
         * Fetch the user's data
         */
        fetchUser: function(done) {
            if(!this.BROWSER_SUPPORT) {
                return successCB(done);
            }

            var __querySuccess = function(tx, results) {
                if(results.rows.length > 0) {

                    // 1. hole encrypted value
                    var foundUser = results.rows.item(0).user;

                    // log("LEEEEEEEEEEEEN: " + foundUser)

                    // 2. decrypt
                    foundUser = dec(foundUser);

                    // log("LEEEEEEEEEEEEN: " + foundUser)

                    // 3. parse JSON to object
                    try {
                        foundUser = JSON.parse(foundUser);
                    }
                    catch(e) {
                        return done('Could not parse JSON: ' + foundUser, null);
                    }

                    // log("LEEEEEEEEEEEEN: " + foundUser)

                    done(null, foundUser);
                } else {
                    done('NO USER FOUND IN LOCAL DATABASE', null);
                }
            };

            this.dbShell.transaction(
                function(tx) {
                    var q = 'SELECT * FROM USER';
                    // log(q);
                    tx.executeSql(q, [], __querySuccess);
                },
                function(err) {
                    return errorCB(err, done);
                },
                function() {
                    return successCB();
                }
            );
        },

        /**
         * Store all todolists of a user
         */
        storeListsForUser: function(userID, lists, done) {
            if(!this.BROWSER_SUPPORT) {
                return successCB(done);
            }

            if(!userID) {
                return done('no user id : ' . userID);
            }

            var __storeListsForUser = function(tx) {
                // zeile vorher löschen
                tx.executeSql('DELETE FROM LISTS WHERE user_id=?', [userID], function() {
                    var query = 'INSERT INTO LISTS (user_id, lists) VALUES (?, ?);';
                    // log(query, userID, lists);

                    lists = JSON.stringify(lists);

                    // wir verschlüsseln nur die lists-daten
                    // lists  = enc(lists);
                    // userID = enc(userID);

                    tx.executeSql(query, [userID, lists]);
                });
            };

            this.dbShell.transaction(__storeListsForUser,
                function(err) {
                    return errorCB(err, done);
                }, function() {
                    return successCB(done);
                }
            );
        },

        /**
         * Fetch all todolists of a user (not actually needed)
         */
        fetchListsForUser: function(userID, done) {
            if(!this.BROWSER_SUPPORT) {
                return successCB(done);
            }

            var __querySuccess = function(tx, results) {
                if(results.rows.length > 0) {
                    var lists = results.rows.item(0).lists;
                    // 2. decrypt
                    // lists = dec(lists);

                    // 3. parse JSON to object
                    try {
                        lists = JSON.parse(lists);
                    }
                    catch(e) {
                        return done('Could not parse JSON: ' + lists, null);
                    }

                    done(null, lists);
                }
                else {
                    done(null, null);
                }

                /*for (var i=0; i<len; i++){
                        log("Row = " + i + " ID = " + results.rows.item(0).user_id +
                         " Data =  " + results.rows.item(i).lists);
                    }*/
                // this will be true since it was a select statement and so rowsAffected was 0
                /*if (!results.rowsAffected) {
                    console.log('No rows affected!');
                    return false;
                }*/
                // for an insert statement, this property will return the ID of the last inserted row
                // console.log("Last inserted row ID = " + results.insertId);
            };

            var __fetchListsForUser = function(tx) {
                // userID = enc(userID).toString();
                // log(userID)

                var q = 'SELECT * FROM LISTS WHERE user_id = ?';
                // log(q, userID);

                tx.executeSql(q, [userID], __querySuccess);
            };

            this.dbShell.transaction(__fetchListsForUser,
                function(err) {
                    return errorCB(err, done);
                }, function() {
                    return successCB();
                }
            );
        },

        /**
         * Store all todos of a todolists
         */
        storeTodosOfList: function(listID, todos, done) {
            if(!this.BROWSER_SUPPORT) {
                return successCB(done);
            }

            var __store = function(tx) {
                // vorher die zeile löschen...
                tx.executeSql('DELETE FROM TODOS WHERE list_id=?', [listID], function() {
                    var query = 'INSERT INTO TODOS (list_id, todos) VALUES (?, ?);';
                    // log(query, listID, todos);

                    todos = JSON.stringify(todos);

                    // todos = enc(todos);

                    tx.executeSql(query, [listID, todos]);
                });
            };

            this.dbShell.transaction(__store,
                function(err) {
                    return errorCB(err, done);
                }, function() {
                    return successCB(done);
                }
            );
        },

        /**
         * Fetch all todos of a todolists
         */
        fetchTodosOfList: function(listID, done) {
            if(!this.BROWSER_SUPPORT) {
                return successCB(done);
            }

            var __querySuccess = function(tx, results) {
                if(results.rows.length > 0) {
                    var todos = results.rows.item(0).todos;

                    // 2. decrypt
                    // todos = dec(todos);

                    // log('fetched todos from local db: \n' + todos);

                    // 3. parse JSON to object
                    try {
                        todos = JSON.parse(todos);
                    }
                    catch(e) {
                        return done('Could not parse JSON: ' + todos, null);
                    }

                    done(null, todos);
                }
                else {
                    done(null, null);
                }
            };

            var __fetch = function(tx) {
                var q = 'SELECT * FROM TODOS WHERE list_id = ?';
                // log(q, listID);
                tx.executeSql(q, [listID], __querySuccess);
            };

            this.dbShell.transaction(__fetch,
                function(err) {
                    return errorCB(err, done);
                }, function() {
                    return successCB();
                }
            );
        },

        /**
         * Delete all tables
         */
        __deleteTables: function(done) {
            if(!this.BROWSER_SUPPORT) {
                return successCB(done);
            }

            var deleteAllTables = function(tx) {
                tx.executeSql('DELETE * FROM USER');
                tx.executeSql('DELETE * FROM LISTS');
                tx.executeSql('DELETE * FROM TODOS');

                if(_.isFunction(done)) {
                    done(null, true);
                }
            };

            this.dbShell.transaction(deleteAllTables,
                function(err) {
                    return errorCB(err, done);
                }, function() {
                    return successCB();
                }
            );
        },

        /**
         * Drop all tables
         */
        ___dropTables: function(done) {
            if(!this.BROWSER_SUPPORT) {
                return successCB(done);
            }

            var dropAllTables = function(tx) {
                tx.executeSql('DROP TABLE USER');
                tx.executeSql('DROP TABLE LISTS');
                tx.executeSql('DROP TABLE TODOS');
            };

            this.dbShell.transaction(dropAllTables,
                function(err) {
                    return errorCB(err, done);
                }, function() {
                    return successCB(done);
                }
            );
        }
    };

    return Storage;
});
