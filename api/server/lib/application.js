/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * Global application module
 *
 * Provides some global functionality
 *
 * @author Michael Wager <mail@mwager.de>
 */
'use strict';

// Global project root dir
var projectRoot = __dirname + '/../../';

var
    ENV = process.env.NODE_ENV || 'development',
    _ = require('underscore'),
    projectRoot = projectRoot,

    utils = require(__dirname + '/utils'),
    moment = require('moment'),

    // apple/android push notifications
    apn = require('apn'),
    gcm = require('node-gcm'),

    defaultLang, projectRoot,
    I18n = require('i18n-2'),
    i18n,
    i18nOptions,
    User = null, // mongoose Model ref
    config; // app config


// APN PUSH CONFIGS:
var
    APN_PRODUCTION = true,
    gateway,
    cert,
    key;

if(APN_PRODUCTION) {
    gateway = 'gateway.push.apple.com';
    cert    = projectRoot + 'server/ssl/ck.pem';
    key     = projectRoot + 'server/ssl/ck.pem';
}
else {
    gateway = 'gateway.sandbox.push.apple.com';
    cert    = projectRoot + 'server/ssl/ck_dev.pem';
    key     = projectRoot + 'server/ssl/ck_dev.pem';
}


// fallback language
defaultLang = 'en';

// app global i18n options
i18nOptions = {
    defaultLocale: 'en',
    // setup some locales - other locales default to en silently
    locales: ['en', 'de'],

    directory: projectRoot + 'server/locales',
    extension: '.json',

    // NOTE: soll bei nem fehler nicht gleich die ganze lang datei überschreiben !!!
    devMode: false // !!!    ENV !== 'production'
};

/**
 * The headers to be send on every response (needed for CORS)
 */
function setHeaders(req, res) {
    // res.header('Content-Type', 'application/json');
    // XXX!? res.header('Charset', 'utf-8');

    if(ENV !== 'test') {
        /*console.log('== headers ==');
        console.log(req.headers);
        console.log('== session ==');
        console.log(req.session);
        console.log('== user in session ==');
        console.log(req.user);*/
    }

    // NOTE: Bei phonegap ist req.headers.origin = "file:\\" oder so
    // funktioniert aber, nur wildcard "*" ist nicht erlaubt...
    // see https://developer.mozilla.org/en-US/docs/HTTP/Access_control_CORS
    // "The Access-Control-Allow-Origin header should contain the value
    // that was sent in the request's Origin header."
    // res.header('Access-Control-Allow-Origin', req.headers.origin);

    // UPDATE: wir brauchen keine Cookies!
    res.header('Access-Control-Allow-Origin', '*');
    // res.header('Access-Control-Allow-Credentials', true);

    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');

    // 24 hours cache preflight requests
    // http://www.w3.org/TR/cors/#http-access-control-max-age
    res.header('Access-Control-Max-Age', '86400');

    res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Content-Language, Authorization');
}

// Global 'sandbox' object
var app = {
    PROJECT_ROOT: projectRoot,
    defaultLang: defaultLang,
    apiVersion: '/api/v1',

    i18nOptions: i18nOptions,

    SALT: (ENV === 'test') ? ENV : null, // see setEncryptionSalt()

    // init manually without express
    initI18n: function () {
        i18n = new I18n(i18nOptions);
    },

    // singleton style
    getI18nInstance: function () {
        if(!i18n) {
            app.initI18n();
        }
        return i18n;
    },

    setEncryptionSalt: function(salt) {
        app.SALT = salt;
    },

    setUserModel: function(UserModel) {
        User = UserModel;
    },
    setConfig: function(configIn) {
        config = configIn;
    },

    /**
     * Try to get the API TOKEN from the basic auth string (password field)
     */
    getAPITokenFromHttpBasicAuthRequestHeader: function(req) {
        // FETCH THE TOKEN FROM BASIC AUTH
        var headerAuth = req.headers.authorization;

        if(!headerAuth) {
            return false;
        }
        else {
            // Split on a space, the original auth looks like  "Basic Y2hhcmxlczoxMjM0NQ==" and we need the 2nd part
            var tmp = headerAuth.split(' ');

            var buf        = new Buffer(tmp[1], 'base64'); // create a buffer and tell it the data cominginis base64
            var plain_auth = buf.toString();               // read it back out as a string

            // console.log('=====> Decoded Authorization HEADER', plain_auth);

            // At this point plain_auth = "username:password"
            var creds = plain_auth.split(':');      // split on a ':'
            // the password is the api token (-;
            return {
                username:  creds[0],
                API_TOKEN: creds[1]
            };
        }
    },

    /**
     * Express API-AUTH middleware helper function
     *
     * Can be used by every route handler, which needs
     * authentication first
     *
     * On every request, we check the authorization header
     * and api token from the request headers
     *
     * Help from:
     * https://gist.github.com/charlesdaniel/1686663
     *
     * Example usage:
     *
     * app.get('/awesome/route', application.checkAuth, fn)
     */
    checkAuth: function(req, res, next) {
        var body = '';
        try {
            body = JSON.stringify(req.body);
            body += req.params;
        } catch(e) {}

        // default "no-auth" log message
        var msg = 'Secured request not authenticated. URL: ' + req.url + ' req.body: ' + body +
            ' FROM: ' + req.connection.remoteAddress;

        // WE GET 2 relevant header values here: Basic Auth and Content-Language
        // 1. get the basic authorization header
        var headerAuth = app.getAPITokenFromHttpBasicAuthRequestHeader(req);

        // 2. the request's language
        var lang = req.headers['content-language'] || defaultLang;
        req.i18n.setLocale(lang);

        // 401 Unauthorized
        // @read http://en.wikipedia.org/wiki/List_of_HTTP_status_codes#4xx_Client_Error
        // "Similar to 403 Forbidden, but specifically for use when authentication
        // is required and has failed or has not yet been provided... The response
        // must include a WWW-Authenticate header field containing a challenge
        // applicable to the requested resource..."
        var returnUnauthorizedResponse = function(req, res, msg) {
            res.setHeader('WWW-Authenticate', 'Basic realm="AtOneGo REST API"');
            return app.sendDefaultError(req, res, msg, msg, 401);
        };

        if(!headerAuth) {
            return returnUnauthorizedResponse(req, res, msg);
        }
        else {
            // (-;
            if(headerAuth.username !== 'AtOneGo') {
                return returnUnauthorizedResponse(req, res, msg);
            }
        }

        if(headerAuth.API_TOKEN && typeof headerAuth.API_TOKEN !== 'undefined') {
            // console.log('============== CHECKING API_TOKEN FROM HEADERS: ' + API_TOKEN);

            // try to get the user ID from the token
            var userID = app.parseRemembermeToken(app.SALT, headerAuth.API_TOKEN);

            User.findById(userID, function(err, user) {
                if(err) {
                    utils.handleError(err);
                }

                if(user) {
                    // console.log('... which is the user: ' + user.email);

                    // just set the user for this request ! (-;
                    req.user = user;

                    // ===== UPDATE THE SECRET REMEMBER ME TOKEN =====
                    // hmm, nur beim login wird dieser einmalig generiert!?
                    // app.storeRemembermeToken(app.SALT, user, req, res);
                    return next();
                }
                else {
                    return returnUnauthorizedResponse(req, res, msg);
                }
            });
        }
        else {
            return returnUnauthorizedResponse(req, res, msg);
        }
    },

    /**
     * Every REST Controller can use this method to send a JSON (CORS) response
     * if an error was detected (default status code 500)
     */
    sendDefaultError: function(req, res, err, msg, status) {
        if(arguments.length < 4) {
            return utils.handleError('application.sendDefaultError() -> not enough arguments');
        }

        if(err) {
            utils.handleError(err);
        }

        setHeaders(req, res);

        // res.send('HI!!!!!!!!!!');
        return res.json({message: msg}, status || 500);
    },

    /**
     * Every REST Controller can use this method to send a JSON (CORS) response with
     * custom data and status code
     */
    sendDefaultSuccess: function(req, res, data, statusCode) {
        if(arguments.length < 2) {
            return utils.handleError('application.sendDefaultSuccess() -> not enough arguments');
        }

        if(!data) {
            data = {};
        }

        if(!statusCode) {
            statusCode = 200;
        }

        setHeaders(req, res);

        return res.json(data, statusCode);
    },

    setLanguageFromSocketRequest: function (handshakeData) {
        var lang;

        if(handshakeData.cookie && handshakeData.cookie.i18next) {
            lang = handshakeData.language || handshakeData.cookie.i18next;
            i18n.setLocale(lang);
        } else {
            i18n.setLocale(defaultLang);
        }
    },

    // Globale io error handling helper
    // used by all IO supporting controllers
    handleIOError: function (err, ioCallback) {
        var data,
            msg,
            key = 'error'; // default language key

        if(err.key) {
            key = err.key; // from a model?
        }

        // translate
        msg = i18n.__(key);

        data = {
            message: msg
        };

        ioCallback(data); // Der 2. Parameter muss leer sein!
    },

    // Generate an API TOKEN
    // Beispiel - UserID + Zufallszeichenkette:
    // 1. "5190ebb067c1601f59000002|rand0mStr"
    // wird zu:
    // 2. "445001ed422b06638bbad677d44ed80574a31424a64c548c1c49d3816515c9c885fd76ff17671c3db62832d16cefb137"
    // wieder entschlüsselt:
    // 3. "5190ebb067c1601f59000002|rand0mStr"
    getRemembermeToken: function(salt, user, req /*, res*/) {
        // auth and same user?
        if(!(req.isAuthenticated() && req.user._id.toString() === user._id.toString())) {
            return false;
        }

        var token = user._id.toString();

        var expiresDate      = moment().add('days', 30).toDate();
        var expiresTimestamp = expiresDate.getTime() + '';

        var SECRET_TOKEN = token + '|' + utils.randomString(64) + '|' + expiresTimestamp;
        var API_TOKEN = utils.encrypt(salt, SECRET_TOKEN);
        // to decrypt:
        // var decVal = utils.decrypt(salt, API_TOKEN);

        // console.log('=== GENERATED SECRET "API TOKEN": ' + SECRET_TOKEN,
        //     ' encrypted: ', API_TOKEN, req.url, '\nexpires:\n', expiresDate.toString());

        return API_TOKEN;
    },

    /**
     * Decrypt the remember me token value and get the user id
     *
     * -> on every request ! We do not use cookies.
     *
     * @see getRemembermeToken
     * @return mixed userID | null
     */
    parseRemembermeToken: function(salt, token) {
        if(!salt || !token || _.isUndefined(salt) || _.isUndefined(token)) {
            return null;
        }

        try {
            // console.log('API Token to decrypt is: ' + token);

            var decVal = utils.decrypt(salt, token);

            if(!decVal) {
                return null;
            }

            var arr = decVal.split('|'); // [userID, rand0mString, expiresTimestamp]

            // console.log('======================= PARSING SECRET API TOKEN: ', arr);

            if(arr.length === 3) {
                var userID = arr[0];

                // expires vorbereitet. token exchange dann XXX !?
                // var expiresTimestamp = arr[2];
                // var expires = moment(parseInt(expiresTimestamp, 10));
                // var today   = moment();
                // var diff    = expires.diff(today);
                // console.log('EXPIRES: ', diff < 0);
                // if(diff < 0) {
                    // XXX expired token!?
                // }

                return userID;
            }
        }
        catch(e) {
            utils.handleError(e.stack ? e.message + e.stack : e);
        }

        return null;
    },

    /**
     * Send a APN PUSH notification to all device-token(s) of one user
     */
    sendAPN_PUSH: function(user, message, type) {
        if(!config.production) {
            return false;
        }

        var passphrase = config.production.APN_PUSH_PASSPHRASE;
        var tokens     = user.device_tokens;

        if(typeof message !== 'string') {
            message = message + '';
        }

        message = message.replace(/'/g, '');
        message = message.replace(/"/g, '');

        // "The maximum size allowed for a notification payload is 256 bytes;"
        if(message.length > 200) {
            message = message.substr(0, 200);
        }

        if(tokens.length === 0) {
            // console.log('NOTE - THIS USER HAS NO DEVICE TOKENS: ' + user.email);
            return false;
        }

        tokens.forEach(function(token) {
            var myDevice = new apn.Device(token);
            var note     = new apn.Notification();

            note.device     = myDevice;

            // XXX
            // note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.

            note.badge      = 1;
            note.sound      = 'notification-beep.wav'; // muss sein, sonst kein sound
            note.alert      = message; // \uD83D\uDCE7   ✔ == \u2714

            // the phonegap "push-plugin" cannot read this at all?
            if(typeof type === 'string')  {
                note.payload = {'type': type};
            }

            // the apn error callback
            var errorCallback = function(errorNum, notification) {
                utils.handleError('APPLE PUSH NOTIFICATION ERROR. Result from push server is: ' +
                    errorNum + ' noti: ' + JSON.stringify(notification) + ' user to send is: ' + user.email +
                    ' message is ' + message);
            };

            var apnsConnection = new apn.Connection({
                gateway:        gateway,
                errorCallback:  errorCallback,
                cert:           cert,
                key:            key,
                passphrase:     passphrase,
                port:           2195,
                enhanced:       true,
                cacheLength:    100
            });

            apnsConnection.sendNotification(note);

            console.log('>>>>>>>>>> APN NOTIFICATION SENT TO ' + user.email + ' device-token is: ' +
                token + ' Message: ' + message);
        });
    },

    /**
     * Check for invalid Apple device tokens periodically
     * and remove from user
     *
     * XXX push
     */
    initAPNFeedbackPolling: function() {
        if(!config.production) {
            return false;
        }

        var passphrase = config.production.APN_PUSH_PASSPHRASE;

        if(!passphrase) {
            console.log('INIT APN FEEDBACK POLLING: NO PASSPHRASE');
            return false;
        }

        function callback2(a, b) {
            console.log('ERROR application.initAPNFeedbackPolling()', a, b);
        }

        var options = {
            // dev only:
            // address : 'feedback.sandbox.push.apple.com',
            // address: gateway,
            'batchFeedback': true,
            'interval':     300, // interval seconds

            errorCallback:  callback2,
            cert:           cert,
            key:            key,
            passphrase:     passphrase
        };

        var feedback = new apn.Feedback(options);
        feedback.on('feedback', function(devices) {
            var msg = '=====> FEEDBACK POLLING! devices: ' + devices.length;

            console.log(devices);

            devices.forEach(function(item) {
                // Do something with item.device and item.time
                console.log('------------------------------', item);
                msg += ' DEVICE: ' + item.device + ' at ' + item.time;

                // find the user with this token and remove the token
                User.removeTokenFromUser(item.device, function(err, success) {
                    if(err) {
                        utils.handleError(err);
                    }
                    else {
                        console.log(success ? 'NICE ONE' : 'SHIT');
                    }
                });
            });

            // send a mail now...
            utils.sendMail('info@at-one-go.com', 'mail@mwager.de', 'apn feedback polling', msg);
        });
    },

    /**
     * Send out a gcm message using "node-gcm"
     */
    send_GCM_PUSH: function(user, msg) {
        if(!config.production) {
            return false;
        }

        var API_KEY         = config.production.GCM_API_KEY;
        var registrationIds = user.gcm_registration_ids || [];

        if(typeof msg !== 'string') {
            msg = msg + '';
        }

        msg = msg.replace(/'/g, '');
        msg = msg.replace(/"/g, '');

        // create "gcm message" object
        var message = new gcm.Message({
            collapseKey: 'aog',
            delayWhileIdle: true,
            timeToLive: 3,
            data: {
                key1: msg
            }
        });

        var sender = new gcm.Sender(API_KEY);

        // At least one required
        if(registrationIds.length === 0) {
            return false;
        }

        /**
         * Parameters: message-literal, registrationIds-array, No. of retries, callback-function
         */
        sender.send(message, registrationIds, 4, function (err, result) {
            console.log('result of gcm push:');
            console.log(result);

            if(!err) {
                console.log('>>>>>>>>>> APN NOTIFICATION SENT TO ' + user.email + ' reg_ids are: ' +
                    registrationIds.join(', ') + ' Message: ' + message);
            }
            else {
                console.log('error?');
                console.log(err);
            }
        });
    }
};

module.exports = app;
