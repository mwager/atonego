/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * Der Button, welcher alle erledigten Todos löscht
 */
define(function (require) {
    'use strict';

    var
        app         = require('app'),
        BaseView    = require('views/base'),
        tpl         = require('text!templates/todos/clearcompletedbtn.html'),
        _           = require('lodash'),
        $           = require('zepto'),
        common      = require('common'),
        events      = {};

    // events of this view
    events[app.defaultClickEvent + ' #clear-completed'] = 'clearCompleted';

    return BaseView.extend({
        template: _.template(tpl),
        events: events,

        // The TodoView listens for changes to its model, re-rendering. Since there's
        // a one-to-one correspondence between a **Todo** and a **TodoView** in this
        // app, we set a direct reference on the model for convenience.
        initialize: function (args) {
            this.collapsed = true;

            if(!args || !args.listID) {
                throw 'clearcompletedbtn.js: no list id provided';
            }

            this.listID = args.listID;

            this.todosColl = app.todosCollectionInstance;
            this.listenTo(this.todosColl, 'all', this.render);
        },

        render: function () {
            var completedTodos = this.todosColl.completed().length;
            // var remainingTodos = this.todosColl.remaining().length;
            this.renderSelf({
                completed: completedTodos
            });
        },

        clearCompleted: function (e) {
            var self = this;
            e.preventDefault();

            var ele = $(e.currentTarget);
            if(ele.hasClass('disabled')) {
                return false;
            }

            var destroyAllCompletedTodos = function (userConfirmed) {
                if(!userConfirmed) {
                    return false;
                }

                // lösche alle completed todos auf einmal
                common.showLoader();
                self.todosColl.destroyCompleted(function (err, success) {
                    common.hideLoader();

                    if(err) {
                        common.notify(__('error'));
                    }

                    if(success) {
                        // ##### update todos local #####
                        // die collection wurd bereits aktualisiert
                        var todos  = self.todosColl;
                        var listID = self.listID;

                        if(todos && listID) {
                            todos = todos.toJSON();
                            // app.storage.storeTodosOfList(listID, todos, function(/*err, success*/) {});
                            // keep it local
                            var l = app.todolists.get(listID);
                            if(l) {
                                l.set({
                                    todos: todos
                                }, {silent: true});
                            }
                        }
                    }
                });
            };

            setTimeout(function () {
                common.dialog(__('really'), destroyAllCompletedTodos, true);
            }, 20);

            return false;
        }
    });
});
