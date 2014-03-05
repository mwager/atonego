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
 * Bullshit: TODO use https://github.com/mwager/VanillaStorage ?
 *
 * @author Michael Wager <mail@mwager.de>
 */
define(function (require) {
    'use strict';

    // db encryption key
    // XXX KEY IS PUBLIC...
    // ... better than no encryption
    // var KEY = 'a|T5R#;4r3d$%6L-;^;>{+35>%>>Eh"QD3*+=?~#8+4-.hN:^"0_8:_.K;25V{??.@"330.yG8##22/:4)0/"1<+8/[,@2871-~5';

    // var _ = require('underscore');
    var ensureCB = function(cb) {
        return typeof cb === 'function' ? cb : function noop() {};
    };

    // some records are AES encrypted
    // var CryptoJS       = require('cryptojs');
    var VanillaStorage = require('VanillaStorage');

    // JsonFormatter
    // @see https://code.google.com/p/crypto-js/#The_Cipher_Algorithms
    // removed base64 stuff because of malformed problems on ios devices )-: see "AtOneGo"
    // see also http://stackoverflow.com/questions/12574160/my-cryptojs-encryption-decryption-is-not-working
    /*var JsonFormatter;
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
    };*/

    /**
     * Encryption helper

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
    */

    /**
     * Constructor
     *
     * Init db object and create the tables if not already done.
     */
    var Storage = function(cb) {
        var storageOptions = {
            version: '1.0',
            storeName: 'aog_store'
        };
        this.vanilla = new VanillaStorage(storageOptions, function(err) {
            if(err) {
                return cb(err);
            }
            cb();
        });
    };

    Storage.prototype = {
        hasBrowserSupport: function() {
            return this.vanilla.isValid();
        },

        /**
         * Create the database tables if not exists

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
        },*/

        /**
         * Store the user's data
         */
        storeUser: function(user, done) {
            done = ensureCB(done);
            if(!this.hasBrowserSupport() || !this.vanilla) {
                return done('no support');
            }

            // problems with idb TOO !!! )-:
            // encrypt the api token...
            // user.API_TOKEN = enc(user.API_TOKEN);

            // problems with idb
            // user = JSON.stringify(user);
            // encrypt the user data
            // user = enc(user);
            // log('"F"', user)

            this.vanilla.save('user', user, done);
        },

        /**
         * Fetch the user's data
         */
        fetchUser: function(done) {
            done = ensureCB(done);
            if(!this.hasBrowserSupport() || !this.vanilla) {
                return done('no support');
            }

            this.vanilla.get('user', function(err, data) {
                if(err) {
                    return done(err);
                }

                var user = data;

                // try {
                // user.API_TOKEN = dec(user.API_TOKEN);
                // foundUser = JSON.parse(foundUser);
                /*}
                catch(e) {
                    return done('Could not parse JSON: ' + foundUser, null);
                }*/

                done(null, user);
            });
        },

        /**
         * Store all todolists of a user
         */
        storeListsForUser: function(userID, lists, done) {
            done = ensureCB(done);
            if(!this.hasBrowserSupport() || !this.vanilla) {
                return done('no support');
            }

            if(!userID) {
                return done('no user id : ' + userID);
            }

            this.vanilla.save('lists-of-' + userID, lists, done);
        },

        /**
         * Fetch all todolists of a user (not actually needed)
         */
        fetchListsForUser: function(userID, done) {
            done = ensureCB(done);
            if(!this.hasBrowserSupport() || !this.vanilla) {
                return done('no support');
            }

            this.vanilla.get('lists-of-'+userID, done);
        },

        /**
         * Store all todos of a todolists
         */
        storeTodosOfList: function(listID, todos, done) {
            done = ensureCB(done);
            if(!this.hasBrowserSupport() || !this.vanilla) {
                return done('no support');
            }

            this.vanilla.save('todos-of-'+listID, todos, done);
        },

        /**
         * Fetch all todos of a todolists
         */
        fetchTodosOfList: function(listID, done) {
            done = ensureCB(done);
            if(!this.hasBrowserSupport() || !this.vanilla) {
                return done('no support');
            }

            this.vanilla.get('todos-of-'+listID, done);
        },

        /**
         * Delete all tables
         */
        nukeAll: function(done) {
            if(!this.hasBrowserSupport() || !this.vanilla) {
                return done('no support');
            }

            this.vanilla.nuke(done);
        }
    };

    return Storage;
});
