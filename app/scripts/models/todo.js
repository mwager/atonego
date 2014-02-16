/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * TodoModel
 */
define(function(require) {
    'use strict';

    var
        // _ = require('underscore'),
        Backbone = require('backbone'),
        app = require('app');

    return Backbone.Model.extend({
        idAttribute: '_id',
        urlRoot    : app.API_ROOT + '/api/v1/todos',
        defaults   : {
            title     : '',
            completed : false,
            notice    : '',

            // notifications
            date      : null,
            users_to_notify: [],

            // later?
            order     : 0
        }
    });
});
