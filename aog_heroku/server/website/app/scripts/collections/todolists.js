/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * The todolists collection
 */
define([
    'app',
    'lodash',
    'backbone',
    'models/todolist'
], function (app, _, Backbone, Todolist) {
    'use strict';

    var TodolistsCollection = Backbone.Collection.extend({
        model: Todolist,
        url  : app.API_ROOT + '/api/v1/lists',

        // sort by updated_at
        comparator: function(todolist) {
            var updated_at = todolist.get('updated_at'); // new Date(todolist.get('updated_at')).getTime();

            // order by "DESC":
            return -updated_at;
        }
    });

    return TodolistsCollection;
});
