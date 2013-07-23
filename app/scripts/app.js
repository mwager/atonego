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
 * configs, helpers, i18n, global error handling,
 * global event handling etc.
 *
 * Inspired by the todomvc project (todomvc.com, backbone-require)
 *
 * @author Michael Wager <mail@mwager.de>
 */
define(function (require) {
    'use strict';

    var
        version = require('version'),
        $       = require('zepto'),

        moment = require('moment'),
        common = require('common'),

        User = null, // NOT POSSIBLE! require('models/user'),

        _        = require('lodash'),
        Backbone = require('backbone'),

        // init localization and language files
        i18n        = require('i18next'),
        de          = require('libs/locales/de/translation'),
        en          = require('libs/locales/en/translation'),
        defaultLang = 'en';

    /**
     * Check if the phonegap API is available
     *
     * IMPORTANT: we want to use this function BEFORE the "deviceready"
     * event has fired, so we just check for the global "window.cordova"
     * here, which gets exported before the device is ready
     *
     * @return {bool} True if typeof window.cordova not undefined
     */
    function isPhonegapAvailable() {
        return !_.isUndefined(window.cordova);
    }

    /**
     * Detect if the app's running via phonegap or in the browser
     *
     * @return {Boolean} True if no phonegap API available
     */
    function isBrowser() {
        if(isPhonegapAvailable()) {
            return false;
        }

        return true;
    }

    /**
     * Detect tablets using the user agent )-:
     *
     * @see http://googlewebmastercentral.blogspot.de/2011/03/mo-better-to-also-detect-mobile-user.html
     *
     * @return {Boolean} True if tablet
     */
    function isTablet() {
        if(isBrowser()) {
            return false;
        }

        var ua = navigator.userAgent.toLowerCase();

        log('user agent: ' + ua);

        var isIPAD          = (/(iPad)/).test(ua)    && (/AppleWebKit/).test(ua);
        var isAndroidTablet = !(/(mobile)/).test(ua) && (/android/).test(ua); // XXX is this enough?

        return isIPAD || isAndroidTablet;
    }

    /**
     * http://stackoverflow.com/questions/3007480/determine-if-user-navigated-from-mobile-safari
     * @return {Boolean} True if mobile browser like safari (using user agent...dev only)
     */
    function isiOSBrowser() {
        var ua = navigator.userAgent;

        if(isPhonegapAvailable()) {
            return false;
        }

        return (/(iPod|iPhone|iPad)/).test(ua) && (/AppleWebKit/).test(ua);
    }

    /**
     * http://stackoverflow.com/questions/3007480/determine-if-user-navigated-from-mobile-safari
     * @return {Boolean} True if mobile browser like safari (using user agent...dev only)
     */
    function isMobileBrowser() {
        var ua = navigator.userAgent;

        if(isPhonegapAvailable()) {
            return false;
        }

        var isIOSBrowser     = isiOSBrowser();
        var isAndroidBrowser = (/Android/).test(ua); // XXX TODO

        return isIOSBrowser || isAndroidBrowser;
    }

    /**
     * Detect language in phonegap or browser
     *
     * @param callback gets a lang string like 'en' or 'de' (default 'en')
     */
    function detectLang(callback) {
        var lang = common.store.get('app-language');

        var preCheck = function (lang) {
            lang = $.trim(lang).toLowerCase();

            log('========= LANGUAGE PRE CHECK ======== LANGUAGE IS: ' + lang);

            if((/en/).test(lang)) {
                lang = 'en';
            }

            if((/deutsch/).test(lang)) {
                lang = 'de';
            }

            if(lang !== defaultLang && lang !== 'de') {
                lang = defaultLang;
            }

            common.store.set('app-language', lang);
            app.lang = lang;

            if(app.user && typeof app.user.set === 'function') {
                app.user.set('lang', lang, {silent: true});
            }

            return callback(lang);
        };

        if(lang) {
            return callback(lang);
        }

        // browser environment
        if(_.isUndefined(navigator.globalization)) {
            if(!lang) {
                lang = navigator.userLanguage || navigator.language || defaultLang;
            }

            preCheck(lang);
        } else { // phonegap environment
            navigator.globalization.getPreferredLanguage(
                function (language) {
                    lang = language.value;
                    preCheck(lang);
                }, function () {
                    return callback(defaultLang); // error, fallback to "defaultLang"...
                });
        }
    }


    var isPhantomJS      = /phantomjs/.test(navigator.userAgent.toLowerCase());

    // NOTE: Bei Ausführung der Tests via PhantomJS/CasperJS ist Modernizr.touch = true
    var isMobile         = __app_config__.touch && !isPhantomJS;

    // wir befinden uns in einem mobilen browser (nicht phonegap)
    var isMobile_Browser = isMobile && isMobileBrowser();



    // Provide a global location to place configuration
    // settings and module creation.
    var app = {
        VERSION:        version,
        API_ROOT:       __app_config__.API_ROOT,
        AJAX_TIMEOUT:   60000, // one minute

        // The root path to run the application. (pushState only)
        root: __app_config__.APP_ROOT,

        // default "click" event ("click" or "tap" on mobile)
        defaultClickEvent: __app_config__.defaultClickEvent,

        // Global user object
        user:       null,
        isLoggedIn: false,

        // NOTE: the right phonegap js file per platform has to be included
        // @see Makefile
        isMobile:            isMobile,
        isPhantomJS:         isPhantomJS,
        isBrowser:           isBrowser(),
        isMobile_Browser:    isMobile_Browser,
        isiOSBrowser:        isiOSBrowser(),
        isPhonegapAvailable: isPhonegapAvailable(),
        isTablet:            isTablet(),

        // @see initApp()
        isIOS:     false,
        isAndroid: false,

        activities: [],

        // Global SocketIO wrapper class
        socketWrapper: null
    };

    // Mix Backbone.Events, modules, and layout management into the app
    // object.
    app = _.extend(app, {
        // Create a custom object with a nested Views object.
        module: function (additionalProps) {
            return _.extend({
                Views: {}
            }, additionalProps);
        },

        // see main.js on top
        setUserModel: function(UserModel) {
            User = UserModel;
        },

        /**
         * App-global error helper
         */
        handleError: function(err, isFatal) {
            if(typeof err !== 'string') {
                err = err + '';
            }

            // log the error to the console
            log('app.handleError() -> ' + err);

            if(!isFatal) {
                return false;
            }

            // send this error silently to our server if possible
            $.ajax({
                type:       'POST',
                dataType:   'json',
                url:        app.API_ROOT + '/api/v1/logs',
                data:       {m: err}
            });
        },

        /**
         * Init language support
         *
         * Sprache wird via phonegap oder browser erkannt
         * TranslateTool ist i18next.js
         * LanguageFiles werden via ajax geladen, sobald geladen trigger
         * ich ein app event, dann können alle views nochmal neu-gerendert
         * werden
         */
        initGlobalization: function () {
            detectLang(function (lang) {

                // set momentjs language
                moment.lang(lang);

                i18n.init({
                    customLoad: function (lng, ns, options, loadComplete) {
                        // log(__app_config__.BASE_URL + 'locales/' + lng + '/translation.json')
                        switch(lng) {
                        case 'de':
                            loadComplete(null, de);
                            break;
                        case 'en':
                            loadComplete(null, en);
                            break;
                        default:
                            loadComplete(null, en);
                        }

                        // NACH loadComplete callback !
                        app.trigger('translationsLoaded');
                    },

                    // debug                  :__app_config__.ENV !== 'production',
                    // resGetPath                :__app_config__.BASE_URL + '
                    // locales/__lng__/translation.json', // __ns__
                    lng:                          lang,
                    // load                      :lang,
                    fallbackLng: defaultLang,

                    useLocalStorage: false // __app_config__.ENV === 'production',
                    // localStorageExpirationTime: 86400000 // 86400000 => in ms, default 1 week
                });
            });
        },

        /**
         * Change the language of the app
         * @param string lang e.g. 'en' or 'de'
         */
        changeLang: function (lang) {
            // log('CHANGE LANG to ' + lang + ' from ' + app.lang);
            if(lang === app.lang) {
                return false;
            }

            app.lang = lang;

            if(lang !== 'en' && lang !== 'de') {
                app.lang = 'en';
            }

            common.store.set('app-language', app.lang);
            moment.lang(app.lang);

            i18n.init({
                lng: app.lang // triggers translationsLoaded
            });
        },

        /**
         * Try logging the user in
         *
         * @param callback
         */
        login: function (email, password, callback) {
            $.ajax({
                cache:      false,
                timeout:    app.AJAX_TIMEOUT,
                type:       'POST',
                dataType:   'json',
                data: {
                    email: email,
                    password: password
                },
                url: app.API_ROOT + '/api/v1/login',
                success: function (json) {
                    if(json.error || json.message) {
                        return callback(json.error || json.message);
                    }

                    app.router.setAuthenticated(json);

                    return callback(null, true);
                },
                error: function () {
                    return callback(__('loginError'));
                }
            });
        },

        fetchUser: function(fetchedCB) {
            if(!app.user) {
                return typeof fetchedCB === 'function' ? fetchedCB('no user') : false;
            }

            // is the request still running?
            if(app.isStillFetchingUser === true) {
                return typeof fetchedCB === 'function' ? fetchedCB('still fetching') : false;
            }

            var inviteLenOld = app.user.get('invite_list_ids'); // typeof Array
            if(inviteLenOld) {
                inviteLenOld = inviteLenOld.length;
            }

            app.isStillFetchingUser = true;

            // auch den user müssen wir neu holen (zB wegen active! wurde ggf via mail aktiviert)
            app.user.fetch({
                success: function(model, userJSON) {
                    app.isStillFetchingUser = false;

                    // update token
                    app.API_TOKEN = userJSON.API_TOKEN;

                    log('>>> fetched user in backgrnd ' + userJSON.email + ' API TOKEN: ' + userJSON.API_TOKEN);

                    // update the todolists collection
                    app.todolists.reset();
                    app.todolists.add(userJSON.todolists);

                    app.storage.storeUser(userJSON/*, function () {
                        // NO!!! wir rendern so ggf sinnlos eine große view erneut.
                        // view which are listening for the user model, will
                        // re-render them autom.
                        if(app.router.currentView) {
                            app.router.currentView.render();
                        }
                    }*/);

                    var inv = userJSON.invite_list_ids;
                    if(inv) {
                        inv = inv.length;
                    }

                    // notify the user if NEW invitations are comming in,
                    // they are stored locally now, so next time the message
                    // will not appear again
                    if(inv > inviteLenOld) {
                        common.dialog(__('newIns'));
                    }

                    if(typeof fetchedCB === 'function') {
                        fetchedCB(null, userJSON);
                    }
                },
                error: function() {
                    app.isStillFetchingUser = false;

                    if(typeof fetchedCB === 'function') {
                        fetchedCB(true); // "first param set === error"
                    }
                }
            });
        },

        /**
         * Check if device is connected to internet
         *
         * hmm https://issues.apache.org/jira/browse/CB-1807 XXX
         *
         * @see http://docs.phonegap.com/en/2.4.0/cordova_connection_connection.md.html
         */
        checkInternetConnection: function () {
            // browser: always true
            if(_.isUndefined(navigator.connection)) {
                return true;
            }

            var con = navigator.connection;

            // log('CONNECTION: ' + JSON.stringify(con));
            // https://issues.apache.org/jira/browse/CB-1807
            // DANN IST CORDOVA NICHT EINGEBUNDEN !!! hmm...
            if(app.isAndroid && con.type === 0) {
                return true;
            }

            // XXX android, sometimes I hate you
            if(app.isAndroid) {
                return true;
            }

            // phonegap: navigator.connection.type
            if(!con.type || con.type === 'none' || con.type === 'unknown') {
                return false;
            }

            return true;
        },

        /**
         * Init and register the push notification plugin
         * "This should be called as soon as the device becomes ready"
         *
         * NOTE:
         * if the received payload has too much "'" signs, apple will send it to
         * the device, but the JSON parser will then fail with an uncaught exception
         * So, watch out for clean messages.
         *
         * NOTE2: (XXX)
         * This method is pretty long and ugly, consider refactoring
         * (caused by platform specific code)
         *
         * @see https://github.com/phonegap-build/PushPlugin
         */
        initAndRegisterPushNotifications: function () {
            if(!window.plugins || !window.plugins.pushNotification) {
                return false;
            }

            // XXX module?
            app.pushNotification = window.plugins.pushNotification;

            var opts;

            // custom logic must be executed on every push receive (ios/android)
            var customReceiveHook = function() {
                // if we are on a site of todos, fetch again
                if(app.todosContainer) {
                    app.todosContainer.refetchTodos();
                }

                setTimeout(function() {
                    // we must fetch the user here (e.g. new invitation)
                    // XXX check if custom data possible via #push-plugin
                    // node-apn supports custom payload!
                    app.fetchUser();
                }, 200);
            };

            // PUSH Plugin "register error handler" (iOS and Android)
            var errorHandler = function(err) {
                log('GCM PUSH ERROR: ');
                app.handleError(err);
            };

            // we add the token to our server via "PATCH /users/:id"
            var sendTokenToServer = function(token) {
                var u = new User();
                var d = {
                    _id: app.user.get('_id'),
                    apn_device_token: token
                };

                // just send...
                u.save(d, {
                    patch: true
                    // success: function() {}
                });
            };

            // we add the regID to our server via "PATCH /users/:id"
            var sendRegIDToServer = function(regID) {
                var u = new User();
                var d = {
                    _id: app.user.get('_id'),
                    gcm_reg_id: regID
                };

                // just send...
                u.save(d, {
                    patch: true
                    // success: function() {}
                });
            };

            // --- notification callback handlers ---
            // MUST BE GLOBAL!?!?

            // iOS handler gets called if app is open (sadly, this must be global...)
            window.onNotificationAPN = function(evnt) {
                // log(evnt.payload, evnt, evnt.alert);

                // we do not support sound yet...
                // if (evnt.sound) {
                //     var snd = new Media(evnt.sound);
                //     snd.play();
                // }

                customReceiveHook();

                if (evnt.alert) {
                    common.vibrate(500, app.user.get('notify_settings'));

                    // show a short notify and add the message
                    // to the activity collection
                    common.notify(evnt.alert, 20000);

                    app.activityCollection.addActivity({
                        key: 'push_notification',
                        data: {
                            body:      evnt.alert,
                            timestamp: new Date().getTime()
                        }
                    });
                }

                if (evnt.badge) {
                    app.pushNotification.setApplicationIconBadgeNumber(function success() {
                        // log('ok set the badge......'); // XXX TODO raus
                    }, function error(e) { log(e); }, evnt.badge);
                }

                // custom data
                // the phonegap "push-plugin" cannot read this at all?
                // ------- however:
                // NOT NEEDED, resume should be enough
                /*if (evnt.payload && evnt.payload.type) {
                    if(evnt.payload.type === 'invitation') {
                        app.fetchUser();
                    }
                }*/
            };

            // Android handler
            window.onNotificationGCM = function(e) {
                switch( e.event ) {
                case 'registered':
                    if ( e.regid.length > 0 ) {
                        setTimeout(function() {
                            sendRegIDToServer(e.regid);
                        }, 1000);

                        // Your GCM push server needs to know the regID before it can push to this device
                        // here is where you might want to send it the regID for later use.
                        log('REGISTERED -> REGID:' + e.regid);
                    }
                    break;

                case 'message':
                    customReceiveHook();

                    var msg = e && e.payload ? e.payload.message : 'no message';

                    // log(JSON.stringify(e));

                    // if the foreground flag is set, this notification happened while we were in the foreground.
                    // you might want to play a sound to get the user's attention, throw up a dialog, etc.
                    if (e.foreground || e.coldstart) {
                        // log('--INLINE NOTIFICATION--');

                        common.vibrate(500, app.user.get('notify_settings'));
                        common.notify(msg, 20000);

                        // if the notification contains a soundname, play it.
                        // TODO sound var my_media = new Media('/android_asset/www/' + e.soundname);
                        // my_media.play();
                    }
                    // otherwise we were launched because the user touched a notification in the notification tray.
                    /*else {
                        if (e.coldstart) {
                            // log('-COLDSTART NOTIFICATION--');
                        }
                        else {
                            // log('-BACKGROUND NOTIFICATION--');
                        }
                    }*/

                    // in all cases:
                    app.activityCollection.addActivity({
                        key: 'push_notification',
                        data: {
                            body:      msg,
                            timestamp: new Date().getTime()
                        }
                    });

                    break;

                case 'error':
                    log('onNotificationGCM ERROR: ' + e.msg);
                    app.handleError(e.msg, true);
                    break;

                default:
                    log('EVENT -> Unknown, an event was received and we do not know what it is');
                    break;
                }
            };

            if (app.isAndroid) {
                var successHandler = function() {
                    log('PUSH: =================> ANDROID PUSH SUCCESS');
                };
                opts = {
                    'senderID': '231725508602', // XXX not public?
                    'ecb':      'onNotificationGCM'
                };

                app.pushNotification.register(successHandler, errorHandler, opts);
            }
            else if(app.isIOS) {
                var tokenHandler = function(result) {
                    log('PUSH: ==> IOS PUSH SUCCESS -> token: ' + result);

                    // "Your iOS push server needs to know the token before
                    // it can push to this device..."
                    setTimeout(function() {
                        sendTokenToServer(result);
                    }, 1000);
                };

                opts = {
                    'badge': 'true',
                    'sound': 'true',
                    'alert': 'true',
                    'ecb':   'onNotificationAPN'
                };

                // am Besten die apple docs
                log('#register call now................................................');
                // return app.pushNotification.register(tokenHandler, errorHandler, opts);

                var unregisterErrHandler = function(a, b) {
                    log('====== UNREGISTER ERROR ======');
                    log(a);
                    log(b);
                    app.pushNotification.register(tokenHandler, errorHandler, opts);
                };

                var unregisterHandler = function(a, b) {
                    log('====== UNREGISTER FIRST ======');
                    log(a);
                    log(b);

                    log('=========> REGISTERING IOS PUSH...');
                    app.pushNotification.register(tokenHandler, errorHandler, opts);
                };

                // "Since such invalidations are beyond your control, its
                // recommended that, in a production environment, that you
                // have a matching unregister() call, for every call to register(),
                // and that your server updates the devices' records each time."
                app.pushNotification.unregister(unregisterHandler, unregisterErrHandler);
            }
        },

        /**
         * Unregister push on "deauthenticate"
         */
        unregisterPUSHNotifications: function() {
            if(!window.plugins || !window.plugins.pushNotification) {
                return false;
            }

            if(!app.pushNotification) {
                return false;
            }

            app.pushNotification = null;

            var noop = function() {};

            // XXX have an eye on this....
            /*var deleteRegID_OR_APN_Token_On_Server = function() {
                var u = new User();
                var d = {
                    _id: app.user.get('_id'),
                    delete_push_token: true
                };

                // just send...
                u.save(d, {
                    patch: true
                    // success: function() {}
                });
            };
            deleteRegID_OR_APN_Token_On_Server();*/

            window.plugins.pushNotification.unregister(noop, noop);
        }

    }, Backbone.Events);

    // export public api
    return app;
});
