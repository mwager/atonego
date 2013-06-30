/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * The todos collection.
 *
 * Inspired by the todomvc project (todomvc.com, "backbone-require" example)
 */
define(function(require) {
    'use strict';

    var
        _ = require('lodash'),
        $ = require('zepto'),
        Backbone = require('backbone'),
        app = require('app'),
        Todo = require('models/todo');

    var TodosCollection = Backbone.Collection.extend({
        // Reference to this collection's model.
        model: Todo,
        url: app.API_ROOT + '/api/v1/todos',

        // Filter down the list of all todo items that are finished.
        completed: function () {
            return this.filter(function (todo) {
                return todo.get('completed');
            });
        },

        // Filter down the list to only todo items that are still not finished.
        remaining: function () {
            return this.without.apply(this, this.completed());
        },

        // We keep the Todos in sequential order, despite being saved by unordered
        // GUID in the database. This generates the next order number for new items.
        /*nextOrder: function () {
            if(!this.length) {
                return 1;
            }
            return this.last().get('order') + 1;
        },*/

        comparator: function (todo) {
            // order by updated "DESC":
            // we only have timestamps, no Date objects
            var updated_at = parseInt(todo.get('updated_at'), 10);

            if(updated_at) {
                // UPDATED DESC
                return -updated_at;
            }

            return todo.get('completed');
        },

        // destroy all completed todos at once if removed from server
        destroyCompleted: function (done) {
            var completed = this.completed();
            var todo_ids = [];

            // remove from client as soon as possible
            this.remove(completed, {});

            _.each(completed, function (c) {
                todo_ids.push(c.get('_id'));
            });

            $.ajax({
                cache:      false,
                timeout:    app.AJAX_TIMEOUT,
                type:       'DELETE',
                dataType:   'json',
                data: {
                    todo_ids: todo_ids // ugly, aber wir wollen mehrere auf einmal löschen können
                },
                url: app.API_ROOT + '/api/v1/todos',
                success: function (json) {
                    // error
                    if(json && (json.error || json.message)) {
                        return done(json.error || json.message);
                    }

                    _.each(completed, function (todo) {
                        todo.trigger('destroy');
                    });

                    done(null, {success: true});
                },
                error: function () {
                    done(__('error'));
                }
            });
        }
    });

    // return new instance
    return new TodosCollection();
});