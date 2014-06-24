/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * Todolist View
 *
 * Main container for URI "#todolists"
 *
 * Renders ul id="todolists" for the TodolistsView
 *
 * @author Michael Wager <mail@mwager.de>
 */
define([
    'underscore',
    'zepto',
    'app',
    'common',
    'text!templates/lists/listview.html',
    'models/user',
    'models/todolist',
    'views/base',
    'views/lists/todolist',
    'views/lists/activities',
    'moment'
], function (_, $, app, common, tpl, User, Todolist,
    BaseView, TodolistsView, ActivitiesView) {

    'use strict';

    var events = {};
    events['keyup #create-list'] = 'createTodolist';
    events['blur #create-list']  = 'createTodolistOnBlur';

    return BaseView.extend({
        id: 'todolist-main-view',
        title: function () {
            return __('lists');
        },

        dispose: function() {
            // dispose subviews first
            if(this.todolistsView && _.isFunction(this.todolistsView.dispose)) {
                this.todolistsView.dispose();
            }

            if(this.activitiesView && _.isFunction(this.activitiesView.dispose)) {
                this.activitiesView.dispose();
            }

            BaseView.prototype.dispose.call(this);
        },

        events: events,

        initialize: function () {
            this.template = _.template(tpl);

            // if the user model changes, we only update the welcome message,
            // -> NO full re-render! (the activity view listens to user changes)
            this.user = app.user;
            this.listenTo(app.user, 'change', function() {
                if(this.$welcome) {
                    this.$welcome.html('Hi ' + this.user.get('display_name'));
                }

                if(this.$listLen) {
                    this.$listLen.html(app.todolists.length);
                }
            }, this);

            this.todolists = app.todolists;
            this.listenTo(this.todolists, 'remove', this.render);
        },

        render: function () {
            var user = this.user ? this.user.toJSON() : new User();
            this.renderSelf({
                noAuth: common.store.get('no-account') === '1',
                user: user,
                app:  app
            });

            // render the header
            // each "root-view" must render it's header
            this.renderHeader({
                el: $('header', this.el)[0],
                title: this.title()
            });

            this.$title   = $('#create-list', this.el);
            this.$welcome = $('#welcome', this.el);
            this.$listLen = $('span#list-len', this.el);

            // sub views
            this.todolistsView = new TodolistsView({
                el: $('ul#todolists', this.el)[0]
            });
            this.todolistsView.render();

            this.activitiesView = new ActivitiesView({
                el: $('#activities', this.el)[0]
            });
            this.activitiesView.render();

            return this;
        },

        createTodolist: function (e) {
            var key = e.keyCode || e.which;

            if(key === 13) {
                // just trigger the blur event - else saved two times,
                // second time with empty title!
                return this.$title.blur(); // trigger('blur');
            }
        },

        createTodolistOnBlur: function (e) {
            if(e) {
                e.preventDefault();
            }

            var title = this.$title.val().trim();

            if(title && (title.length === 0 || title.length > 32)) {
                return false;
            }

            this._createList(title);
        },

        /**
         * Create a new todolist
         */
        _createList: function (title) {
            if(!title || $.trim(title).length === 0) {
                return false;
            }

            var self = this;

            // output encoding via <%- enough?
            // title = common.escape(title);

            var data = {
                user_id: this.user.get('_id'),
                todos: [],
                title: title
            };

            var list = new Todolist(data);

            // sofort adden! XXX ich hab dann aber noch keine ID
            // und kann somit nach dem rendern nicht gleich draufklicken !
            // app.todolists.add(data);
            setTimeout(function() {
                self.$title.val('');
            }, 10);

            common.showLoader();

            list.save(null, {
                success: function (model, data) {
                    common.hideLoader();

                    // hmm warum funzt das im todoscontainer.js?
                    // model.trigger('change');
                    app.todolists.add(data);

                    app.router.go('todolists/' + data._id);

                    // ##### update local db #####
                    var lists = app.todolists.toJSON();
                    app.storage.storeListsForUser(app.user.get('_id'), lists, function(/*err, success*/) {});

                    // subscribe to this list
                    if(app.socketWrapper) {
                        app.socketWrapper.subscribeToList(model.get('_id'));
                    }
                },
                error: function (model, xhr) {
                    var json = JSON.parse(xhr.responseText);

                    var msg = __('error');
                    if(json && json.message && json.message.key) {
                        msg = __(json.message.key);
                    }

                    common.hideLoader();
                    common.notify(msg);
                }
            });
        },

        /**
         * Called by the SocketIO Wrapper wenn diese
         * View Instanz gerade global ist
         */
        pushUpdate: function(event, list) {
            switch(event) {
            case 'update_list':
                var listModel = app.todolists.get(list._id);
                listModel.set(list); // triggers re-render
                break;
            case 'delete_list':
                app.todolists.remove(list._id);
                break;
            }

            // ##### update local db #####
            var lists = app.todolists.toJSON();
            app.storage.storeListsForUser(app.user.get('_id'), lists, function(/*err, success*/) {});
        }
    });
});
