/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * Main js initializer (requirejs' main dependency, see config*.js)
 *
 * - window.onerror handling
 * - application bootstrapping (app globals, router...)
 * - global dom/event bindings (routing/navigation, android events...)
 *
 * @author Michael Wager <mail@mwager.de>
 */

/**
 * Global window error handling
 *
 * In production, we want to prevent browsers from doing anything
 * on uncaught errors, so we can handle them ourself.
 */
window.onerror = function window_onerror(errorMsg, url, lineNumber) {
    'use strict';

    var msg  = 'THIS IS A GLOBAL ERROR (window.onerror) --> ',
        msg2 = errorMsg + ' ' + url + ' on line ' + lineNumber +
               ' ENV: ' + __app_config__.ENV + ' ua ' + navigator.userAgent;

    msg = msg + msg2;

    /**** g lobal al ert : true*/
    // alerting global uncaught errors can be VERY HELPFUL WHILE
    // TESTING ON REAL DEVICES
    // if(__app_config__.touch) {
    //     alert('THIS IS A GLOBAL F*** ERROR: ' + errorMsg +
    //         ' IN FILE ' + url + ' LINE NUMBER: ' + lineNumber);
    // }

    log(msg);

    // this error will be sent to our server
    // for logging purpose if possible
    require(['app'], function(app) {
        app.handleError(msg2, true);
    });

    // returning "true" in production prevents
    // browsers from doing anything
    return __app_config__.ENV === 'production';
};

require([
    'app',
    'i18next',
    'zepto',
    'lodash',
    'backbone',
    'common',
    'router',
    'models/user',
    'collections/todos',
    'collections/todolists',
    'collections/activities',
    // 'classes/socketio_wrapper', not used anymore
    'libs/storage',
    'mobiscroll',
    'JrFork'
], function (app, i18n, $, _, Backbone, common, AppRouter, User, Todos, Todolists,
    ActivityCollection, /*SocketIOWrapper,*/ Storage, mobiscroll, JrFork) {
    'use strict';

    // ----- some pre-configuration -----

    // The translate function must be global (e.g. for use in views)
    window.__ = i18n.t; // set this globally ! (no budget, XXX)

    // The app-global click event name:
    // "click" or "tap" on mobile devices
    var clickEvent = app.defaultClickEvent;

    (function __configureApp() {
        // cannot require the User Model within the app module...
        app.setUserModel(User);

        // hold a global ref to the !instance! of the todos collection
        app.todosCollectionInstance = Todos;

        // Global client-only used collection for own "PUSH events"
        app.activityCollection = new ActivityCollection();
    }());

    // configure all AJAX requests CORS and HTTP Basic Auth
    (function __configureGlobalAJAXSettings() {
        // ----- 1. configure zepto's ajax settings -----
        // Global zepto ajax config & CORS support using withCredentials
        $.ajaxSettings.timeout = app.AJAX_TIMEOUT;

        // configure zepto's ajax to send the API TOKEN on every request
        $.ajaxSettings.beforeSend = function(xhr) {
            // see https://github.com/madrobby/zepto/issues/274
            // we do not use cookies
            // xhr.withCredentials = true;

            // log('setting basic auth header with "API_TOKEN": ' + app.API_TOKEN);

            var username = 'AtOneGo';
            var authStr  = 'Basic ' + common.base64Encode(username + ':' + app.API_TOKEN);
            xhr.setRequestHeader('Authorization', authStr);

            xhr.setRequestHeader('Content-Language', app.lang || 'en');

            // no connection? no ajax.
            if(!app.checkInternetConnection()) {
                common.hideLoader();
                return false;
            }

            // set custom user agent XXX ?
            // xhr.setRequestHeader ('User-Agent', 'AtOneGo-App - ' + navigator.userAgent);
        };

        // ----- 2. overwrite Backbone's sync() to support cross domain requests -----
        var proxiedSync = Backbone.sync;

        Backbone.sync = function(method, model, options) {
            if(!options) {
                options = {};
            }

            if (!options.crossDomain) {
                options.crossDomain = true;
            }

            var url = _.isFunction(model.url) ? model.url() : model.url;
            log('===== BACKBONE CORS SYNC #' + method.toUpperCase() + ' ' + url + ' ');

            return proxiedSync(method, model, options);
        };
    })();



    /**
     * Custom window.history.back wrapper
     *
     * @return {[type]} [description]
     */
    function goBack() {
        // prevent navigation if we are still animating...
        if(JrFork.Navigator.isAnimating) {
            return false;
        }

        // remember the last route
        app.router.setLastRoute(Backbone.history.fragment);
        window.history.back();
    }

    /**
     * On all links with a "href" attribute we prevent
     * default and navigate via backbone
     * @return {[type]} [description]
     */
    function initGlobalNavigationHandlers($body) {
        $body.on(clickEvent, '.back-btn', function __historyBackNavigationHandler(evt) {
            evt.preventDefault();
            evt.stopPropagation();

            if(common.isScreenLocked()) {
                common.dialog(__('reallyLeave'), function(confirmed) {
                    if(confirmed) {
                        goBack();
                    }
                }, true);

                return false;
            }

            goBack();

            return false;
        });

        // All navigation that is relative should be passed through the navigate
        // method, to be processed by the router.
        // AUßERDEM:
        // WIR ÖFFNEN //NIEMALS// EXTERNE LINKS INNERHALB DER WEB-VIEW ! ! !
        // http://www.midnightryder.com/launching-external-urls-in-phonegap-again-phonegap-2-4-x/´
        $body.on(clickEvent, 'a', function __globalRouteNavigationHandler(evt) {
            var link = $(this),
                href = link.attr('href');

            // disabled state?
            if(link.attr('disabled')) {
                evt.preventDefault();
                evt.stopPropagation();
                return false;
            }

            // do nothing on <a href="#".../a>
            if(href === '#') {
                evt.preventDefault();
                evt.stopPropagation();
                return false;
            }

            // log('main.js http: ' + /http/.test(href));
            if(app.isMobile && (/http/.test(href) || /https/.test(href))) {
                if(app.isIOS) {
                    window.open(href, '_system');
                }

                // android only !
                else if(app.isAndroid && navigator.app) {
                    navigator.app.loadUrl(href, {
                        openExternal: true
                    });
                }

                // NIEMALS ÖFFNEN !!!
                return false;
            }
            else if(app.isBrowser && (/http/.test(href) || /https/.test(href))) {
                return true;
            }

            // alert(href && /#/.test(href) && href !== '#')
            // es muss ein hash in der url sein!
            if(href && /#/.test(href) && href !== '#') {
                evt.preventDefault();

                // remember the last route
                app.router.setLastRoute(Backbone.history.fragment);

                // `Backbone.history.navigate` is sufficient for all Routers and will
                // trigger the correct events. The Router's internal `navigate` method
                // calls this anyways.  The fragment is sliced from the root.

                // 1. old (own) approach
                // app.router.go(href);

                // 2. rachet/junior.js approach

                // slide from left or right:
                var dir = link.hasClass('back-link') ?
                    JrFork.Navigator.directions.RIGHT :
                    JrFork.Navigator.directions.LEFT;

                JrFork.Navigator.navigate(href, {
                    animation: {
                        type:      JrFork.Navigator.animations.SLIDE_STACK,
                        direction: dir
                    }
                });
            }

            // ein link darf AUF KEINEN FALL innerhalb der webview geöffnet werden
            return false;
        });
    }

    /**
     * Simulate :active state on lists and buttons via class ".pressed"
     */
    function simulateActiveState($body) {
        var ev;
        // 1. touchstart classes hinzu
        ev = __app_config__.touch ? 'touchstart' : 'mousedown';
        $body.on(ev, '.aog-button', function () {
            $(this).addClass('pressed');
        });
        $body.on(ev, '.aog-list li:not(.no-link)', function () {
            $(this).addClass('pressed-list');
        });

        $body.on(ev, '.aog-list li:not(.no-link) a', function () {
            $(this).parent().addClass('pressed-list');
        });

        // 2. touchmove und -end classes wieder weg
        ev = __app_config__.touch ? 'touchmove' : 'mousemove';
        $body.on(ev, '.aog-list li:not(.no-link), .aog-button', function () {
            $(this).removeClass('pressed');
            $(this).removeClass('pressed-list');
        });

        ev = __app_config__.touch ? 'touchend' : 'mouseup';
        $body.on(ev, '.aog-list li:not(.no-link), .aog-button', function () {
            $(this).removeClass('pressed');
            $(this).removeClass('pressed-list');
        });


        /*
        // klick auf anchors mit backgr images im header
        // XXX evtl später noch nen effekt hin!? #odernicht
        ev = __app_config__.touch ? 'touchstart' : 'mousedown';
        $body.on(ev, 'header a, #app-loader', function () {
            $(this).addClass('tapped');
        });

        ev = __app_config__.touch ? 'touchend' : 'mouseup';
        $body.on(ev, 'header a, #app-loader', function () {
            $(this).removeClass('tapped');
        });*/


        // also the header buttons


        // On click on any navigation link in the header bar,
        // we want to show some "active" state
        var toggleActiveStateOfLink = function(e) {
            var $el = $(e.currentTarget);
            $el.addClass('tapped');

            setTimeout(function() {
                if($el.length === 0) {
                    return false;
                }

                $el.removeClass('tapped');
            }, 500);
        };

        // on mousemove: remove the active state
        var removeActiveStateOfLink = function(e) {
            var $el = $(e.currentTarget);
            $el.removeClass('tapped');
        };

        // header und .modal-header
        ev = __app_config__.touch ? 'touchstart' : 'mousedown';
        $body.on(ev, 'header a, .modal-header a', toggleActiveStateOfLink);
        ev = __app_config__.touch ? 'touchmove' : 'mousemove';
        $body.on(ev,  'header a, .modal-header a', removeActiveStateOfLink);
        // NO! $body.on(__app_config__.touch ? 'touchend' : 'mouseup',
        //      'header a, .modal-header a', removeActiveStateOfLink);
    }

    /**
     * Stuff to do on mobile devices as soon as the
     * device (or the DOM ;-) is ready
     */
    function doMobileSpecificStuffOnDeviceReady($body) {
        if(!app || app.isMobile === false) {
            return false;
        }

        // scrolling: (XXX!?)
        // http://www.kylejlarson.com/blog/2011/fixed-elements-and-scrolling-divs-in-ios-5/
        /*document.addEventListener('touchmove', function(event) {
            if(event.target.parentNode.className.indexOf('noBounce') !== -1 ||
                event.target.className.indexOf('noBounce') !== -1 ) {
            event.preventDefault(); }
        }, false);*/

        // ------- PHONEGAP SPECIFIC STUFF FOLLOWS -------
        if(app.isIOS) {
            (function() {
                var $a = $('#app-container');
                $a.css('-webkit-backface-visibility', 'hidden');
                $a.css('visibility', 'visible');
            }());
        }

        // XXX
        /*if(app.isAndroid) {
            document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);
        }*/

        // if phonegap's API is not available: stop here.
        if(app.isBrowser) {
            return false;
        }

        // DAMN MOXXFXCXXN SOCKET IO !
        // The option "reconnect" defaults to true, this caused crashes on iphones
        // everytime the app was resumed from the background, because socket io was
        // trying to reconnect.
        // OUR Solution to this is: pause: disconnect, resume: re-connect manually
        // SEE: https://issues.apache.org/jira/browse/CB-2301
        var onPause = function() {
            __app_config__.isPaused = true;

            log('---> onPause ');

            // DISCONNECT SOCKET IO
            if(app.socketWrapper) {
                app.socketWrapper.disconnect(true);
            }
        };

        var onResume = function() {
            __app_config__.isPaused = false;

            log('---> onResume - app.isLoggedIn? ' + (app.isLoggedIn ? 'yes' : 'no!'));

            // do not connect if not logged in
            if(!app.isLoggedIn) {
                return false;
            }

            setTimeout(function() {
                /*
                // re-connect and re-subscribe
                "hey man, socket io does not really make much sense
                in a mobile todo app, does it?"
                apart from that, socketio 0.9.x is SO SHITTY! #crashes-on-ios
                 if(app.socketWrapper) {
                    app.socketWrapper.connect(app.API_TOKEN);
                    app.socketWrapper.once('connect_success', function() {
                        app.socketWrapper.subscribeToLists(app.todolists);
                    });
                }*/

                // we must re-fetch the user, maybe some data was changed
                // e.g. an invitation or smt
                app.fetchUser();
            }, 1000);
        };

        document.addEventListener('pause',  onPause, false);
        document.addEventListener('resume', onResume, false);

        $body.on('click', 'a', function (evt) {
            evt.preventDefault();
            return false;
        });
        $body.on('click', 'button', function (evt) {
            evt.preventDefault();
            // $(this).removeClass('active');
            return false;
        });

        // ----- android stuff -----

        // on android: overwrite back button actions
        /*** XXX later
        var onBackKey = function () {
            var route = Backbone.history.fragment;

            common.hideLoader();

            // WENN start view: EXIT
            if (_.isString(route) && (route.length === 0 || route === 'start')) {
                // navigator.app.exitApp(); // hmm native?
                return true;
            }

            return true;
        };*****/

        // on android: listen for the menu-button
        var onMenuKey = function () {
            if(app && app.isLoggedIn && app.router) {
                app.router.go('todolists');
            }
        };

        if(app.isAndroid) {
            // document.addEventListener('backbutton', onBackKey, false);
            document.addEventListener('menubutton', onMenuKey, false);
        }
    }

    /**
     * Preload our images
     */
    function preloadImages() {
        var image, i, len;
        var images = [
            'images/logo.png',
            'images/logo@2.png'
        ];

        len = images.length;
        for (i = 0; i < len; i++) {
            image = new Image();
            image.src = images[i];
        }
    }

    /**
     * Hide the splashscreen on device ready
     */
    /*function hideSplashScreen(isAuth) {
        setTimeout(function() {
            common.hideSplashscreen();
        }, isAuth ? 2000 : 500); // give some time to render!
    }*/

    /**
     * Init the application
     *
     * Called on "device ready" in a phonegap app or on DOM ready else
     */
    function initApp() {
        var isAuth = common.store.get('is-auth') === '1';

        var $doc = $(document),
            $body = $('body');

        // device detection first !
        // Note: we must wait for "deviceready" event to use the phonegap api
        // isMobile means "is phonegap app" (not on browsers on mob. devices)
        // NO. we now have app.isPhonegapAvailable
        // app.isMobile  = app.isMobile &&
        //                 typeof window.device !== 'undefined' &&
        //                 typeof window.device.platform !== 'undefined';

        app.isIOS     = app.isPhonegapAvailable ?  window.device.platform.toLowerCase() === 'ios' : false;
        app.isAndroid = app.isPhonegapAvailable ?  window.device.platform.toLowerCase() === 'android' : false;

        // check for mobile safari
        if(!app.isIOS) {
            app.isIOS = app.isiOSBrowser;
        }

        // we do autohide, see ios config.xml
        // this sometimes doen't work and was the
        // reason the app was rejected after first submission
        // XXX later? note: WE /DO/ USE on "deviceready" NOT zepto's ready...
        // AND: it worked EVERYTIME installing via xcode and TESTFLIGHT, only
        // if the ipa gets installed via itunes is hangs
        // hideSplashScreen(isAuth);

        simulateActiveState($body);
        doMobileSpecificStuffOnDeviceReady($body);
        preloadImages($body);
        initGlobalNavigationHandlers($body);

        // Our client side socket io wrapper
        // if(typeof window.io !== 'undefined') {
            // app.socketWrapper = new SocketIOWrapper();
        // }

        // The app router
        app.router = new AppRouter(isAuth);

        // global for casperjs: need to do a force logout. better way? XXX
        if(!app.isPhonegapAvailable && app.isPhantomJS) {
            __app_config__.router = app.router;
        }

        // init localization
        app.on('translationsLoaded', app.router.onTranslationsLoaded, app.router);
        // after event binding on 'translationsLoaded':
        app.initGlobalization();

        // init the local database
        try {
            app.storage = new Storage();

            if(app.storage.hasBrowserSupport()) {
                app.storage.openDatabase();
                app.storage.initDatabase();

                // now it's save to work with the db
                app.router.checkLocalDatabaseAndSync();
            }
            else {
                app.router.deauthenticateUser();
                // app.router.go('start')
            }
        }
        catch(e) {
            log('DATABASE ERROR: ' + e.message);
            // hm e.g. firefox does not support window.openDatabase (and prob never will)
            // this is a more webkit focussed project (ios/android -> phonegap == webkit)
            // alert(__('browserNotSupported'));
        }

        // user wants to use the app without account
        // maybe later app.noAccount = common.store.get('no-account');

        // initialize all relevant models/collections only once
        app.user      = new User();
        app.todolists = new Todolists();

        // finally init history api
        Backbone.history.start({
            pushState: false // XXX webapp?
        });

        // ----- Global AJAX Event Handling ----- (zepto stylee, http://zeptojs.com/#$.ajax)
        $doc.on('ajaxError', function (evnt, xhr, xhrObj) {
            common.hideLoader();

            // 500 kann alles sein, zB password error, allgemeiner error etc
            // wird ggf an anderer Stelle bereits gefangen,
            // hier eher logging/dev purpose
            var status = xhr.status;

            app.handleError('AJAX ERROR in main.js - (status: ' + status +
                ') URL: ' + xhrObj.url + ' RESPONSE: ' + xhr.statusText + ' ||| ' + xhrObj.responseText);
        });

        $doc.on('ajaxComplete', function () {
            common.hideLoader();
        });
    } // end initApp()

    // --- Init stuff ---
    if(app.isPhonegapAvailable) {
        log('------------------> registering deviceready event <------------------');
        // now save to use phonegap API: (device, navigator...)
        document.addEventListener('deviceready', initApp, false);
    } else {
        log('------------------> doc.ready <------------------');
        $(document).ready(initApp);
    }
});
