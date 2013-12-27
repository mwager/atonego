/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * AppRouter - handles all routes of AtOneGo
 *
 * @author Michael Wager <mail@mwager.de>
 */
define(function (require) {
    'use strict';

    // require module dependencies via "simplified CommonJS wrapping"
    // see http://requirejs.org/docs/whyamd.html
    var
        app         = require('app'),
        common      = require('common'),
        _           = require('lodash'),
        $           = require('zepto'),
        Backbone    = require('backbone'),
        User        = require('models/user'),

        // our junior.js fork
        JrFork = require('JrFork'),

        // Android only damnit
        // IScroll = require('IScroll'),

        // Views
        StartScreenView         = require('views/start'),
        SettingsView            = require('views/settings'),
        HelpView                = require('views/help'),
        TodosContainerView      = require('views/todos/todoscontainer'),
        LoginView               = require('views/login'),
        SignupView              = require('views/signup'),
        TodolistViewContainer   = require('views/lists/listview'),
        TodolistEditView        = require('views/todos/todolist.editview'),

        AppRouter,
        appRoutes;

    // all client-side application routes
    appRoutes = {
        ''          : 'index',
        'start'     : 'index',

        'signup'    : 'signup',
        'login'     : 'login',
        'logout'    : 'logout',
        'settings'  : 'settings',
        'help'      : 'help',

        'todolists'         : 'showTodolists',
        'todolists/edit/:id': 'editTodolist',
        'todolists/:id'     : 'showTodosOfList'
    };

    // Defining the application router, you can attach sub routers here.
    // NOTE: we extend the Junior Router to support slide transitions
    AppRouter = JrFork.Router.extend({
        routes: appRoutes,

        /**
         * Constructor
         */
        initialize: function (isAuth) {
            // we remember the last route
            this.lastRoute              = '';
            this.currentView            = null;

            // catch ALL route changes
            // this.on('route', this.onRouteChange, this);

            // If we have a user in the local db, render now!
            this.isAuth = isAuth;

            this.$ghostbusterLayer = $('#ghostbuster-overlay');
        },

        /**
         * Fires when translation files are loaded via ajax or
         * user changes the lang
         */
        onTranslationsLoaded: function () {
            // re-render all views
            if(this.startView) {
                this.startView.render();
            }
            else if(this.currentView) {
                this.currentView.render();
            }
        },

        /**
         * The AppRouter's 'all' event callback
         *
        onRouteChange: function () {
            var self = this,
                route = Backbone.history.fragment;

            log('onRouteChange: ' + route);
        },*/

        /**
         * Check the local database for a user record.
         * If found, render the user's lists directly
         *
         * And: silently fetch the lists from ther server after a
         * small timeout to keep them in sync locally
         */
        checkLocalDatabaseAndSync: function () {
            var self = this;

            log('=== CHECKING LOCAL DB!');

            // no web database support? fetch user from server.
            if(!app.storage) {
                return false;
            }

            if(!this.isAuth) {
                return false;
            }

            app.storage.fetchUser(function __userFetchedCallback(err, user) {
                if(err) {
                    log('error fetching user: ' + err);
                }

                var route = Backbone.history.fragment;
                if(!user && route !== 'start' && route.length > 0) {
                    // go home. show startscreen.
                    setTimeout(function() {
                        self.go(route); // route === 'start' ? '/' : 'start'
                    }, 100);

                    return false;
                }

                if(!user) {
                    return false;
                }

                log('=== GOT USER, NOW RENDERING: ', user);

                // jetzt erstmal schaun ob wir listen in der lokalen db haben
                // UPDATE: macht eigentlich keinen sinn, wird NIE  benötigt ! siehe unten.
                // --> todolists kommen im userJSON auch !
                // UPDATE 2: Problem:
                // Im user objekt werden auch die listen gespeichert, gut.
                // Wenn eine neue liste angelegt wird, so wird diese zusammen
                // mit den anderen listen in tabelle "lists" gespeichert.
                // Beim nächsten Neuladen wurde nur der user aus der lokalen db geholt,
                // dort sind aber ggf noch weniger listen, deshalb:
                // hier auch noch die listen holen, dann erst auth!
                app.storage.fetchListsForUser(user._id, function(err, lists) {
                    if(!err && lists) {
                        // NOTE: hier müssen im user object bereits auch die todolists dabei sein
                        user.todolists = lists;
                    }

                    var doNotSaveToDb = true;
                    app.router.setAuthenticated(user, doNotSaveToDb);

                    /**
                     * We still fetch the user & his lists from the server
                     * after a short timeout
                     *
                     * -> AFTER setAuthenticated() !!!
                     */
                    setTimeout(function __fetchStuffFromServerOnBoot() {
                        /**** NO via fetchUser all todolists will be fetched too (WITH their todos)!
                        app.todolists.fetch({
                            success: function __listsFetchSuccess(model, json) {
                                log(json);
                                return;

                                app.storage.storeListsForUser(app.user.get('_id'), json, function(err, success) {});

                                // "re-subscribe"
                                if(app.socketWrapper && app.socketWrapper.socket !== null) {
                                    app.socketWrapper.subscribeToLists(app.todolists);
                                }
                            },
                            // wenn wir hier hingelangen, müssen wir deauth on client machen!!!
                            error: function() {
                                self.deauthenticateUser();
                            }
                        });*/

                        // here we need to fetch the user again, too
                        // UPDATE: No, will fe fetched via socket io on
                        // every connect/reconnect.
                        // UPDATE2: socket io only available in webapp #damnsocketio
                        if(!window.io) {
                            app.fetchUser(function __fetchSuccess(err, userJSON) {
                                if(err) {
                                    // SOMETHING WENT REALLY WRONG! -> logout the user
                                    return self.deauthenticateUser();
                                }

                                app.storage.storeListsForUser(app.user.get('_id'), userJSON.todolists);

                                // "re-subscribe"
                                if(app.socketWrapper && app.socketWrapper.socket !== null) {
                                    app.socketWrapper.subscribeToLists(app.todolists);
                                }
                            });
                        }
                    }, 1);
                });
            });
        },

        // now we should definitly know that the user is authenticated
        // on server side; gets called in this._checkLogin() and startScreenView
        setAuthenticated: function (userJSON, doNotSaveToDb) {
            log('=== AppRouter.setAuthenticated() YUHU I AM LOGGED IN: ', userJSON.email, userJSON);

            // ##### API ACCESS TOKEN siehe zepto ajax conf in main.js #####
            // der token muss nun bei jedem weiteren request mitgehn!
            app.API_TOKEN = userJSON.API_TOKEN;

            // SOFORT RENDERN !!!
            // NOTE: es kann sein dass wir bereits auf #todolists sind,
            // AUCH AUF MOB. GERÄTEN
            // ist dies also der Fall: only re-render via app.user change
            // event in listview.js!

            if(!app.todolistView) {
                this.go('todolists', true);
            }

            app.isLoggedIn = true;

            this.isAuth = true;

            // wir speichern im local storage einfach ob wir eingeloggt sind
            // den rest übernimmt der server via access token
            common.store.set('is-auth', '1');

            // hier kommt der user mit all seinen todolisten und deren todos
            // save user and todolists
            var lists = [];
            _.each(userJSON.todolists, function (list) {
                lists.push(list);
            });

            app.todolists.reset();
            app.todolists.add(lists);

            // update user's language
            // app.user.set('lang', userJSON.lang, {silent: true});
            app.changeLang(userJSON.lang ? userJSON.lang : app.lang);

            if(!userJSON.lang) {
                userJSON.lang = app.lang;
            }

            // log(JSON.stringify(userJSON))

            // triggers change in views
            app.user.set(userJSON);

            // 1. connect websocket
            /* no support anymore
            if(app.socketWrapper) {
                app.socketWrapper.connect(app.API_TOKEN);

                // listen for succes only ONCE:
                app.socketWrapper.once('connect_success', function() {
                    // falls wir bereits listen aus der lokalen db haben:
                    app.socketWrapper.subscribeToLists(app.todolists);
                });
            }*/

            // 2. register push notifications
            app.initAndRegisterPushNotifications();

            // wenn 2.param gesetzt: nicht speichern, denn dann haben wir ihn
            // vorher gerade ausgelesen...
            if(!doNotSaveToDb) {
                var userID = app.user.get('_id');

                console.log('STORING USER, LISTS AND TODOS IN LOCAL DB');

                // ###### store user & lists to local db: ######
                app.storage.storeUser(userJSON, function __storeUser(err, success) {
                    if(success === true && lists.length > 0) {
                        app.storage.storeListsForUser(userID, lists, function(/*err, success*/) {
                            /*app.storage.fetchListsForUser(userID, function(err, results) {
                                var len = results.rows.length;
                                console.log('=================>', len)
                            });*/

                            // auch gleich alle todos speichern:
                            _.each(app.todolists.toJSON(), function(list) {
                                var todos = list.todos;

                                if(todos && todos.length > 0) {
                                    // ##### store local db #####
                                    // app.storage.storeTodosOfList(list._id, todos, function(/*err, success*/) {});

                                    // keep it local
                                    var l = app.todolists.get(list._id);
                                    if(l) {
                                        l.set({
                                            todos: todos
                                        }, {silent: true});
                                    }
                                }
                            });
                        });
                    }
                });
            }
        },

        // deauthenticate the current user, render startpage
        deauthenticateUser: function () {
            var self = this;

            // MUST be called before we reset the user!
            app.unregisterPUSHNotifications();

            setTimeout(function() {
                self.go('start');
            }, 1);

            this.isAuth     = false;
            app.isLoggedIn  = false;
            common.store.drop('is-auth');
            common.unlockScreen();

            app.todolists.reset(); // !
            app.user = new User();

            // soll man NICHT sehen wenn eingeloggt
            $('.hide-me').each(function () {
                $(this).addClass('hidden');
            });

            // deauthenticate means "DELETE ALL LOCAL DATA"
            if(app.storage) {
                app.storage.___dropTables(function() {
                    app.storage.initDatabase();
                });
            }

            // unsubscribe from all socket-io events
            if(app.socketWrapper) {
                setTimeout(function() {
                    // shutdown, denn beim nächsten login ändert sich der token
                    // -> deshalb müssen wir dort wieder initial verbinden
                    // mit neuem token (bei resume hat sich der token ja nicht geändert)
                    app.socketWrapper.disconnect(true, true);
                }, 1000);
            }

            // reset activities
            app.activityCollection.reset();
        },

        /**
         * StartScreen
         */
        index: function () {
            if(this.isAuth === true) {
                return this.go('todolists');
            }

            this.startView = new StartScreenView();
            this.renderView(this.startView);
        },

        /**
         * SignupScreen
         */
        signup: function () {
            if(this.isAuth === true) {
                return this.go('todolists');
            }

            var signupView = new SignupView();
            this.renderView(signupView);
        },

        /**
         * LoginScreen
         */
        login: function () {
            if(this.isAuth === true) {
                return this.go('todolists');
            }

            var loginView = new LoginView();
            this.renderView(loginView);
        },

        /**
         * Logout the user
         */
        logout: function() {
            // render the startscreen now.
            this.deauthenticateUser();

            // logout silently in background
            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: app.API_ROOT + '/api/v1/logout',
                success: function ( /*json*/ ) {},
                error: function ( /*json*/ ) {
                    common.notify(__('error'));
                }
            });

            return false;
        },

        // MainView
        // route '/#todolists'
        showTodolists: function () {
            // make Global because of SocketIO Updates
            app.todolistView = new TodolistViewContainer({
                user: app.user
            });
            this.renderView(app.todolistView);
        },

        /**
         * Settings-Screen
         */
        settings: function () {
            // muss this.settingsView sein! siehe onRouteChange
            this.settingsView = new SettingsView();
            this.renderView(this.settingsView);
        },

        /**
         * The Todos of a list
         */
        showTodosOfList: function (listID) {
            // make Globale because of SocketIO Updates
            app.todosContainer = new TodosContainerView({
                listID: listID
            });

            this.renderView(app.todosContainer);
        },

        /**
         * Edit a todolist
         */
        editTodolist: function (listID) {
            var list = app.todolists.get(listID);
            if(!list) {
                common.notify(__('error'));
                this.go('todolists/' + listID);
            }
            app.todolistEditView = new TodolistEditView({
                todolist: list
            });
            this.renderView(app.todolistEditView);
        },

        /**
         * Help-Screen
         */
        help: function () {
            var helpView = new HelpView();
            this.renderView(helpView);
        },

        /*__initIScroll: function() {
            if(app.iScroll && typeof app.iScroll.destroy === 'function') {
                log('-----> destroyed iscroll instance')
                app.iScroll.destroy();
            }

            app.isAndroid = true; // XXX
            if(app.isAndroid) {
                log('-----> init iscroll instance')

                var $contentEl = $('#app-main .content');

                $contentEl.wrap('<div id="wrapper"></div>')


                var $wrapper  = $('#wrapper');
                var $scroller = $('#wrapper .content');
                $scroller.append('<br/><br/><br/>');

                $wrapper.css({
                    'position':'absolute',
                    'z-index':'1',
                    'top':'50px',
                    'bottom':'0px',
                    'left':'0',
                    'width':'100%',
                    // 'background':'#aaa',
                    'overflow':'auto'
                });
                $scroller.css({
                    'position':'relative',
                    '-webkit-tap-highlight-color':'rgba(0,0,0,0)',
                    'float':'left',
                    'width':'100%',
                    // nO! 'height':'100%',
                    'padding':'10px 0px 0px 0px',
                    'overflow':'hidden'
                });

                app.iScroll = new IScroll($wrapper.attr('id'), {
                    hScrollbar: false,
                    vScrollbar: true,
                    // useTransform: false,

                    // damn this is hacky...
                    onBeforeScrollStart: function (e) {
                        var target = e.target;
                        while (target.nodeType != 1){
                            target = target.parentNode;
                        }

                        if (target.tagName != 'SELECT' && target.tagName != 'INPUT' && target.tagName != 'TEXTAREA') {
                            e.preventDefault();
                        }
                    }
                });
            }
        },*/

        /**
         * Render a Root-View
         *
         * Called by every nav route to trigger slide animation
         * and/or just render the next screen
         */
        renderView: function(view) {
            var self = this;

            // show the "ghostbuster-layer"
            this.__toggleGhostBusterOverlay(true);

            // trigger the slide animation (appr. 250-500ms)
            // (listening for "transitionend" callback)
            this.renderScreen(view, app.useSlideAnimation, function __animationDone() {
                // common.scrollTop();

                // android iscroll fix
                /*setTimeout(function() {
                    self.__initIScroll();
                }, 10);*/

                // unlock "edit" mode
                common.unlockScreen();

                self.__toggleGhostBusterOverlay(false);

                // log memory usage in chrome
                // if(window.performance && window.performance.memory) {
                //     log('USED MEMORY: ' + window.performance.memory.usedJSHeapSize/1024/1024 + 'mb');
                // }

                setTimeout(function() {
                    // IMPORTANT: this will call stopListening()/remove()
                    // etc for all views/subviews
                    // allow custom cleanup of the current view after the
                    // new screen is rendered
                    if(self.currentView && _.isFunction(self.currentView.dispose)) {
                        self.currentView.dispose();
                    }

                    // Cache the reference of the current main view
                    // NOTE:
                    // The following assignment should trigger the garbage
                    // collector to remove the old "current view" as there is
                    // no reference left. Please correct me if i'm wrong (-:
                    self.currentView = view;

                    // erst nach dem cleanup
                    // scrolling fix for every new scrolling .content
                    // var scrollingContent = $('.content')[0];
                    // new app.ScrollFix(scrollingContent);
                }, 200);
            });

            // -------------------- AFTER STUFF --------------------

            // no! common.hideLoader();
            common.closeNotify();
        },

        /**
         * The "ghostclicks"-buster-hack
         *
         * On every rendering of a screen, we will show a w=100%|h=100% hidden
         * div overlay until the rendering and animation is done.
         * This overlay will catch all ghostclicks
         **/
        __toggleGhostBusterOverlay: function (showIt) {
            if(app.isBrowser) {
                return false;
            }

            if(showIt) {
                this.$ghostbusterLayer.show();
            } else {
                this.$ghostbusterLayer.hide();
            }
        },

        // OLD:
        /**
         * Global "page" render helper.
         *
         * [Old approach of rendering new screens...]
         *
         * Renders a new Screen using one of the "root-view"'s "el".
         *
        renderViewOld: function (view) {
            var self  = this,
                route = Backbone.history.fragment;

            if(!view) {
                var msg = 'router.js: no view to render';
                return app.handleError(msg);
            }

            // experiment: slide the current view to the right
            // need some css freaks here...
            // and fade in the next screen
            // this.$main.addClass('right');


            // NOTE: ".html()"" führt auf echten Geräten
            // zu "jump to top" (auch ohne scrollTop hier!)
            // -> render in einem setTimeout führt zu extrem unkontrollierbarem Verhalten
            // Workaround: disable scrolling before rendering!
            this.$wrapper.css('overflow-y', 'hidden');

            // show the "ghostbuster-layer"
            this.__toggleGhostBusterOverlay(true);

            // start fade in, render new screen with opacity = 0
            view.$el.css('opacity', 0);
            this.$main.html(view.el);
            view.render();

            this.$wrapper.css('overflow-y', 'scroll');

            common.scrollTop();

            // on start-view: no animation
            if(route.length === 0 || route === 'start') {
                view.$el.css('opacity', 1);
                self.__toggleGhostBusterOverlay(false);

            // else: fade in the new screen
            } else {
                this.__animateView(view, true, 600, function() {
                    self.__toggleGhostBusterOverlay(false);
                });
            }

            if(this.firstRenderAction) {
                common.hideSplashscreen();
            }

            // update the page title
            if(_.isFunction(view.title)) {
                this.$title.html(common.escape(view.title()));
            }

            // -------------------- AFTER STUFF --------------------

            // no! common.hideLoader();
            common.closeNotify();

            // Cache the refererence of the current main view
            // allow custom cleanup of the current view
            if(this.currentView && _.isFunction(this.currentView.dispose)) {
                this.currentView.dispose();
            }

            this.currentView = view;

            this.firstRenderAction = false;
        },******************/

        /**
         * Shortcut for navigating via Backbone.history
         */
        go: function (route, noAnimation) {
            if(!route) {
                throw 'app.router.go(route) - no route provided';
            }

            // old
            /*Backbone.history.navigate(route, {
                trigger: true
            });*/

            // new
            JrFork.Navigator.navigate(route, {
                animation: noAnimation ? null : {
                    type: JrFork.Navigator.animations.SLIDE_STACK,
                    direction: JrFork.Navigator.directions.LEFT
                }
            });
        },

        /**
         * Set the last route in the global nav handler (main.js)
         * before navigating to the next route
         */
        setLastRoute: function(route) {
            this.lastRoute = route;
        },
        getLastRoute: function() {
            return this.lastRoute;
        }

        /***
        __animateView: function(view, isFadeIn, millis, fn) {
            view.$el.animate({
                opacity: isFadeIn ? 1 : 0,
                translate3d: '0,0%,0' // XXX?
            }, {
                duration: millis,
                easing: 'ease',
                complete: function() {
                    if(typeof fn === 'function') {
                        fn();
                    }
                }
            });
        }***************/
    });

    return AppRouter;
});
