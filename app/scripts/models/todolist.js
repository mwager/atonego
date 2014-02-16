/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * TodolistModel
 *
 * A todolist is a list of todos, e.g. "shopping", "silverster-party"
 * or "private".
 *
 * Every user can have many lists, which can have many todos.
 *
 * This lists are then shareable with other users.
 *
 * @author Michael Wager <mail@mwager.de>
 * @see    /test/spec/models/todolist.spec.js
 */
define(function(require) {
    'use strict';

    var
        // _ = require('underscore'),
        Backbone = require('backbone'),
        app      = require('app');

    var Todolist = Backbone.Model.extend({
        idAttribute: '_id',
        urlRoot    : app.API_ROOT + '/api/v1/lists',
        defaults   : {
            title: '',
            user: null,
            todos: [],
            participants: [] // other assigned users
        },

        /**
         * Validate the models attributes
         *
         * @param {object} [attrs] The attributes to set
         * @param {object} [opts]  Optional data in set() or save()
         *                         set via: {validate: true, more: 'here'...}
         */
        validate: function(attrs/*, opts*/) {
            if(typeof attrs.title === 'string' && (attrs.title.length === 0 || attrs.title.length > 32)) {
                return __('listTitleError');
            }
        },

        /**
         * Returns the count of uncompleted todos in this list
         */
        getUncompletedTodosCount: function() {
            var cnt = 0;
            var todos = this.get('todos');

            if(todos.length === 0) {
                return 0;
            }

            todos.forEach(function(todo) {
                if(!todo.completed) {
                    cnt = cnt + 1;
                }
            });

            return cnt;
        }
    });

    return Todolist;
});
