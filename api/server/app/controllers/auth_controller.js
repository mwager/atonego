/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * AuthController
 *
 * Zuständig für die gesamte Authentifizierung gegen die AtOneGo-REST-API
 *
 * @read http://www.vinaysahni.com/best-practices-for-a-pragmatic-restful-api
 *
 * @author Michael Wager <mail@mwager.de>
 */
'use strict';

var
    ENV             = process.env.NODE_ENV || 'development',
    application     = require('../../lib/application'),
    i18n            = application.getI18nInstance(),
    moment          = require('moment'),
    utils           = require('../../lib/utils'),
    logger          = require('../../lib/logger'),
    log,
    // _ = require('underscore'),
    passport        = require('passport'),
    LocalStrategy   = require('passport-local').Strategy,

    AuthController;

log = console.log;

// helper to send email if account activation is expired
// this check is used in:
//      - every login process (check if logged in user account is not activated yet)
//      - the activation link (check if activation already expired...)
function __sendAccountExpiredMail(config, user, i18n) {
    utils.sendMail(
        config[ENV].ADMIN_EMAIL,
        user.email,
        i18n.__('accountDeletedSubject'),
        i18n.__('accountDeletedBody', user.display_name)
    );
}

AuthController = function (app, mongoose, config) {
    var User = mongoose.model('User');

    // SEE FIRST: http://passportjs.org/guide/configure/
    (function configureSerialization() {
        // Passport session setup.
        // To support persistent login sessions, Passport needs to be able to
        // serialize users into and deserialize users out of the session.  Typically,
        // this will be as simple as storing the user ID when serializing, and finding
        // the user by ID when deserializing.  However, since this example does not
        // have a database of user records, the complete Twitter profile is serialized
        // and deserialized.
        // // ------
        // NOTE: In this example, only the user ID is serialized to the session,
        // keeping the amount of data stored within the session small.
        // When subsequent requests are received, this ID is used to find the user,
        // which WILL BE RESTORED to req.user!!!
        // D.h. in JEDEM Request haben wir Zugriff auf den User via req.user,
        // die "passport-middleware" kümmert sich vorher um das Setzen des
        // Deserialisieren und setzen des "req.user"-Objekts
        passport.serializeUser(function (user, done) {
            // logger.info('serializeUser ' + JSON.stringify(user));
            done(null, user._id);
        });

        passport.deserializeUser(function (userID, done) {
            // logger.info('deserializeUser ' + JSON.stringify(userID));

            if(typeof userID !== 'string') {
                // try pseudo cast, else there will be
                // a mongoose-error:
                // "Cast to ObjectId failed for value '[object Object]' at path '_id'"
                userID = '' + userID;
            }

            User.findById(userID, function (err, userFound) {
                done(err, userFound);
            });
        });
    }());

    // --- CONFUGURE AUTH STRATEGIES ---
    // NOTES ZUM STRATEGY "done-callback":
    // -------------------------------------------------------------------------
    // im error fall muss der callback folgendes geben:
    // done(null, false) !!!
    // wird allerdings done('error message') zurückgegeben,
    // so wirft passport/express eine 500 mit dieser message !!!
    (function configureAuthStrategies() {
        passport.use(new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password'
        }, function (emailIn, passwordIn, done) {
            // we support login by [name and] email (later, if oauth)
            // User.findByEmailOrName(emailOrName, function (err, users) {
            User.find({email: emailIn}, function (err, users) {
                var
                    isValidPassword = false,
                    user;

                if(err) {
                    utils.handleError(err);
                    return done(null, false);
                }

                if(users.length === 0) {
                    err = 'LOGIN STRATEGY: user not found: ' + emailIn;
                    logger.info(err);
                    return done(null, false);
                }

                user = users[0];

                // --- USER ACTIVATION CHECK ---
                moment.lang(user.lang || 'en');

                i18n.setLocale(user.lang || 'en');

                if(User.expiredAndDeleted(user, moment)) {
                    __sendAccountExpiredMail(config, user, i18n);
                    return done(null, false);
                }

                isValidPassword = user.authenticate(passwordIn);

                if(isValidPassword === true) {
                    done(null, user);
                } else {
                    logger.info('=============> NO AUTH: ' + emailIn + ' pass: ' + passwordIn);
                    done(null, false);
                }
            });
        }));
    }());

    /**
     * LOGIN
     *
     * API URL DER FORM:
     * http://127.0.0.1:4000/api/v1/login?email=mail%40mwager.de&password=123456
     *
     * XXX possible brute force attack, no limit in here
     */
    app.post(application.apiVersion + '/login', function (req, res, next) {

        passport.authenticate('local',

        // hier rein kommt der user wenn das passwort stimmt oder false wenn
        // nicht. Siehe LocalStrategy oben.
        function (err, user /*, info*/ ) {
            if(err) {
                return application.sendDefaultError(req, res, err, 'error'); // TODO locale
            }

            // LOGIN FAILED - SEE FAIL-CALLBACK IN STRATEGY
            if(user === false) {
                err = '#POST login: email or password wrong';
                return application.sendDefaultError(req, res, err, err); // TODO locale
            }

            // req.login senseless yet, maybe for later use.
            // we need an api_token in headers on every req to identify the user
            req.logIn(user, function (err) {
                if(err) {
                    return application.sendDefaultError(req, res, err, 'error logging you in ' + err); // TODO locale
                }

                // ===== GENERATE THE SECRET REMEMBER ME TOKEN =====
                var token = application.getRemembermeToken(config[ENV].SALT, user, req, res);

                // NOW FETCH THE USER AND ALL NECESSARY DATA
                User.fetchUser(user._id, function (err, user) {
                    if(err || !user) {
                        return application.sendDefaultError(req, res, err, 'user not found'); // TODO locale
                    }

                    // NOTE: "user" is a raw js object here, no mongoose "document" object
                    user.API_TOKEN = token;
                    return application.sendDefaultSuccess(req, res, user, 200);
                });
            });

        })(req, res, next);
    });

    /**
     * LOGOUT
     */
    app.post(application.apiVersion + '/logout', function (req, res) {
        req.logout(); // --> http://passportjs.org/guide/logout/
        return application.sendDefaultSuccess(req, res, null, 204);
    });

    /**
     * SIGNUP
     */
    app.post(application.apiVersion + '/signup', function (req, res, next) {

        passport.authenticate('local',
        // wir nutzen auch bei signup die localStrategyhook...
        // damit der user danach gleich eingeloggt ist

        function (err, user /*, info*/ ) {
            if(err) {
                return application.sendDefaultError(req, res, err, 'error'); // TODO locale
            }

            // wenn hier der user existiert: FAIL
            if(user) {
                err = 'email exists';
                return application.sendDefaultError(req, res, err, err); // TODO locale
            }

            var display_name = req.body.display_name,
                email        = req.body.email,
                pw           = req.body.p1,
                lang         = req.body.lang;

            var data = {
                email:          email,
                display_name:   display_name || utils.generateNameFromEmail(email),
                password:       pw,
                lang:           lang
            };

            // this user ain't active yet!
            data.active = false;

            User.createUser(data, function (err, user) {
                if(err) {
                    return application.sendDefaultError(req, res, err, 'error'); // TODO locale
                }

                req.logIn(user, function (err) {
                    if(err) {
                        return application.sendDefaultError(req, res, err, 'error'); // TODO locale
                    }

                    User.fetchUser(user._id, function (err, user) {
                        if(err) {
                            return application.sendDefaultError(req, res, err, 'error'); // TODO locale
                        }

                        // ===== GENERATE THE SECRET REMEMBER ME TOKEN =====
                        var token = application.getRemembermeToken(config[ENV].SALT, user, req, res);

                        user.API_TOKEN = token;

                        application.sendDefaultSuccess(req, res, user, 200); // TODO locale

                        // welcome mail mit UNIQUE LINK ZU
                        // EINEM API ENDPUNKT! dann redirect zur website
                        // mit "DANKE dein Account ist nun aktiviert"!
                        // für 1 woche gültig!
                        var activationLink = config[ENV].WEBSITE_BASE_URL + 'activate/' +
                            user._id + '?lang=' + req.i18n.getLocale();

                        utils.sendMail(
                            config[ENV].ADMIN_EMAIL,
                            email,
                            req.i18n.__('newAccount'),
                            req.i18n.__('newAccountText', user.display_name, activationLink)
                        );
                    });
                });
            });

        })(req, res, next);
    });

    /**
     * Account-Activation
     */
    app.get('/activate/:user_id', function (req, res) {
        var userID = req.params.user_id;

        // MUSS SEIN ! XXX GLOBAL CATCH-ALL-ROUTES HANDLER in server.js?
        // welcher bei jedem request moment's lang setzt?
        moment.lang(req.i18n.getLocale());

        User.findById(userID, function (err, user) {
            // just get the f*** off
            if(err || !user) {
                utils.handleError(err || 'user not found while activating');
                req.flash('error', req.i18n.__('error'));
                res.redirect(config[ENV].WEBSITE_BASE_URL);
                return;
            }

            var deleted = User.expiredAndDeleted(user, moment);

            if(deleted) {
                __sendAccountExpiredMail(config, user, req.i18n);

                req.flash('error', req.i18n.__('newAccountExpired'));
                res.redirect(config[ENV].WEBSITE_BASE_URL);
                return;
            }

            if(user.active === true) {
                req.flash('info', req.i18n.__('newAccountAlreadyActivated'));
                res.redirect(config[ENV].WEBSITE_BASE_URL);
                return;
            }

            user.active = true;
            user.save(function (err) {
                if(err) {
                    utils.handleError(err);
                    req.flash('error', req.i18n.__('error'));
                    res.redirect(config[ENV].WEBSITE_BASE_URL);
                } else {
                    // send out an apn message !
                    // with a little luck, we've already got the device token of this user
                    req.i18n.setLocale(user.lang);
                    var apnMsg = req.i18n.__('accountActivatedAPNMsg');
                    application.sendAPN_PUSH(user, apnMsg);

                    req.flash('info', req.i18n.__('newAccountActivated'));
                    res.redirect(config[ENV].WEBSITE_BASE_URL);
                }
            });
        });
    });
};

module.exports = AuthController;