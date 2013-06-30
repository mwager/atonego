/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * TodolistEditView
 *
 * Edit or delete a todolist or invite other users to this list.
 * Also handle invited users
 *
 * Duties of this view:
 *  - Save title
 *  - invite other users via email
 *  - delete an assigned user (if allowed)
 *
 * @author Michael Wager <mail@mwager.de>
 */
define([
    'lodash',
    'zepto',
    'app',
    'common',
    'text!templates/todos/todolist.editview.html',
    'views/base',
    'models/user'
], function (_, $, app, common, tpl, BaseView, User) {
    'use strict';

    var events = {};

    // List edit
    events[app.defaultClickEvent + ' .delete-list'] = 'deleteList';
    events['keyup #list-title'] = 'validateAndSaveOnEnter';

    // "ShareList" Funktionalität
    events['keyup #search-input'] = 'searchUsers';
    events[app.defaultClickEvent + ' .add-user-to-list'] = 'inviteUser';
    events[app.defaultClickEvent + ' .destroy'] = 'dropAddedUser';

    return BaseView.extend({
        id: 'todolist-edit-view',

        template: _.template(tpl),
        title: function() {
            return this.todolist.get('title');
        },
        events: events,

        // depends: args.listID
        initialize: function (args) {
            var self = this;

            if(!args.todolist) {
                throw 'TodolistEditView: no todolist provided';
            }

            this.todolist = args.todolist;

            // NEEDED? no.
            // this.listenTo(this.todolist, 'change', this.render);

            // update the header title according to changes of the todolist's title
            this.listenTo(this.todolist, 'change:title', function() {
                $('#title', this.el).html(common.escape(this.todolist.get('title')));
            }, this);

            // there are so many ways...
            /*this.listenTo(this.todolist, 'invalid', function() {
                this.$saveList.removeClass('disabled');
                common.hideLoader();
            }, this);*/

            this.lastUserSearchQuery = '';

            // triggered by the header view
            /*** NO!
            this.listenTo(app, 'header-save', function(e) {
                self.saveList(e);
            });***/
            app.off('header-save');
            app.on('header-save', function(e) {
                self.saveList(e);
            });
        },

        render: function () {
            var todolist = this.todolist.toJSON();

            this.renderSelf({
                app:        app,
                common:     common,
                todolist:   todolist,
                theUser: app.user.toJSON()
            });

            // render the header
            // each "root-view" must render it's header
            this.renderHeader({
                showBackButton: true,
                showSaveButton: true,
                el: $('header', this.el)[0],
                title: this.title()
            });

            this.$listTitle     = $('#list-title', this.el);
            this.$searchInput   = $('#search-input', this.el);
            this.$searchResults = $('#search-results', this.el);
            this.$timestamp     = $('#timestamp', this.el);

            return this;
        },

        /**
         * Save this list
         */
        validate: function (e) {
            if(e) {
                e.preventDefault();
            }

            var valid = true;
            var title = this.$listTitle.val().trim();

            if(title.length === 0 || title.length > 32) {
                valid = false;
            }

            // nicht speichern wenn der titel gar nicht geändert wurde
            if(title === this.todolist.get('title')) {
                valid = false;
            }

            // nach save disable!
            this.$saveList = $('#header-save');
            if(this.$saveList.length > 0) {
                this.$saveList.toggleClass('disabled', !valid);
            }

            common.lockScreen();

            return valid;
        },

        validateAndSaveOnEnter: function (e) {
            var key = e.keyCode || e.which;
            var valid = this.validate();

            if(key === 13 && valid) {
                this.saveList();
            }
        },

        saveList: function(e) {
            var self = this;

            if(e) {
                e.preventDefault();
            }

            var title = this.$listTitle.val().trim();

            var userJSON = app.user.toJSON();

            var theData = {
                user_id: app.user.get('_id'),
                title: title,

                updated_at: new Date().getTime(),
                updated_by: userJSON
            };

            // keep it local
            this.todolist.set(theData/*, {validate: true}*/);

            if(!this.todolist.hasChanged('title')) {
                return false;
            }

            self.$saveList.addClass('disabled');
            common.showLoader();

            // just update the timestamp, no re-render
            this.$timestamp.html(
                __('updated') + ' ' +
                common.fromNow(new Date().getTime(), false, app.lang) + ' ' +
                __('by') + ' ' +
                userJSON.display_name
            );

            // now the user can leave the screen while we save in the background
            common.unlockScreen();

            this.todolist.save(null, {
                patch: true,

                success: function () {
                    common.hideLoader();
                    // only notify the user on error
                    // common.notify(__('saved'), 5000);

                    // ##### update local db #####
                    if(app.todolists) {
                        var lists = app.todolists.toJSON();
                        app.storage.storeListsForUser(app.user.get('_id'), lists, function(/*err, success*/) {});
                    }
                },
                error: function (model, json) {
                    common.hideLoader();
                    self.$saveList.removeClass('disabled');

                    var msg = __('error');
                    if(json && json.message) {
                        msg = json.message;
                    }

                    common.notify(msg, 5000);
                }
            });
        },

        /**
         * Lade Benutzer zur Liste ein via email
         */
        searchUsers: function (e) {
            e.preventDefault();

            var self = this,
                val;

            val = this.$searchInput.val();

            if($.trim(val).length === 0) {
                this.$searchResults.html('');
                return false;
            }

            if(this.lastUserSearchQuery === val) {
                return false;
            }

            this.lastUserSearchQuery = val;

            if(common.isValidMail(val)) {
                var list = [];
                list.push('<button class="add-user-to-list aog-button aog-green" ');
                list.push('data-email="' + val + '">');
                list.push(__('addUserToList', {name: val.replace('@', ' [at] ')}));
                list.push('</button></li>');
                self.$searchResults.html(list.join(''));

                // scroll to the bottom, so the user can see the button
                common.scrollBottom();
                common.lockScreen();
            }
            else {
                common.unlockScreen();
                self.$searchResults.empty();
            }
        },

        /**
         * Füge einen Benutzer dieser Liste hinzu, d.h. dieser darf dann
         * auch an dieser arbeiten und bekommt echtzeit updates.
         *
         * Einladung per Email
         */
        inviteUser: function (e) {
            e.preventDefault();

            var self = this;
            var link = $(e.currentTarget);
            var email = link.attr('data-email');
            var listID = this.todolist.get('_id');
            // var display_name = link.attr('data-user-name');

            if(!email || !listID) {
                app.handleError('shit no user-id and no list id found - todolistdialog.js');
                return false;
            }

            var addUserHelper = function (confirmed) {
                if(!confirmed) {
                    return false;
                }

                common.unlockScreen();

                var u = new User({
                    _id: app.user.get('_id'),
                    invite: true,
                    email: email,
                    list_id: listID
                });

                self.$searchResults.html('');
                self.$searchInput.val('');

                common.showLoader();
                u.save(null, {
                    success: function () {
                        common.hideLoader();
                        common.notify(__('inviteSuccess'));
                    },
                    error: function () {
                        common.hideLoader();
                        common.notify(__('inviteError'));
                    }
                });
            };

            common.dialog(__('reallyAddUser', {email: email}), addUserHelper, true);
        },

        /**
         * Klick auf "dropAddedUser"
         * @param e
         */
        dropAddedUser: function (e) {
            e.preventDefault();

            var self = this;
            var link = $(e.currentTarget);

            if(link.attr('disabled')) {
                return false;
            }

            var userID = link.attr('data-user-id');
            var listID = this.todolist.get('_id');

            var u = new User({
                remove: true, // PUT "task"
                _id: app.user.get('_id'),
                user_id_to_be_removed: userID,
                list_id: listID
            });

            var dropIt = function (confirmed) {
                if(!confirmed) {
                    return false;
                }

                common.showLoader();
                u.save(null, {
                    success: function (model, json) {
                        common.hideLoader();

                        setTimeout(function() {
                            $('#' + link.attr('id')).remove();
                        }, 10);

                        // es kommt die neue liste mit neuen participants
                        if(json && json.list) {
                            var list = json.list;
                            app.todolists.remove(list._id);
                            app.todolists.add(list);

                            // ### local db update ###
                            app.storage.storeListsForUser(app.user.get('_id'), app.todolists.toJSON(),
                                function(/*err, success*/) {});
                        }

                        self.todolist.trigger('change');

                        self.render();
                    },

                    error: function (model, json) {
                        var msg = __('error');
                        if(json && json.message) {
                            msg = json.message;
                        }
                        common.hideLoader();
                        common.notify(msg);
                    }
                });
            };

            common.dialog(__('really'), dropIt, true);
        },

        /**
         * Delete this todolist
         */
        deleteList: function (e) {
            e.preventDefault();

            var ele = $(e.currentTarget);
            if(ele.attr('disabled')) {
                return false;
            }

            var self = this;

            var destroyTodolist = function (userConfirmed) {
                if(!userConfirmed) {
                    return false;
                }

                common.showLoader();

                // triggers app.todolists.remove - siehe listview.js
                self.todolist.destroy({
                    success: function () {
                        common.hideLoader();

                        // ##### update local db #####
                        if(app.todolists) {
                            var lists = app.todolists.toJSON();
                            app.storage.storeListsForUser(app.user.get('_id'), lists, function(/*err, success*/) {});
                        }
                    },
                    error: function (model, json) {
                        var msg = __('error');
                        if(json && json.message) {
                            msg = json.message;
                        }
                        common.hideLoader();
                        common.notify(msg);
                    }
                });
            };

            common.dialog(__('really'), destroyTodolist, true);
        }
    });
});
