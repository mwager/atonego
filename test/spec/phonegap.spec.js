/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * Tests für PhoneGap API Stuff
 *
 * Zum Ausprobieren und Testen der PhonegapAPI
 *
 * (nur auf echten geräten möglich, RTM)
 *
 * @author Michael Wager <mail@mwager.de>
 */
define('PhonegapSpec', ['app', 'libs/storage'], function (app, Storage) {

    'use strict';

    describe('The `phonegap` API', function () {
        it('navigator.notification (should vibrate, beep, alert, confirm etc)',
            function () {
                if (!navigator.notification) {
                    expect(true).to.equal(true);
                    return;
                }

                // knock knock (-;
                navigator.notification.vibrate(300);
                navigator.notification.beep(1);
                // expect(phonegap).to.exist;
                expect(typeof navigator.notification.vibrate).to.equal('function');
            });

        it('should know which platform is running -> global `device` object', function () {
            if (typeof window.device === 'undefined') {
                expect(true).to.equal(true);
                return;
            }
            // ----------------------- mobile code ------------------
            var theDevice = window.device || {platform: 'nomobile'};
            var html = 'Device Name: ' + theDevice.name + '<br />' +
                'Device Cordova: ' + theDevice.cordova + '<br />' +
                'Device Platform: ' + theDevice.platform + '<br />' +
                'Device UUID: ' + theDevice.uuid + '<br />' +
                'Device Model: ' + theDevice.model + '<br />' +
                'Device Version: ' + theDevice.version + '<br />';

            // log to screen too!
            log(html);

            var isIOS = app.isIOS;
            var isAndroid = app.isAndroid;

            if (isIOS) {
                log('THIS IS IOS!');
                expect(isIOS).to.equal(true);
            }
            else if (isAndroid) {
                log('THIS IS ANDROID!');
                expect(isAndroid).to.equal(true);
            }
            else {
                // FAIL
                expect('this is a mobile device').to.equal('true');
            }
        });

        it('should get the splashscreen', function () {
            expect(true).to.equal(true);
            // splashscreen:
            // http://docs.phonegap.com/en/2.4.0/cordova_splashscreen_splashscreen.md.html#show
            //                setTimeout(function() {
            //                    navigator.splashscreen.show();
            //                }, 3000);

        });

        it('should detect language', function (done) {
            if (!navigator.globalization) {
                expect(true).to.equal(true);
                return done();
            }

            navigator.globalization.getPreferredLanguage(
                function (language) {
                    log('language: ' + language.value + '\n');
                    log(JSON.stringify(language));

                    expect(true).to.equal(true);
                    done();
                },
                function () {
                    expect(true).to.equal('false');
                    done();
                }
            );
        });

        // note if the browser does not support window.openDatabase()
        // all tests will pass here
        describe('Storage Module', function() {

            before(function() {
                this.storage = new Storage();
                if(this.storage.hasBrowserSupport()) {
                    this.storage.openDatabase(); // -> main.js onDeviceReady!
                }
            });

            it('should expose a simple function constructor', function () {
                expect(typeof Storage).to.equal('function');
                expect(typeof this.storage).to.equal('object');
            });

            it('should init the storage object with callback', function (done) {
                var self = this;

                if(!this.storage.hasBrowserSupport()) {
                    return done();
                }

                // make clean...
                this.storage.___dropTables(function(err, success) {
                    if(err) {
                        log(err);
                    }
                    expect(success).to.equal(true);

                    // DEV ONLY!
                    self.storage.initDatabase(function(err, success) {
                        if(err) {
                            log(err);
                        }
                        expect(success).to.equal(true);
                        done();
                    });
                });
            });

            it('should store the user & fetch him', function (done) {
                if(!this.storage.hasBrowserSupport()) {
                    return done();
                }

                var self = this;

                var demoUser = {name:'fred'};
                this.storage.storeUser(demoUser, function(err, success) {
                    if(err) {
                        log(err);
                    }

                    expect(success).to.equal(true);

                    self.storage.fetchUser(function(err, user) {
                        if(err) {
                            log(err);
                        }

                        expect(typeof user).to.equal('object');

                        // verify saved success
                        expect(JSON.stringify(user)).to.equal(JSON.stringify(demoUser));
                        expect(user.name).to.equal(demoUser.name);

                        done();
                    });
                });
            });


            it('should store the lists of a user and fetch them', function (done) {
                if(!this.storage.hasBrowserSupport()) {
                    return done();
                }

                var self = this;

                var userID1 = '518e5875dca89a7b2f000002'; // mongodb "_id"
                var demoLists = [{foo:'bar'}];
                this.storage.storeListsForUser(userID1, demoLists, function(err, success) {
                    if(err) {
                        log(err);
                    }

                    expect(success).to.equal(true);

                    self.storage.fetchListsForUser(userID1, function(err, lists) {
                        if(err) {
                            log(err);
                        }

                        expect(typeof lists).to.equal('object');

                        // verify saved success
                        var foundLists = lists;
                        log('foundLists',  (foundLists));

                        expect(foundLists[0].foo).to.equal(demoLists[0].foo);

                        done();
                    });
                });
            });

            it('should store the todos of a list and fetch them', function (done) {
                if(!this.storage.hasBrowserSupport()) {
                    return done();
                }

                var self = this;

                var listID = '518e5875dca89a7b2f000002'; // mongodb "_id"
                var demoTodos = [{foo:'barrrzzz'}];
                this.storage.storeTodosOfList(listID, demoTodos, function(err, success) {
                    expect(success).to.equal(true);

                    self.storage.fetchTodosOfList(listID, function(err, todos) {
                        expect(typeof todos).to.equal('object');

                        // verify saved success
                        var foundTodos = todos;

                        log('foundTodos', (foundTodos));

                        expect(foundTodos[0].foo).to.equal(demoTodos[0].foo);

                        demoTodos = JSON.stringify(demoTodos);
                        expect(JSON.stringify(foundTodos)).to.equal(demoTodos);

                        done();
                    });
                });
            });
        });
    });
});