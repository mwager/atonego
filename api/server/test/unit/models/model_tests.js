/* jshint maxlen: 1200 */

/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * Unit-test all models'n'stuff in one file...
 *
 * These tests are testing all the functionality
 * of all our models
 *
 * XXX:
 *     - more modularity, less deps
 *     - better test concept
 */
'use strict';

process.env.NODE_ENV = 'test';

// dump & die (-;
//function dd(o) {
//    console.log(o);
//    process.exit(-1);
//}
var
    root        = __dirname + '/../../../../',
    libpath     = root + 'server/',
    mongoose    = require('mongoose'),
    moment      = require('moment'),
    utils       = require(root + 'server/lib/utils'),
    db          = require(root + 'server/lib/db'),
    should      = require('should'),
    _           = require('underscore'),
    // cleanCollection = db.cleanCollection,
    // colors   = require('colors'),
    ENV         = process.env.NODE_ENV || 'test';

// ----- test globals -----
var userName, userEmail, hansName;
var user_id, user_id2;
var todolist; // test ref
var todo; // test ref
var listTestTitle = 'my private list';
var todoTestTitle = 'buy eggs';

// testuser:
userEmail = 'trash@at-one-go.com';
userName = 'fred';
hansName = 'hans';

// die 2 testuser
var fred, hans;


function disconnectDB() {
    try {
        if(mongoose && mongoose.disconnect) {
            console.log('--------------- disconnecting from database...');
            mongoose.disconnect();
        }
    }
    catch(e) {
        console.log('error disconnecting db: ' + (e.message ? e.message : e));
    }
}

// if an error occurs, we must close the db connection and exit
/*process.on('uncaughtException', function (err) {
    disconnectDB();
    console.log('=======> UNCAUGHT ERROR: ' + err);
    process.exit(-1);
});*/


describe('===== Testing ALL Models', function () {
    var config, User, Todolist, Todo, DeletedUser; // MODEL REFS!
    before(function (done) {
        utils.loadConfig(libpath + 'config', function (conf) {
            config = conf;

            mongoose.disconnect();
            mongoose = db.connectToDatabase(mongoose, config.db[ENV].main, function (err) {
                if(err) {
                    throw err;
                }

                // --- register all needed models ---
                // User = require(libpath + 'app/models/user')(mongoose);
                User = mongoose.model('User');
                Todolist = mongoose.model('Todolist');
                Todo = mongoose.model('Todo');
                DeletedUser = mongoose.model('DeletedUser');

                db.cleanDB(mongoose, done);
            });
        });
    });

    after(function (done) {
        disconnectDB();
        done();
    });

    describe('Model::User', function () {

        describe('createUser()', function () {
            // beforeEach(function (done) {});
            it('should return error if no data provided', function (done) {
                User.createUser(null, function (err, user) {
                    should.exist(err);
                    should.not.exist(user);
                    done();
                });
            });

            // TODO raus
            it('should add user names', function (done) {
                User.createUser({
                    name: userName
                }, function (err, user) {
                    // err && log(err);
                    should.exist(user);

                    // should have default list array
                    should.exist(user.todolists);

                    user.active.should.equal(false);
                    (typeof user.active_since).should.equal('object');

                    // NOW SET ACTIVE!
                    user.active = true;
                    user.save(function(err, user) {
                        user.active.should.equal(true);

                        // should have default notify settings
                        should.exist(user.notify_settings);
                        user.notify_settings.email.should.equal(true);
                        user.notify_settings.push.should.equal(true);
                        user.notify_settings.vibrate.should.equal(true);
                        user.notify_settings.sound.should.equal(true);

                        should.not.exist(err);

                        user_id = user._id;

                        fred = user;

                        done();
                    });
                });
            });

            it('should add another testuser', function (done) {
                User.createUser({
                    name: hansName
                }, function (err, user) {
                    // err && log(err);
                    should.exist(user);
                    should.exist(user.lang);

                    // default en!
                    user.lang.should.equal('en');

                    // should have default list array
                    should.exist(user.todolists);

                    should.not.exist(err);

                    user_id2 = user._id;
                    hans = user;
                    done();
                });
            });

            it('should NOT add the same user name - name MUST be unique !', function (done) {
                User.createUser({
                    name: userName
                }, function (err, user) {
                    // err && log(err);
                    // console.log(err); // dup key error...
                    should.exist(err);
                    should.not.exist(user);
                    done();
                });
            });

            it('should add user emails', function (done) {
                var token = utils.randomString(8);

                User.createUser({
                    email: userEmail,
                    tmp_token: token ,// just to verify that the token will be stored
                    lang: 'de'
                }, function (err, user) {
                    // err && log(err);
                    should.exist(user);
                    user.lang.should.equal('de');

                    user.tmp_token.should.equal(token);
                    should.not.exist(err);
                    done();
                });
            });

            it('should NOT add the same user email - email MUST be unique !', function (done) {
                User.createUser({
                    email: userEmail
                }, function (err, user) {
                    // err && log(err);
                    // console.log(err); // dup key error...
                    should.exist(err);
                    should.not.exist(user);
                    done();
                });
            });

            it('should save minimal emails (len=6)', function (done) {
                User.createUser({
                    email: 's@s.de',
                    name: new Date()
                }, function (err, user) {
                    // err && log(err);
                    should.exist(user);
                    should.not.exist(err);

                    user.active.should.equal(false);
                    (typeof user.active_since).should.equal('object');

                    done();
                });
            });

            it('should return error in callback', function (done) {
                User.createUser({
                    email: 'notvalid'
                }, function (err, user) {
                    // err && log(err);
                    should.exist(err);
                    should.not.exist(user);
                    done();
                });
            });
        });

        describe('updateUser()', function () {
            it('should return error if no user not found', function (done) {
                User.updateUser(null, null, function (err, user) {
                    should.exist(err);
                    should.not.exist(user);
                    done();
                });
            });

            it('should update a user', function (done) {
                var fakeName = 'test123 (fred)';
                var newMail = 'toll@m.de';

                var data = {
                    // name: fakeName,
                    display_name: fakeName,
                    email: newMail,
                    password: '123',
                    tmp_token: '' // just to verify that the token will be stored
                };

                User.updateUser(user_id, data, function (err, user) {
                    // err && log(err);
                    should.exist(user);
                    user.display_name.should.equal(fakeName);
                    user.email.should.equal(newMail);

                    // IF EMAIL CHANGES, SO DOES THE "ACTIVE STATE" OF THIS ACCOUNT!
                    user.active.should.equal(false);
                    (typeof user.active_since).should.equal('object');

                    User.findById(user_id, function () {
                        user.display_name.should.equal(fakeName);
                        user.email.should.equal(newMail);
                        user.tmp_token.should.equal('');
                        done();
                    });
                });
            });
        });

        describe('findByEmailOrName()', function () {

            it('is not used', function (done) {
                done();
            });
            /*
            it('should findByEmailOrName -> Email', function (done) {
                User.findByEmailOrName(userEmail, function (err, users) {
                    should.not.exist(err);
                    should.exist(users);
                    users.length.should.equal(1);
                    users[0].email.should.equal(userEmail);
                    done();
                });
            });

            it('should findByEmailOrName -> Name', function (done) {
                User.findByEmailOrName(userName, function (err, users) {
                    should.not.exist(err);
                    should.exist(users);
                    users.length.should.equal(1);
                    users[0].name.should.equal(userName);
                    done();
                });
            });

            it('should NOT findByEmailOrName', function (done) {
                User.findByEmailOrName('dummy', function (err, users) {
                    should.not.exist(err);
                    should.exist(users);
                    users.length.should.equal(0);
                    done();
                });
            });*/
        });

        /**
         * Wir könnten serverseitig bei jedem Senden die user ID verschlüsseln
         * und bei jedem empfangen entschlüsseln!?
         *
         * Daten sind zwar bereits via SSL aber sicher ist sicher?
         */
        describe('CryptoStuff', function() {
            describe('authenticate()', function () {
                it('should authenticate me', function (done) {
                    User.findById(user_id, function (err, user) {
                        var isValid;

                        should.not.exist(err);

                        isValid = user.authenticate('123'); // siehe UPDATE USER oben
                        isValid.should.equal(true);

                        isValid = user.authenticate('123456');
                        isValid.should.equal(false);
                        done();
                    });
                });
            });

            it('should encrypt and decrypt MongoDB ObjectIDs', function (done) {

                // "user_id" ist eine Mongoose ObjectId mit einer toString()-Methode
                (typeof user_id).should.equal('object');
                user_id.toString().should.equal('' + user_id);

                // man muss die ObjectID via toString erst casten!
                var ID = user_id.toString(),
                    KEY = config[ENV].SALT,
                    encrypted = utils.encrypt(KEY, ID),
                    plain     = utils.decrypt(KEY, encrypted);

                encrypted.should.not.equal(ID);
                plain.should.equal(ID);
                // log(plain, ID)

                User.findById(plain, function (err, user) {
                    user._id.toString().should.equal(plain);

                    // encrypted ist 64 Zeichen lang:
                    // 07b0e7ec21ed02e92db00be0d06bdec0c71b7c4f5b04b7d4d60451c28cc2a471
                    // return log(encrypted, plain, user_id)

                    done();
                });
            });
        });

        describe('expiredAndDeleted()', function () {
            it('should delete expired user accounts', function (done) {
                // User.createUser();
                User.createUser({
                    email: 'expired@at-one-go.com'
                }, function (err, user) {
                    // err && log(err);
                    should.not.exist(err);
                    should.exist(user);

                    user.active.should.equal(false);
                    (typeof user.active_since).should.equal('object');

                    // fake it
                    user.active_since = moment().add('days', -4).toDate();

                    var ok = User.expiredAndDeleted(user, moment);

                    ok.should.equal(true);

                    done();
                });
            });
        });

        describe('addOrRemoveAPNDeviceToken()', function () {
            it('Should add an iOS device token to an empty array', function (done) {
                var demoToken = '42dce3cfa6c2a9e14c5297f4860e5399b95f325acb75311af7cd71a1074e8e18';

                User.addOrRemoveAPNDeviceToken(false, fred, demoToken, function(err, success) {
                    should.not.exist(err);
                    success.should.equal(true);

                    // re-fetch
                    User.fetchUser(fred._id, function(err, user) {
                        user.device_tokens.length.should.equal(1);
                        fred = user;
                        done();
                    });
                });
            });

            it('should add an iOS device token to an existing array', function (done) {
                var demoToken = '42dce3cfa6c2a9e14c5297f4860e5399b95f325acb75311af7cd71a1074e8e19';

                User.addOrRemoveAPNDeviceToken(false, fred, demoToken, function(err, success) {
                    should.not.exist(err);
                    success.should.equal(true);

                    // re-fetch
                    User.fetchUser(fred._id, function(err, user) {
                        user.device_tokens.length.should.equal(2);
                        fred = user;
                        done();
                    });
                });
            });

            it('should NOT add the same token twice', function (done) {
                var demoToken = '42dce3cfa6c2a9e14c5297f4860e5399b95f325acb75311af7cd71a1074e8e19';

                User.addOrRemoveAPNDeviceToken(false, fred, demoToken, function(err, success) {
                    should.not.exist(err);
                    success.should.equal(false);

                    // re-fetch
                    User.fetchUser(fred._id, function(err, user) {
                        user.device_tokens.length.should.equal(2); // immer noch 2
                        fred = user;
                        done();
                    });
                });
            });

            it('should remove a token', function (done) {
                var demoToken = '42dce3cfa6c2a9e14c5297f4860e5399b95f325acb75311af7cd71a1074e8e19';

                User.addOrRemoveAPNDeviceToken(true, fred, demoToken, function(err, success) {
                    should.not.exist(err);
                    success.should.equal(true);

                    // re-fetch
                    User.fetchUser(fred._id, function(err, user) {
                        user.device_tokens.length.should.equal(1);
                        fred = user;
                        done();
                    });
                });
            });

            it('should add the token again', function (done) {
                var demoToken = '42dce3cfa6c2a9e14c5297f4860e5399b95f325acb75311af7cd71a1074e8e19';

                User.addOrRemoveAPNDeviceToken(false, fred, demoToken, function(err, success) {
                    should.not.exist(err);
                    success.should.equal(true);

                    // re-fetch
                    User.fetchUser(fred._id, function(err, user) {
                        user.device_tokens.length.should.equal(2);
                        fred = user;
                        done();
                    });
                });
            });

            it('should find users for a token to remove it', function (done) {
                var demoToken = '42dce3cfa6c2a9e14c5297f4860e5399b95f325acb75311af7cd71a1074e8e19';

                User.removeTokenFromUser(demoToken, function(err, success) {
                    should.not.exist(err);
                    success.should.equal(true);

                    // re-fetch
                    User.fetchUser(fred._id, function(err, user) {
                        user.device_tokens.length.should.equal(1);
                        fred = user;
                        done();
                    });
                });
            });
        });

        describe('addOrRemoveGCMRegID()', function () {
            it('Should add a gcm registration id to an empty array', function (done) {
                var demoRegID = 'APA91bGFZipfVtuYZeHlOxszUCsN_c9OxkaqPApisPli66zXChCK2_8OU_4D0YbL3oM11-u3epZBAcVPTuHy7LH1J9tqlST0xkHPTSLR_8E3ZZPUC40AJFG9935zaip--jIb7FulDTu3503NB1ocePQIxN7TpHuEcB';

                User.addOrRemoveGCMRegID(false, fred, demoRegID, function(err, success) {
                    should.not.exist(err);
                    success.should.equal(true);

                    // re-fetch
                    User.fetchUser(fred._id, function(err, user) {
                        user.gcm_registration_ids.length.should.equal(1);
                        fred = user;
                        done();
                    });
                });
            });

            it('should add a gcm registration id to an existing array', function (done) {
                var demoRegID = 'APA91bGFZipfVtuYZeHlOxszUCsN_c9OxkaqPApisPli66zXChCK2_8OU_4D0YbL3oM11-u3epZBAcVPTuHy7LH1J9tqlST0xkHPTSLR_8E3ZZPUC40AJFG9935zaip--jIb7FulDTu3503NB1ocePQIxN7TpHuEcC';

                User.addOrRemoveGCMRegID(false, fred, demoRegID, function(err, success) {
                    should.not.exist(err);
                    success.should.equal(true);

                    // re-fetch
                    User.fetchUser(fred._id, function(err, user) {
                        user.gcm_registration_ids.length.should.equal(2);
                        fred = user;
                        done();
                    });
                });
            });

            it('should NOT add the same reg id twice', function (done) {
                var demoRegID = 'APA91bGFZipfVtuYZeHlOxszUCsN_c9OxkaqPApisPli66zXChCK2_8OU_4D0YbL3oM11-u3epZBAcVPTuHy7LH1J9tqlST0xkHPTSLR_8E3ZZPUC40AJFG9935zaip--jIb7FulDTu3503NB1ocePQIxN7TpHuEcC';

                User.addOrRemoveGCMRegID(false, fred, demoRegID, function(err, success) {
                    should.not.exist(err);
                    success.should.equal(false);

                    // re-fetch
                    User.fetchUser(fred._id, function(err, user) {
                        user.gcm_registration_ids.length.should.equal(2); // immer noch 2
                        fred = user;
                        done();
                    });
                });
            });

            it('should remove a reg id', function (done) {
                var demoRegID = 'APA91bGFZipfVtuYZeHlOxszUCsN_c9OxkaqPApisPli66zXChCK2_8OU_4D0YbL3oM11-u3epZBAcVPTuHy7LH1J9tqlST0xkHPTSLR_8E3ZZPUC40AJFG9935zaip--jIb7FulDTu3503NB1ocePQIxN7TpHuEcC';

                User.addOrRemoveGCMRegID(true, fred, demoRegID, function(err, success) {
                    should.not.exist(err);
                    success.should.equal(true);

                    // re-fetch
                    User.fetchUser(fred._id, function(err, user) {
                        user.gcm_registration_ids.length.should.equal(1);
                        fred = user;
                        done();
                    });
                });
            });

            it('should add the reg id again', function (done) {
                var demoRegID = 'APA91bGFZipfVtuYZeHlOxszUCsN_c9OxkaqPApisPli66zXChCK2_8OU_4D0YbL3oM11-u3epZBAcVPTuHy7LH1J9tqlST0xkHPTSLR_8E3ZZPUC40AJFG9935zaip--jIb7FulDTu3503NB1ocePQIxN7TpHuEcC';

                User.addOrRemoveGCMRegID(false, fred, demoRegID, function(err, success) {
                    should.not.exist(err);
                    success.should.equal(true);

                    // re-fetch
                    User.fetchUser(fred._id, function(err, user) {
                        user.gcm_registration_ids.length.should.equal(2);
                        fred = user;
                        done();
                    });
                });
            });

            /*it('should find users for a reg id to remove it', function (done) {
                var demoRegID = '42dce3cfa6c2a9e14c5297f4860e5399b95f325acb75311af7cd71a1074e8e19';

                User.removeGCMRegIDFromUser(demoRegID, function(err, success) {
                    should.not.exist(err);
                    success.should.equal(true);

                    // re-fetch
                    User.fetchUser(fred._id, function(err, user) {
                        user.gcm_registration_ids.length.should.equal(1);
                        fred = user;
                        done();
                    });
                });
            });*/
        });
    }); // end User model


    describe('Model::Todolist', function () {
        describe('createList', function () {

            it('should not create a list if no data', function (done) {
                Todolist.createList(fred, user_id, null, function (err, list) {
                    should.exist(err);
                    should.not.exist(list);
                    done();
                });
            });

            it('should not create a list if no title', function (done) {
                Todolist.createList(fred, user_id, {no:'title'}, function (err, list) {
                    should.exist(err);
                    should.not.exist(list);
                    done();
                });
            });

            it('should not create a list if title length too long', function (done) {
                Todolist.createList(fred, user_id, {title:'123456789012345678901234567890AA-'},
                function (err, list) {
                    should.exist(err);
                    should.not.exist(list);
                    done();
                });
            });

            it('should create a new list for the test user which is the owner of this list then', function (done) {
                Todolist.createList(fred, user_id, {
                    title: listTestTitle
                }, function (err, list) {
                    // err && log(err);
                    should.not.exist(err);
                    should.exist(list);
                    should.exist(list.user); // OWNER!
                    list.title.should.equal(listTestTitle);

                    //return log(list)

                    should.exist(list.created_at);
                    should.exist(list.updated_at);
                    should.exist(list.created_by);
                    should.exist(list.updated_by);

                    list.created_by._id.toString().should.equal(fred._id.toString());
                    list.updated_by._id.toString().should.equal(fred._id.toString());

                    todolist = list;

                    // also add one "test-todo"
                    Todo.createTodo(fred, todolist._id, {
                        title: '1234567890?',
                        notice: 'test1'
                    }, function (err, todo) {
                        should.not.exist(err);
                        should.exist(todo);
                        todo.title.should.equal('1234567890?');
                        todo.notice.should.equal('test1');
                        todo.users_to_notify.length.should.equal(1);
                        todo.users_to_notify[0].should.equal(fred._id + '');

                        todo.created_by._id.toString().should.equal(fred._id.toString());

                        done();
                    });
                });
            });

            // 1. bei belong to hab ich nur die ID - KEIN populate()
            it('should belong to a user', function (done) {
                User.findById(todolist.user, function (err, user) {
                    user.name.should.equal(userName);
                    done();
                });
            });

            // 2. bei has many gibt es populate()
            it('it`s user should (now) have many lists', function (done) {
                User.findById(todolist.user).populate('todolists').exec(function (err, user) {
                    user.name.should.equal(userName);
                    user.todolists.length.should.equal(1);
                    user.todolists[0].title.should.equal(listTestTitle);
                    done();
                });
            });
        });

        /**
         * This is some tricky stuff...
         *
         * Example:
         * =====================================================================
         * Users:
         * id   name   lists
         * --------------------
         * 1    fred   [11,...]   -> Referenz auf Liste mit ID = 11
         * 2    hans   []
         *
         * Listen:
         * id    title    user
         * --------------------
         * 11    Einkauf  1     -> fred (id=1) ist der owner
         *
         * Nun will fred den hans einladen, auch an Liste 11 zu arbeiten.
         * Dann hat hans auch eine Ref auf die Liste 11:
         * id   name   lists
         * 2    hans   [11]
         * ... aber bei der Liste 11 steht immer noch user_id = 11 drin.
         * Somit ist diese Liste aus der Sicht von hans nur eine "ihm zugeteilte"
         * Fred bleibt aber der Owner. Dieser darf die Liste editieren und löschen,
         * andere Benutzer nicht! Will hans nicht mehr oder fred entscheidet sich
         * dazu hans wieder zu entfernen, so muss das ebenfalls möglich sein.
         *
         * Es folgt ein Test-UseCase mit "fred" und "hans” (-;
         */
        describe('--- SHARING LISTS ---', function () {

            describe('User ' + userName, function () {

                it('should BE the owner of the list', function (done) {

                    User.findById(user_id).populate('todolists').exec(function (err, user) {
                        var valid = false;
                        fred = user;

                        fred.name.should.equal(userName); // (-;

                        // console.log(todolist);
                        // console.log(fred.todolists);
                        // console.log(fred.todolists.id(todolist._id));
                        // ist fred der owner?
                        fred.todolists.forEach(function (l) {
                            if(('' + l._id) === ('' + todolist._id)) {
                                valid = true;
                            }
                        });

                        valid.should.equal(true);

                        done();
                    });
                });

                it('should invite another user to join a list', function (done) {
                    var n = 0;

                    function invite() {
                        User.inviteToList(fred._id, user_id2, todolist, function (err, user) {
                            if(n === 0) {
                                should.not.exist(err);
                                should.exist(user);
                            } else {
                                should.exist(err.key);
                                should.exist(err);
                            }

                            if(++n === 1) {
                                // check nochmal, diesmal darf die inv. nicht nochmal geadded werden
                                invite();
                            } else {
                                // wurden die invite ids gespeichert?
                                User.findById(user_id2, function (err, user2) {
                                    hans = user2;
                                    should.exist(hans.invite_list_ids);
                                    var inv_ids = hans.invite_list_ids;
                                    inv_ids.length.should.equal(1);

                                    // check the created list entry
                                    inv_ids[0].user_id.should.equal('' + fred._id);
                                    inv_ids[0].list_id.should.equal('' + todolist._id);
                                    done();
                                });
                            }
                        });
                    }

                    invite();
                });

                // es gibt nun fred und hans. hans hat eine invitation von fred offen...
                it('should let users ACCEPT the invitation', function (done) {
                    hans.invite_list_ids.length.should.equal(1);

                    // user hans klickt auf "Yes I want to join" oder so..
                    User.addList(fred._id, hans._id, todolist, function (err, user2) {
                        if(err) {
                            console.log(err);
                        }

                        should.not.exist(err);

                        ''.toString().should.equal('');

                        should.exist(user2);
                        user2.name.should.equal(hans.name);
                        user2.todolists.length.should.equal(1);

                        // list should be populated with array of list objects,
                        // not just array of ids
                        user2.todolists[0].title.should.equal(listTestTitle);

                        // invitation dropped ?
                        user2.invite_list_ids.length.should.equal(0);

                        User.findById(user2._id, function (err, user) {
                            hans = user; // update
                            should.not.exist(err);
                            user.todolists.length.should.equal(1);
                            user2.todolists[0].title.should.equal(listTestTitle);
                            done();
                        });
                    });
                });

                it('should fetch list participants', function (done) {
                    User.fetchListParticipants(todolist, function(err, users) {

                        // findet "fred" (owner) und "hans"
                        users.length.should.equal(2);

                        users[0]._id.toString().should.equal(fred._id.toString());
                        users[1]._id.toString().should.equal(hans._id.toString());

                        done();
                    });
                });

                it('should let users REJECT the invitation', function (done) {
                    // erst nochmal einladen...
                    User.inviteToList(fred._id, hans._id, todolist, function (err, invitedUser) {
                        should.not.exist(err);
                        should.exist(invitedUser);
                        should.exist(invitedUser.invite_list_ids);

                        // invitation addded ?
                        invitedUser.invite_list_ids.length.should.equal(1);

                        // user hans klickt auf "No fuck off" oder so..
                        User.rejectInvitation(hans._id, fred._id, todolist._id, function (err, hanson) {
                            // invitation dropped ?
                            hanson.invite_list_ids.length.should.equal(0);
                            done();
                        });
                    });
                });

                // hier nun check ob wir die user bekommen welche auch
                // an meinen listen arbeiten dürfen
                var msg = 'User.fetchUser() -> should then return user by id with custom properties generated';
                it(msg, function (done) {
                    User.fetchUser(fred._id, function (err, user) {
                        should.not.exist(err);
                        should.exist(user);
                        should.exist(user.notify_settings);
                        should.not.exist(user.is_bleada_siach);

                        done();
                    });
                });

                it('should let the owner drop some user(s)', function (done) {
                    User.removeList(user_id2, todolist, function (err, user) {
                        if(err) {
                            console.log(err);
                        }
                        should.not.exist(err);

                        should.exist(user);
                        user.name.should.equal(hans.name);
                        user.todolists.length.should.equal(0);

                        done();
                    });
                });

                // siehe dropTodolist() tests. dort wird überprüft ob der user
                // welcher eine liste löschen will dessen owner ist oder nicht
                it('should let a joined user stop working/joining a list', function (done) {
                    done();
                });
            });
        });

        describe('findByUserID()', function () {
            it('should fetch lists from a userID', function (done) {
                Todolist.findByUserID(user_id, function (err, lists) {
                    should.not.exist(err);
                    should.exist(lists);

                    // bei jeder liste müssen alle teilnehmer vorhanden sein
                    should.exist(lists[0].participants);

                    // console.log(lists)
                    lists[0].title.should.equal(listTestTitle);

                    // haben wir auch die Todos !?
                    should.exist(lists[0].todos);
                    done();
                });
            });

            it('should not find lists if user id not exists', function (done) {
                Todolist.findByUserID('519b6c513d278752a2000001', function (err, lists) {
                    should.exist(err);
                    should.not.exist(lists);
                    done();
                });
            });
        });

        describe('findByDocID()', function () {
            it('should fetch by id with all participants of this list', function (done) {

                // NOTE: "todolist" ist bereits gesetzt
                Todolist.findByDocID(todolist._id, function (err, list) {
                    should.not.exist(err);
                    should.exist(list);

                    // bei jeder liste müssen alle teilnehmer vorhanden sein
                    should.exist(list.participants);

                    list.title.should.equal(listTestTitle);

                    // haben wir auch die Todos !?
                    should.exist(list.todos);

                    done();
                });
            });

            it('should not find a list with dummy id', function (done) {
                Todolist.findByDocID('519b6c513d278752a2000001', function (err, list) {

                    should.exist(err);
                    should.not.exist(list);
                    done();
                });
            });
        });


        describe('updateList()', function () {
            it('should not update a list if title length too long', function (done) {
                Todolist.updateList(fred, todolist._id, {
                    title: 'kjdsfbnskjbfdjksfbjdsbfjksdbkfbsdjbfjklsdbflsndflsnlkdfnskljfnsdkjfnjkdsfnbkjdsb'
                }, function (err, list) {
                    should.exist(err);
                    should.exist(err.key); // lang key !
                    should.not.exist(list);

                    done();
                });
            });

            it('should update the title', function (done) {
                listTestTitle = 'test';
                Todolist.updateList(fred, todolist._id, {
                    title: listTestTitle
                }, function (err, list) {
                    should.not.exist(err);
                    list.title.should.equal(listTestTitle);

                    should.exist(list.created_at);
                    should.exist(list.updated_at);
                    should.exist(list.created_by);
                    should.exist(list.updated_by);
                    list.created_by._id.toString().should.equal(fred._id.toString());
                    list.updated_by._id.toString().should.equal(fred._id.toString());

                    done();
                });
            });

            it('should update the title by another user', function (done) {
                listTestTitle = 'test edited';
                Todolist.updateList(hans, todolist._id, {
                    title: listTestTitle
                }, function (err, list) {
                    should.not.exist(err);
                    list.title.should.equal(listTestTitle);

                    should.exist(list.created_at);
                    should.exist(list.updated_at);
                    should.exist(list.created_by);
                    should.exist(list.updated_by);
                    list.created_by._id.toString().should.equal(fred._id.toString());
                    // only updated by changed
                    list.updated_by._id.toString().should.equal(hans._id.toString());

                    done();
                });
            });
        });
    }); // end Todolist model


    describe('Model::Todo', function () {
        describe('createTodo', function () {

            it('should create a new todo on the testlist', function (done) {
                Todo.createTodo(fred, todolist._id, {
                    title: todoTestTitle,
                    date: moment().add('minutes', 1).toDate(), // see next test
                    completed: false
                }, function (err, todo_) {
                    if(err) {
                        console.log(err);
                    }

                    todo = todo_;

                    should.not.exist(err);
                    should.exist(todo);
                    should.exist(todo.todolist);
                    todo.title.should.equal(todoTestTitle);

                    should.exist(todo.created_at);
                    should.exist(todo.updated_at);
                    should.exist(todo.created_by);
                    should.exist(todo.updated_by);
                    todo.created_by._id.toString().should.equal(fred._id.toString());
                    todo.updated_by._id.toString().should.equal(fred._id.toString());

                    done();
                });
            });

            it('should now be found by findPayableTodos()', function(done) {
                var populateList = true;
                var n = 1;

                Todo.findPayableTodos(populateList, function(err, todos) {
                    should.not.exist(err);
                    should.exist(todos);
                    (todos.length > 0).should.equal(true);

                    // lists populated?
                    todos.forEach(function(todo) {
                        should.exist(todo.todolist.title);
                    });

                    if(--n === 0) {
                        done();
                    }
                });

                populateList = false;
                Todo.findPayableTodos(populateList, function(err, todos) {
                    should.not.exist(err);
                    should.exist(todos);
                    (todos.length > 0).should.equal(true);

                    // lists populated?
                    todos.forEach(function(todo) {
                        should.not.exist(todo.todolist.title);
                    });

                    if(--n === 0) {
                        done();
                    }
                });
            });

            it('should now belong to the todolist...', function (done) {
                Todo.findById(todo._id, function (err, todo) {
                    should.not.exist(err);
                    should.exist(todo.todolist); // (-:
                    done();
                });
            });

            it('and it\'s list should now have many todos', function (done) {
                Todolist.findById(todo.todolist).populate('todos').exec(function (err, list) {
                    should.not.exist(err);

                    // nun müssen todos populated sein
                    should.exist(list.todos[0].title);
                    done();
                });
            });

            it('should not create todos if title length > MAX', function (done) {
                var titleTooLong = '1234567890';

                for(var i=0; i<2000;i++) {
                    titleTooLong += '1234567890';
                }

                Todo.createTodo(fred, todolist._id, {
                    title: titleTooLong,
                    completed: true
                }, function (err, todo_) {
                    should.exist(err);
                    should.not.exist(todo_);
                    done();
                });
            });

            it('should not create the same title twice on the same list', function (done) {
                Todo.createTodo(fred, todolist._id, {
                    title: todoTestTitle,
                    completed: true
                }, function (err, todo_) {
                    should.exist(err);
                    should.not.exist(todo_);
                    done();
                });
            });
        });

        describe('updateTodo()', function () {
            it('should update the title, notice, users_to_notify...', function (done) {
                Todo.updateTodo(fred, todo._id, {
                    title: 'test',
                    notice: 'test1',
                    users_to_notify: [fred._id]
                }, function (err, todo_) {
                    should.not.exist(err);
                    todo_.title.should.equal('test');
                    todo_.notice.should.equal('test1');
                    should.exist(todo_.users_to_notify);
                    todo_.users_to_notify.length.should.equal(1);
                    todo_.users_to_notify[0].should.equal(fred._id);

                    // stamps
                    should.exist(todo.created_at);
                    should.exist(todo.updated_at);
                    should.exist(todo.created_by);
                    should.exist(todo.updated_by);
                    todo.created_by._id.toString().should.equal(fred._id.toString());
                    todo.updated_by._id.toString().should.equal(fred._id.toString());

                    done();
                });
            });

            it('should toggle the completed flag', function (done) {
                Todo.updateTodo(hans, todo._id, {
                    completed: true
                }, function (err, todo_) {
                    should.not.exist(err);
                    todo_.completed.should.equal(true);

                    todo_.created_by._id.toString().should.equal(fred._id.toString());
                    todo_.updated_by._id.toString().should.equal(hans._id.toString());

                    done();
                });
            });

            it('should toggle the completed flag again', function (done) {
                Todo.updateTodo(fred, todo._id, {
                    completed: false
                }, function (err, todo_) {
                    should.not.exist(err);
                    todo_.completed.should.equal(false);

                    todo_.created_by._id.toString().should.equal(fred._id.toString());
                    todo_.updated_by._id.toString().should.equal(fred._id.toString());

                    done();
                });
            });

            it('should not update todos if title length > MAX', function (done) {
                var titleTooLong = '1234567890';

                for(var i=0; i<2000;i++) {
                    titleTooLong += '1234567890';
                }

                Todo.updateTodo(fred, todo._id, {
                    title: titleTooLong,
                    completed: true
                }, function (err, todo_) {
                    should.exist(err);
                    should.not.exist(todo_);
                    done();
                });
            });

            // see api_tests.js too! (#PUT /todos/:id)
            it('should save a date', function (done) {
                var d = new Date();

                Todo.updateTodo(fred, todo._id, {
                    date: d // hier kann man direkt ein Date Objekt reingeben!
                }, function (err, todo_) {
                    should.not.exist(err);
                    should.exist(todo_.date);
                    todo_.date.toString().should.equal(d.toString());

                    todo_.created_by._id.toString().should.equal(fred._id.toString());
                    todo_.updated_by._id.toString().should.equal(fred._id.toString());

                    done();
                });
            });
        });

        var TODO_ID;
        describe('dropTodo()', function () {
            it('should drop todos', function (done) {
                TODO_ID = todo._id;

                Todo.dropTodo(todo, function (err, success) {
                    should.not.exist(err);
                    success.should.equal(true);

                    // really gone?
                    Todo.findById(TODO_ID, function (err, todo) {
                        _.isNull(err).should.equal(true);
                        should.not.exist(todo);
                        done();
                    });
                });
            });
        });

        // nun erst dropTodolist !
        var TODO_LIST_ID;
        describe('dropTodolist() - 2 roles', function () {

            // testvorbereitung
            before(function (done) {
                User.addList(user_id, user_id2, todolist, function (err, user2) {
                    if(err) {
                        console.log(err);
                        process.exit(-1);
                    }
                    should.exist(user2);
                    done();
                });
            });

            it('1. should (not) drop todolists in the name of hans', function (done) {
                TODO_LIST_ID = todolist._id;

                // "als welcher user" will ich diese liste löschen?
                // 1. als "nur zugeteilter user"...
                // das löscht die eigentliche Liste gar nicht, sondern nur des
                // users ref auf diese liste!
                Todolist.dropTodolist(user_id2, TODO_LIST_ID, function (err, success) {
                    if(err) {
                        console.log(err);
                        console.log('SHIT 1');
                        process.exit(-1);
                    }
                    should.not.exist(err);
                    success.should.equal(true);

                    // jetzt muss die liste selbst noch da sein, ref nicht
                    Todolist.findById(TODO_LIST_ID, function (err, list) {
                        _.isNull(err).should.equal(true);
                        should.exist(list);

                        // ist die user ref weg ?
                        User.findById(user_id2).populate('todolists').exec(function (err, user) {
                            should.not.exist(err);
                            should.exist(user.todolists);
                            user.todolists.length.should.equal(0);

                            // jetzt wirklich löschen im Namen des owners
                            done();
                        });
                    });
                });
            });

            it('2. should drop todolists in the name of fred', function (done) {
                TODO_LIST_ID = todolist._id;

                // 1.1 ref weg aber liste noch da?
                // 2. also owner nun tatsächlich löschen:
                Todolist.dropTodolist(user_id, TODO_LIST_ID, function (err, success) {
                    if(err) {
                        console.log(err);
                        console.log('SHIT 2');
                        process.exit(-1);
                    }

                    should.not.exist(err);
                    success.should.equal(true);

                    // really gone?
                    Todolist.findById(TODO_LIST_ID, function (err, list) {
                        _.isNull(err).should.equal(true);
                        should.not.exist(list);

                        // finally
                        done();
                    });
                });

            });
        });
    }); // end To-do model


    describe('User.dropUser()', function () {
        it('should drop the user', function (done) {
            User.dropUser(user_id, function (err, success) {
                should.not.exist(err);
                should.exist(success);
                success.should.equal(true);

                // infos about the user should be stored
                DeletedUser.find(function (err, users) {
                    users.length.should.equal(2);

                    // lists and todos deleted?
                    // NO WE DO NOT DELETE THAT...
                    // @see User.dropUser()
                    /*Todolist.find(function(err, lists) {
                        lists.forEach(function(l) {
                            l.user.should.not.equal(user_id);
                        });
                        done();
                    });*/
                    done();
                });
            });
        });
    });
});
