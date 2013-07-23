/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 *
 * UserModel
 *
 * @see model_tests.js
 *
 * @author Michael Wager <mail@mwager.de>
 */
'use strict';

var
    ENV         = process.env.NODE_ENV || 'test',
    _           = require('underscore'),
    BaseModel   = require(__dirname + '/base'),
    application = require('../../lib/application'),
    utils       = require('../../lib/utils'),
    logger      = require('../../lib/logger'),
    // log      = console.log,
    Schema,
    modelIdentifier = 'User',
    USERNAME_LENGTH = 32,
    // PASSWORD_MIN_LENGTH = 6,
    userTrialDays   = 3;

/**
 * reduce an array by passing an object as second param
 *
 * var arr = [{ user_id: '1',
 *              list_id: '4'
 *            },
 *            { user_id: '7',
 *              list_id: '9'
 *           }];
 * var reducedArr = reduceArray(arr, {user_id: '1',list_id: '4'});
 *   -> [{user_id: '7', list_id: '9'}]
 */
var reduceInvitationArray = function (arr, obj) {
    var reducedArr = [];
    arr.forEach(function (o) {
        var valid = true;

        // wenn wir ein objekt finden, dessen werte
        // exakt gleich sind ist valid false
        if('' + o.user_id === '' + obj.user_id && '' + o.list_id === '' + obj.list_id) {
            valid = false;
        }

        if(valid) {
            reducedArr.push(o);
        }
    });

    return reducedArr;
};

var userToJson = function (rawUser) {
    // XXX really NEEDED !?
    var u = {
        _id:            rawUser._id,
        active:         rawUser.active,
        active_since:   rawUser.active_since,

        name:           rawUser.name,
        display_name:   rawUser.display_name,
        lang:           rawUser.lang,
        notify_settings:rawUser.notify_settings,
        email:          rawUser.email,
        todolists:      rawUser.todolists,

        invite_list_ids:rawUser.invite_list_ids,

        created_at:     rawUser.created_at,
        updated_at:     rawUser.updated_at,

        device_tokens:        rawUser.device_tokens,
        gcm_registration_ids: rawUser.gcm_registration_ids
    };

    if(_.isFunction(rawUser.toObject)) {
        u = rawUser.toObject();
    }

    return u;
};

module.exports = function (mongoose) {
    // Die Benachrichtigungs-einstellungen pro User (defaults)
    var notify_settings_default = {
        email:      true,
        // push:       true,
        vibrate:    true,
        sound:      true
    };

    /**
     * Schema definition
     * @type {mongoose.Schema}
     */
    BaseModel.init(mongoose);
    Schema = BaseModel.getSchema({
        name: {
            type: String,
            index: true
            // unique:true ==> MANUALLY DAMNIT! (evtl später falls oauth...)
        },
        email: {
            type: String,
            // unique:true ==> MANUALLY DAMNIT!
            index: true
        },
        password: {
            type: String
        },

        display_name: {
            type: String
        },

        // we store the user's language
        lang: {
            type:      String,
            'default': application.defaultLang
        },

        notify_settings: {
            type: Object
        },

        // has many Todolists
        todolists: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Todolist'
        }],

        // list ids, zu denen dieser Benutzer eingeladen wurde,
        // aber noch akzeptieren muss
        invite_list_ids: [{
            // dieser user lädt mich ein...
            user_id: {
                type: String
            },
            // ...an dieser liste zu arbeiten
            list_id: {
                type: String
            }
        }],

        // twitter/facebook stuff (NOT USED [yet])
        // img_url: {
        //     type: String
        // },
        // combo:
        // The provider which with the user authenticated
        // (facebook, twitter, etc.). + A unique identifier
        // for the user, as generated by the service provider.
        // provider_identifier: {
        //     type: String
        // },

        // account activated? If not, when does it expire?
        active: {
            type: Boolean,
            index: true
        },
        active_since: {
            type: Date,
            index: true
        },

        // wenn der benutzer sein Passwort ändern will, generieren wir einen
        // random token und senden diesen in Form eines Links in einer Email
        // an die mail des benutzers
        // bei klick auf den Link wissen können wir dann einen BENUTZER FÜR
        // DIESEN TOKEN SUCHEN, wenn gefunden: er kann sein passwort ändern
        // und wir löschen den token wieder.
        tmp_token: {
            type: String,
            index: true
        },

        // array of apple apn device tokens and android gcm registration ids
        device_tokens: {
            type: Array
        },
        gcm_registration_ids: {
            type: Array
        }
    }, false, modelIdentifier);

    // IF UNIQUE KEY DOESNT WORK: RESTART MONGO AND: -> NO! DO IT YOURSELF ! ???
    //    db.dropDatabase()
    //    db.<db-name>.reIndex()
    //    Schema.path('name').index({ unique: true });
    //    Schema.path('email').index({ unique: true });

    // Folgendes war recht hilfreich hier:
    // https://github.com/jaredhanson/passport-local/blob/master/examples/express3-mongoose-rememberme/app.js
    // http://stackoverflow.com/questions/11199758/node-js-\
    // authentication-library-with-persistence-token-functionality/13593575#13593575
    // -----
    // encryption helper
    var encryptPassword = function _encryptPassword(plainPasswd) {
        return utils.encrypt(application.SALT, plainPasswd);
    };

    /**
     * Authenticate the user: check if encyrypted password
     * matches the exnc. password in the db
     * @param  {string} plainPasswd The plain password
     * @return {bool} True if passwords match
     */
    Schema.methods.authenticate = function _authenticate(plainPasswd) {
        var enc = encryptPassword(plainPasswd);

        //        log('CHECKING: ' + plainPasswd)
        //        log(this)
        //        log(enc)
        //        log(this.password)
        //        log(enc === this.password)

        return enc === this.password;
    };

    // helper for fetching a user and a list
    // @param theUser - User mongoose object
    function findUserAndList(theUser, userID, listID, cb) {
        var User = mongoose.model('User');
        var Todolist = mongoose.model('Todolist');

        var both = {
            user: null,
            list: null
        };

        User.findById(userID, {display_name: true, email: true}, function (err, user) {
            if(err || !user) {
                User._dropInvitation(theUser, userID, listID, function () {
                    return cb({key: 'error'});
                });
                return;
            }

            both.user = user;

            Todolist.findById(listID, {title: true}, function (err, list) {
                if(err || !list) {
                    User._dropInvitation(theUser, userID, listID, function () {
                        utils.handleError('list not found');
                        return cb({key: 'error'});
                    });
                    return;
                }

                both.list = list;

                cb(null, both);
            });
        });
    }

    // fetch a user by an ObjectID.
    // Daten werden manuell etwas aufbereitet
    Schema.statics.fetchUser = function _fetchUser(userID, cb) {
        // var User = this;
        var Todolist = mongoose.model('Todolist');

        this.findById(userID)
            .populate('todolists')
            .sort({'todolists.updated_at': -1}) // updated by DESC
            .exec(function (err, user) {

            var rawUser = user.toJSON(); // need raw now

            function goOn() {
                var n = user.todolists.length;

                if(n === 0) {
                    return cb(null, userToJson(rawUser));
                }

                // finally find all lists of this user populated
                Todolist.findByUserID(userID, function (err, lists) {
                    if(err || !lists) {
                        utils.handleError(err || 'list not found - was geht hier!?');
                        return cb({key: 'error'});
                    }

                    // overwrite raw object! ...
                    rawUser.todolists = lists;

                    return cb(null, userToJson(rawUser));
                });
            }

            if(err || !user) {
                utils.handleError(err || 'user not found - was geht hier!?');
                return cb({key: 'error'});
            }

            var invitations = [];
            var invCnt = user.invite_list_ids.length;

            if(invCnt === 0) {
                rawUser.invite_list_ids = invitations;
                goOn();
            } else {
                // populate invitation array
                user.invite_list_ids.forEach(function (obj) {
                    findUserAndList(user, obj.user_id, obj.list_id, function (err, populated) {
                        if(err || !populated) {
                            // return User._cleanupInvitations(goOn);
                        } else {
                            invitations.push(populated);
                        }

                        if(--invCnt === 0) {
                            rawUser.invite_list_ids = invitations;

                            goOn();
                        }
                    });
                });
            }
        });
    };

    /**
     * Find users which are allowed to work on the list
     *
     * Beispiel: User: {display_name: 'fred', ..., todolists: [1, 2, 3]}
     *
     * --> db.users.find({todolists: ObjectId("5199d2fd08ad8f541e000003")}).pretty()
     *
     * http://stackoverflow.com/questions/2336700/mongodb-many-to-many-association
     */
    Schema.statics.fetchListParticipants = function _fetchListParticipants(todolist, cb) {
        var User = this;

        // NICE: find users which have a property like this:
        // {display_name: 'fred', todolists: [todolist._id, todolist2._id, todolist3._id, ...] ... }
        // So, instead of an intermediate "many2many" collection,
        // we just store the todolists of a user in the users-collection.
        // MongoDB supports querying this stuff, mongoose usage easy peasy:
        User.find({todolists: todolist._id}, function(err, users) {
            if(err) {
                utils.handleError(err);
                return cb({key: 'error'});
            }

            // search the list "owner" (=== creator)
            // this user cannot be removed from the list of participants
            var usersArr = [], u;
            users.forEach(function(user) {
                u = user.toObject();

                // is this user the owner of the list?
                if(('' + user._id) === ('' + todolist.user)) {
                    u.is_owner = true;
                }

                usersArr.push(u);
            });

            return cb(null, usersArr);
        });
    };

    // create a new user
    Schema.statics.createUser = function _createUser(data, cb) {
        var User = this;

        if(!data) {
            utils.handleError('no data provided -> createUser()');
            return cb({key: 'error'});
        }

        // create helper
        var create = function () {
            if(!data.todolists) {
                data.todolists = [];
            }

            if(data.password) {
                data.password = encryptPassword(data.password);
            } else {
                // solange null, kann man sich nur per provider einloggen
                data.password = null;
            }

            // keep in sync with schema definition above
            var defaults = {
                name:           '',
                // email              :'', // KEIN DEFAULT
                display_name:   '',
                active:         false, // default false !
                active_since:   new Date(),
                tmp_token:      '', // default empty
                notify_settings:notify_settings_default,
                lang:           application.defaultLang
            };

            data = _.extend(defaults, data);

            if(data.display_name.length > USERNAME_LENGTH) {
                return cb({key: 'usernameTooLong'});
            }

            var u = new User(data);
            u.save(function (err) {
                if(err) {
                    utils.handleError(err);
                    return cb({key: 'error'});
                } else {
                    return cb(null, u);
                }
            });
        };

        // cb('No valid email address'); // TODO locale: MODELS KEIN I18n ! status codes?
        if(!data.name && !data.email) {
            utils.handleError('email or name must be provided! -> createUser()');
            return cb({key: 'error'});
        }

        // check for unique name manually
        if(_.isString(data.name)) {
            this.find({
                name: data.name
            }, function (err, users) {
                if(err) {
                    utils.handleError(err);
                    return cb({key: 'error'});
                }

                if(users.length > 0) {
                    utils.handleError('User ' + users[0].name + ' already exists!');
                    return cb({key: 'userExists'});
                } else {
                    create();
                }
            });
        }

        // check for unique email manually
        if(_.isString(data.email)) {
            if(!utils.isValidMail(data.email)) {
                return cb({key: 'noValidMail'});
            }

            this.find({
                email: data.email
            }, function (err, users) {
                if(err) {
                    utils.handleError(err);
                    return cb({key: 'error'});
                }

                if(users.length > 0) {
                    utils.handleError('User ' + users[0].email + ' already exists!');
                    return cb({key: 'userExists'});
                } else {
                    create();
                }
            });
        }
    };

    // update an existing user
    Schema.statics.updateUser = function _updateUser(userID, data, cb) {
        var User = this;

        this.findById(userID)
        // .populate('todolists')
        .exec(function (err, user) {
            if(err || !user) {
                utils.handleError(err || 'user not found');
                return cb({key: 'error'});
            }

            // email validation
            if(data.email && !utils.isValidMail(data.email)) {
                return cb({key: 'noValidMail'});
            }

            var nameO  = user.name;
            var emailO = user.email;

            // helper
            var update = function () {
                if(data.name && data.display_name.length > USERNAME_LENGTH) {
                    utils.handleError(err);
                    return cb({key: 'usernameTooLong'});
                }

                if(data.display_name) {
                    user.display_name = data.display_name;
                }

                if(data.email) {
                    user.email = data.email;
                }

                if(data.password) {
                    user.password = encryptPassword(data.password);
                }

                if(data.lang) {
                    user.lang = data.lang;
                }

                if(data.notify_settings) {
                    user.notify_settings = data.notify_settings;
                }

                // the tmp password change token
                user.tmp_token = data.tmp_token || '';

                user.save(function (err, user) {
                    if(err) {
                        utils.handleError(err);
                        return cb({key: 'error'});
                    }

                    cb(null, user);
                });
            };

            // check for unique name manually
            // NUR WENN SICH MAIL/NAME GEÄNDERT HAT!
            if(_.isString(data.name) && nameO !== data.name) {
                User.find({
                    name: data.name
                }, function (err, users) {
                    if(err) {
                        utils.handleError(err);
                        return cb({key: 'error'});
                    }

                    if(users.length > 0) {
                        utils.handleError('User ' + users[0].name + ' already exists!');
                        return cb({key: 'userExists'});
                    } else {
                        update();
                    }
                });
            }

            // check for unique email manually
            // NUR WENN SICH WAS GEÄNDERT HAT!
            // NOTE: Ändern der email setzt account erstmal wieder inaktiv
            else if(_.isString(data.email) && emailO !== data.email) {
                if(!utils.isValidMail(data.email)) {
                    utils.handleError('no valid email: ' + data.email);
                    return cb({key: 'noValidMail'});
                }

                User.find({
                    email: data.email
                }, function (err, users) {
                    if(err) {
                        utils.handleError(err);
                        return cb({key: 'error'});
                    }

                    if(users.length > 0) {
                        utils.handleError('User ' + users[0].email + ' already exists!');
                        return cb({key: 'userExists'});
                    } else {

                        // SET INACTIVE !
                        user.active       = false;
                        user.active_since = new Date();

                        update();
                    }
                });
            } else {
                update();
            }
        });
    };


    Schema.statics.removeTokenFromUser = function _remTokn(token, cb) {
        var User = this;

        this.find({device_tokens: token}, function(err, users) {
            if(err) {
                return cb({key: 'error'});
            }
            else if(!users || users.length === 0) {
                return cb({key: 'no users found'});
            }
            else if(users.length > 0) {
                if(ENV !== 'test') {
                    console.log('User.removeTokenFromUser() -> Found users: ', users);
                }

                var n = users.length;
                users.forEach(function(u) {
                    User.addOrRemoveAPNDeviceToken(true, u, token, function(err, success) {
                        if(--n === 0) {
                            cb(err, success);
                        }
                    });
                });
            }
            else {
                return cb({key: 'error'});
            }
        });
    };

    /**
     * Add or remove an apn device token for this user
     *
     * @param {bool} remove If True we are in "remove"-mode else add
     */
    Schema.statics.addOrRemoveAPNDeviceToken = function _addOrRemoveAPNDeviceToken(remove, user, token, cb) {
        if(!user || !token) {
            return cb({key: 'error'});
        }

        this.findById(user._id, function(err, userFound) {
            if(err || !userFound) {
                return cb({key: 'error'});
            }

            var tokens      = userFound.device_tokens;
            var tokenExists = false;

            // let's see if this token already exists
            tokens.forEach(function(tokenFound) {
                if(token === tokenFound) {
                    tokenExists = true;
                }
            });

            if(remove === false) {
                userFound.device_tokens.push(token);
            }
            else if(tokenExists === true && remove === true) {
                userFound.device_tokens = _.without(userFound.device_tokens, token);
            }

            if(tokenExists === true && remove === false) {
                return cb(err, false);
            }

            userFound.save(function(err) {
                return cb(err, true);
            });
        });
    };

    /**
     * Add or remove a gcm registration id
     *
     * XXX Code dupli with addOrRemoveAPNDeviceToken()
     *
     * @param {bool} remove If True we are in "remove"-mode else add
     */
    Schema.statics.addOrRemoveGCMRegID = function _addOrRemoveGCMRegID(remove, user, regID, cb) {
        if(!user || !regID) {
            return cb({key: 'error'});
        }

        this.findById(user._id, function(err, userFound) {
            if(err || !userFound) {
                return cb({key: 'error'});
            }

            var regIDs   = userFound.gcm_registration_ids;
            var idExists = false;

            // let's see if this token already exists
            regIDs.forEach(function(regIDFound) {
                if(regID === regIDFound) {
                    idExists = true;
                }
            });

            if(remove === false) {
                userFound.gcm_registration_ids.push(regID);
            }
            else if(idExists === true && remove === true) {
                userFound.gcm_registration_ids = _.without(userFound.gcm_registration_ids, regID);
            }

            if(idExists === true && remove === false) {
                return cb(err, false);
            }

            userFound.save(function(err) {
                return cb(err, true);
            });
        });
    };


    // ----- sharing functions -----
    /**
     * Lade einen Benutzer ein, auf einer Liste mitarbeiten zu können
     */
    Schema.statics.inviteToList = function _inviteUserToList(user1ID, user2ID, list, cb) {
        var User = this;

        User.findById(user2ID, function (err, user2) {
            if(err || !user2) {
                utils.handleError(err || 'User not found');
                return cb({key: 'error'});
            }

            // wurde der user2 bereits von user1 für diese liste eingeladen?
            var inv_ids = user2.invite_list_ids;
            var valid = true;
            inv_ids.forEach(function (obj) {
                if(('' + obj.user_id) === ('' + user1ID) && ('' + obj.list_id) === ('' + list._id)) {
                    valid = false;
                }
            });

            if(!valid) {
                logger.log('user1 ID: ' + user1ID + ' has already invited user2Mail: ' + user2.email);
                return cb({key: 'already invited'}); // TODO locale und concept !!!
            }

            user2.invite_list_ids.push({
                user_id: user1ID,
                list_id: list._id
            });

            user2.save(function (err, user2) {
                if(err || !user2) {
                    utils.handleError(err || 'User not found');
                    return cb({key: 'error'});
                }
                cb(null, user2);
            });
        });
    };

    /**
     * Erlaube einem user das Arbeiten auf einer nicht von Ihm erstellten Liste
     *
     * TODO this is so ugly!
     * ich will den user mit der neuen liste gleich zurückgeben, aber dafür
     * nicht ZWEIMAL findById ! -> MIT TESTS !

     @param user1ID ID des Users welcher user2ID eingeladen hat
     @param user2ID ID des Users welcher nun die ref auf `list` bekommt
     */
    Schema.statics.addList = function _addList(user1ID, user2ID, list, cb) {
        var User = this;

        this.findById(user2ID).exec(function (err, user) {
            if(err || !user) {
                utils.handleError(err || 'User not found');
                return cb({key: 'error'});
            }

            // add to the lists of this user
            // wenn er sie nicht bereits hat
            var valid = true;
            user.todolists.forEach(function (l) {
                if('' + l._id === '' + list._id) {
                    valid = false;
                }
            });

            if(!valid) {
                logger.log('already added to list...');
                return cb({key: 'error'});
            }

            // add the ref
            user.todolists.push(list);

            // delete temporary saved invitation
            var obj = {
                user_id: user1ID,
                list_id: list._id
            };
            user.invite_list_ids = reduceInvitationArray(user.invite_list_ids, obj);

            user.save(function (err /*, user*/ ) {
                if(err) {
                    utils.handleError(err);
                    return cb({key: 'error'});
                }

                User.findById(user2ID).populate('todolists').exec(function (err, user) {
                    if(err) {
                        utils.handleError(err);
                        return cb({key: 'error'});
                    }
                    cb(null, user);
                });
            });
        });
    };

    // eine Einladung ablehnen
    Schema.statics.rejectInvitation = function _rejectInvitation(invitedUserID, inviterUserID, listID, cb) {
        var User = this;

        User.findById(invitedUserID, function (err, user) {
            if(err || !user) {
                utils.handleError(err || 'User not found');
                return cb({key: 'error'});
            }

            User._dropInvitation(user, inviterUserID, listID, function (err, user) {
                if(err || !user) {
                    utils.handleError(err || 'User not found');
                    return cb({key: 'error'});
                }

                cb(null, user);
            });
        });
    };

    // userID darf an "list" arbeiten, soll jetzt gelöscht werden
    // todo ugly too, see above
    Schema.statics.removeList = function _removeListFromUser(userID, list, cb) {
        var User = this;

        this.findById(userID, function (err, user) {
            if(err || !user) {
                utils.handleError(err || 'User not found');
                return cb({key: 'error'});
            }

            try {
                user.todolists.remove(list._id);
            } catch(e) {
                utils.handleError('error while removing todolist from user ' + userID + e.message);
                return cb({key: 'error'});
            }

            user.save(function (err /*, user*/ ) {
                if(err) {
                    utils.handleError(err);
                    return cb({key: 'error'});
                }

                User.findById(userID).populate('todolists').exec(function (err, user) {
                    if(err || !user) {
                        utils.handleError(err || 'User not found');
                        return cb({key: 'error'});
                    }
                    return cb(null, user);
                });
            });
        });
    };

    /**
     * Search users by query
     */
    Schema.statics.search = function _search(query, limit, cb) {
        var reg = new RegExp(query, 'i');

        this.find({
            $or: [{
                display_name: reg
            },/* {
                email: reg // DO NOT SEARCH BY EMAIL !!!
            }*/{
                name: reg
            }]
        }).sort({
            'name': -1
        }).limit(limit).exec(cb);
    };

    /* NOT USED Schema.statics.findByEmailOrName = function __findByEmailOrName(emailOrName, callback) {
        this.find({
            $or: [{
                name: emailOrName
            }, {
                email: emailOrName
            }]
        }, callback);
    };*/

    /**
     * Eine Invitation löschen
     * @access private
     */
    Schema.statics._dropInvitation = function __dropInvitation(user, userID, listID, cb) {
        var invitations = [];

        // hat dieser überhaupt einladungen?
        var n = user.invite_list_ids.length;
        if(n === 0) {
            return cb(user);
        }

        user.invite_list_ids.forEach(function (obj) {
            var valid = true;

            // wir holen alle außer die welche den reingegebenen
            // userID/listID gleicht und speichern den user
            if(('' + obj.user_id === '' + userID) && ('' + obj.list_id === '' + listID)) {
                valid = false;
            }

            if(valid) {
                invitations.push(obj);
            }

            if(--n === 0) {
                user.invite_list_ids = invitations;
                user.save(function (err, user) {
                    if(err) {
                        utils.handleError(err);
                        return cb({key: 'error'});
                    }
                    cb(null, user);
                });
            }
        });
    };

    /**
     * Drop a user
     *
     * This actually means add a document to the "deletedusers" collection
     * and then drop the real user document from the "users" collection
     */
    Schema.statics.dropUser = function _dropUser(userID, cb) {
        var DeletedUser = mongoose.model('DeletedUser');
        // var Todolist = mongoose.model('Todolist');

        this.findById(userID, function (err, user) {
            if(err || !user) {
                utils.handleError(err || 'User not found');
                return cb({key: 'error'});
            }

            var dropIt = function () {
                var info = 'name: ' + user.name + '; displayName: ' +
                 user.display_name + '; email: ' + user.email + '; provider_identifier: ' +
                  user.provider_identifier + '; created_at: ' + user.created_at +
                   '; updated_at: ' + user.updated_at;

                DeletedUser.addDeletedUser(info, function ( /*err, deletedUser*/ ) {
                    // ignore errors here...
                    user.remove(function (err) {
                        if(err) {
                            utils.handleError(err);
                            return cb({key: 'error'});
                        }

                        cb(null, true);
                    });
                });
            };

            var n = user.todolists.length;
            if(n === 0) {
                return dropIt();
            }

            if(true) {
                dropIt();
            }

            // delete all lists too! NO! WE DO NOT DELETE ANY LISTS !!!
            // TODO/XXX could check for participants of each list and drop only
            // the lists /without/ participants... ... ...
            /******
            user.todolists.forEach(function (listID) {
                Todolist.dropTodolist(userID, listID, function () {
                    // ignore errors...
                    if(--n === 0) {
                        dropIt();
                    }
                });
            });****/
        });
    };

    /**
     * Drop a user if expired
     *
     * @param user User instance
     * @param moment based on language of current requrest configured moment instance
     */
    Schema.statics.expiredAndDeleted = function _expiredAndDeleted(user, moment) {
        if(user.active === true || !user.active_since) {
            return false;
        }

        var diff = moment().diff(moment(user.active_since), 'days');

        if(user.active === false && diff > userTrialDays) {
            this.dropUser(user._id, function () {
                // ignore any errors silently...
            });
            return true;
        } else {
            return false;
        }
    };

    return mongoose.model(modelIdentifier, Schema);
};
