/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * Users API controller
 *
 * Author: Michael Wager <mail@mwager.de>
 */
'use strict';

var
    ENV             = process.env.NODE_ENV || 'development',
    application     = require('../../lib/application'),
    // moment       = require('moment'),
    utils           = require('../../lib/utils'),
    // logger       = require('../../lib/logger'),
    // log          = console.log,
    User, Todolist,
    UsersController;
    // i18n = application.getI18nInstance();

// helper
function fetchUserAndReturn(userID, cb) {
    // fetch user populated here ...
    User.fetchUser(userID, function(err, user) {
        if(err) {
            utils.handleError(err);
            return cb(err);
        }
        cb(null, user);
    });
}

UsersController = function (app, mongoose, config) {
    this.mongoose = mongoose;
    this.config = config;

    User     = mongoose.model('User');
    Todolist = mongoose.model('Todolist');

    var auth = application.checkAuth;
    var v    = application.apiVersion;

    /**
     * Fetch a user (fetch "myself" only)
     * see router.js on client
     */
    app.get(v + '/users/:id', auth, function __getUsers(req, res) {
        var user   = req.user;
        var userID = req.param('id'); // req.params.id oder req.param('id')

        // man kann bis jetzt nur sich selbst fetchen...
        if(user.id.toString() !== userID) {
            var err1 = 'you cannot fetch other users';
            return application.sendDefaultError(req, res, err1, err1);
        }

        User.fetchUser(userID, function (err, user) {
            if (err) {
                return application.sendDefaultError(req, res, err, err); // TODO locale
            }

            if(!user) {
                err = 'user not found';
                return application.sendDefaultError(req, res, err, err); // TODO locale
            }

            // FETCH THE TOKEN FROM BASIC AUTH
            var headerAuth = application.getAPITokenFromHttpBasicAuthRequestHeader(req);

            // NOT GENERATE AGAIN!
            // DER TOKEN DIENT AUCH ALS "SESSION_ID" ZUM VERGLEICH MIT SOCKET-USERS!
            // must be set again here!
            user.API_TOKEN = headerAuth.API_TOKEN; // application.getRemembermeToken(config[ENV].SALT, user, req, res);

            return application.sendDefaultSuccess(req, res, user, 200);
        });
    });

    // PATCH a user (user settings)
    // or pass device token (ios apn only)
    app.patch(v + '/users/:id', auth, function __patchUser(req, res) {
        var user     = req.user;
        var userID   = req.param('id');
        var oldEmail = user.email;

        // iOS device token?
        if(req.body.apn_device_token) {
            User.addOrRemoveAPNDeviceToken(false, user, req.body.apn_device_token, function(err/*, success*/) {

                // XXX rm
                console.log('===> added device token to user ' + user.email +
                    ' token is: ' + req.body.apn_device_token);

                if (err) {
                    return application.sendDefaultError(req, res, err, err); // TODO locale
                }

                // NOTE: if success is false, this means that the token was
                // already added. So serve 204 in both cases.
                return application.sendDefaultSuccess(req, res, {}, 204);
            });

            return;
        }

        // android registration ID ?
        if(req.body.gcm_reg_id) {
            User.addOrRemoveGCMRegID(false, user, req.body.gcm_reg_id, function(err/*, success*/) {
                // XXX rm
                console.log('===> added gcm registration id to user ' + user.email +
                    ' id is: ' + req.body.gcm_reg_id);

                if (err) {
                    return application.sendDefaultError(req, res, err, err); // TODO locale
                }

                // NOTE: if success is false, this means that the regID was
                // already added. So serve 204 in both cases.
                return application.sendDefaultSuccess(req, res, {}, 204);
            });

            return;
        }

        // "TODO" auch device token !!!

        // NOTE: notify_settings was stringified !
        if(req.body.notify_settings && req.body.notify_settings.length > 0) {
            try {
                req.body.notify_settings = JSON.parse(req.body.notify_settings);
            } catch(e) {
                utils.handleError(e);
            }
        }

        if( ('' + userID) !== ('' + user._id) ) {
            var err1 = 'user ' + user._id +
                ' wants to update the user with the id ' + userID +
                ' THIS IS NOT POSSIBLE.';

            return application.sendDefaultError(req, res, err1, 'error wrong user!'); // TODO locale
        }

        // WE SUPPORT UPDATING THE EMAIL.
        // this means we must reactivate the user if the email has changed

        // console.log(JSON.stringify(req.body))

        // TODO push - was geht hier?!
        User.updateUser(userID, req.body, function (err, updatedUser) {
            if (err) {
                return application.sendDefaultError(req, res, err, err); // TODO locale
            }
            if (!updatedUser) {
                err = 'user not found for ID = ' + userID;
                return application.sendDefaultError(req, res, err, err); // TODO locale
            }

            // send activation email if email was changed
            // NOTE: user.active & user.active_since were already updated in the model
            if(oldEmail !== updatedUser.email) {
                var activationLink = config[ENV].WEBSITE_BASE_URL + 'activate/' +
                    updatedUser._id + '?lang=' + req.i18n.getLocale();

                utils.sendMail(
                    config[ENV].ADMIN_EMAIL,
                    updatedUser.email,
                    req.i18n.__('newAccount'),
                    req.i18n.__('newAccountText', updatedUser.display_name, activationLink)
                );
            }

            return application.sendDefaultSuccess(req, res, {}, 204);
        });
    });

    /**
     * Invite/accept/reject lists
     */
    app.put(v + '/users/:id', auth, function __updateUser(req, res) {
        var user     = req.user;
        var userID   = req.param('id'); // req.params.id oder req.param('id')

        // -------------- sharing lists: add/remove lists
        // so, a listID must be provided...
        if (!req.body.list_id) {
            return application.sendDefaultError(req, res, 'no list id provided', 'no list id provided'); // TODO locale
        }

        Todolist.findById(req.body.list_id, function (err, todolist) {
            var issuerUserID;
            var invitedUserID, email;

            if (err) {
                return application.sendDefaultError(req, res, err, err); // TODO locale
            }

            if (!todolist) {
                return application.sendDefaultError(req, res, 'todolist was Not Found -> users_controler @ update user',
                    'todolist was Not Found -> users_controler @ update user'); // TODO locale
            }

            // ???????????????????????????????????????????
            /*if ('' + data._id === '' + hs.user._id) {
                return callback(null, hs.user);
            }*/

            if (req.body.invite) {
                email = req.body.email;

                User.find({email: email}, function(err, foundUsers) {
                    if (err) {
                        // TODO locale
                        return application.sendDefaultError(req, res, err, err);
                    }

                    // entweder laden wir nicht existierende Benutzer per mail ein
                    // diese müssen dann zuerst nen account erstellen! BASTA.
                    // oder direkt:
                    if(foundUsers.length === 0) {
                        utils.sendMail(
                            config[ENV].ADMIN_EMAIL,
                            email,
                            req.i18n.__('listInvitationSubject'),
                            req.i18n.__('listInvitationBody', user.display_name, todolist.title)
                        );

                        return application.sendDefaultSuccess(req, res, {}, 204);
                    }
                    else {
                        var foundUser = foundUsers[0];
                        var type = 'invitation';

                        User.inviteToList(userID, foundUser._id, todolist, function (err, invitedUser) {
                            if (err || !invitedUser) {
                                // TODO locale
                                return application.sendDefaultError(req, res, err ||
                                    {key:'error'}, err || {key:'error'});
                            }

                            fetchUserAndReturn(invitedUser._id, function(err, invitedUser) {
                                if(err || !invitedUser) {
                                    // TODO locale
                                    return application.sendDefaultError(req, res, err ||
                                        {key:'error'}, err || {key:'error'});
                                }

                                // push an update
                                // try a PUSH to invitedUser (socket io AND APPLE PUSH)
                                // var data = {
                                //     user: user, // dieser Benutzer läd mich ein, pass ihn also zu mir!
                                //     list: todolist
                                // };
                                // self.socketController.pushToUser(invitedUser, type, data, req);

                                // --- send out a push notification to the invited user ---

                                // set language of the user to PUSH to, before translating the message
                                req.i18n.setLocale(invitedUser.lang);
                                var apnMsg = req.i18n.__('listInvitationBodyAPNMsg', user.display_name, todolist.title);
                                application.sendAPN_PUSH(invitedUser, apnMsg, type);
                                application.send_GCM_PUSH(invitedUser, apnMsg);

                                return application.sendDefaultSuccess(req, res, invitedUser, 200);
                            });
                        });
                    }
                });
                return;
            }

            // diese anfrage kommt vom user welcher die anfrage annimmt ('hans')
            else if (req.body.add) {
                issuerUserID = req.body.issuer_user_id;
                invitedUserID = req.body._id;

                User.addList(issuerUserID, invitedUserID, todolist, function (err, invitedUser) {
                    if (err) {
                        return application.sendDefaultError(req, res, err, err); // TODO locale
                    }

                    fetchUserAndReturn(issuerUserID, function(err, issuerUser) {
                        if(err) {
                            return application.sendDefaultError(req, res, err, err); // TODO locale
                        }

                        // wir müssen nun noch die neue liste mit den neuen participants neu holen
                        Todolist.findByDocID(todolist._id, function(err, list) {
                            if(err) {
                                return application.sendDefaultError(req, res, err, err); // TODO locale
                            }

                            // push an update
                            var data = {
                                user: invitedUser,
                                list: list
                            };
                            // self.socketController.pushToUser(issuerUser, 'invitation_accepted', data, req);

                            req.i18n.setLocale(issuerUser.lang);
                            var apnMsg = req.i18n.__('listInvAcceptedBodyAPNMsg', user.display_name, todolist.title);
                            application.sendAPN_PUSH(issuerUser, apnMsg);
                            application.send_GCM_PUSH(issuerUser, apnMsg);

                            // zu hans zurück den user updaten !
                            return application.sendDefaultSuccess(req, res, data, 200);
                        });
                    });
                });
                return;
            }

            // 'hans' (invitedUserID) lehnt die einladung von fred (issuerUserID) ab
            else if (req.body.reject) {
                invitedUserID = req.body._id;
                issuerUserID  = req.body.issuer_user_id;

                User.rejectInvitation(invitedUserID, issuerUserID, todolist._id, function(err, invitedUser) {
                    if (err) {
                        return application.sendDefaultError(req, res, err, err); // TODO locale
                    }

                    fetchUserAndReturn(issuerUserID, function(err, issuerUser) {
                        if(err) {
                            return application.sendDefaultError(req, res, err, err); // TODO locale
                        }

                        // push an update
                        // var data = {
                        //     user: invitedUser,
                        //     list: todolist
                        // };
                        // self.socketController.pushToUser(issuerUser, 'invitation_rejected', data, req);

                        req.i18n.setLocale(issuerUser.lang);
                        var apnMsg = req.i18n.__('listInvRejectedBodyAPNMsg', user.display_name, todolist.title);
                        application.sendAPN_PUSH(issuerUser, apnMsg);
                        application.send_GCM_PUSH(issuerUser, apnMsg);

                        // zu hans zurück den user updaten !
                        return application.sendDefaultSuccess(req, res, invitedUser, 200);
                    });
                });
                return;
            }

            // remove list
            else if (req.body.remove) {
                User.removeList(req.body.user_id_to_be_removed, todolist, function (err, userToBeRemoved) {
                    if (err) {
                        return application.sendDefaultError(req, res, err, err); // TODO locale
                    }

                    fetchUserAndReturn(userToBeRemoved._id, function(err, userToBeRemoved) {
                        if(err) {
                            return application.sendDefaultError(req, res, err, err); // TODO locale
                        }

                        // push an update
                        // var data = {
                        //     user: user,
                        //     list: todolist
                        // };
                        // self.socketController.pushToUser(userToBeRemoved, 'list_access_removed', data, req);

                        req.i18n.setLocale(userToBeRemoved.lang);
                        var apnMsg = req.i18n.__('listAccessRemovedAPNMsg', todolist.title);
                        application.sendAPN_PUSH(userToBeRemoved, apnMsg);
                        application.send_GCM_PUSH(userToBeRemoved, apnMsg);

                        var answer = {};
                        answer.userToBeRemoved = userToBeRemoved;

                        // wir müssen nun noch die neue liste mit den neuen participants neu holen
                        Todolist.findByDocID(todolist._id, function(err, list) {
                            if(err) {
                                return application.sendDefaultError(req, res, err, err); // TODO locale
                            }

                            answer.list = list;

                            return application.sendDefaultSuccess(req, res, answer, 200);
                        });
                    });
                });
            }
        });
    });

    /**
     * User wants to drop his account
     *
     * Delete the logged in user
     */
    app.del(v + '/users/:id', auth, function __dropUser(req, res /*, next*/) {
        var user = req.user;

        // bis jetzt kann kein Benutzer andere Benutzer löschen
        User.dropUser(user._id, function (err/*, success*/) {
            if (err) {
                return application.sendDefaultError(req, res, err, err); // TODO locale
            }

            return application.sendDefaultSuccess(req, res, {}, 204);
        });
    });

    User = mongoose.model('User');
};

module.exports = UsersController;
