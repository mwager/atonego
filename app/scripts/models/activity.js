/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * ActivityModel
 *
 * No API Endpoint, only needed on client side
 */
define([
    'app',
    'underscore',
    'backbone'
], function (app, _, Backbone) {
    'use strict';

    var ActivityModel = Backbone.Model.extend({
        idAttribute: 'id',
        defaults   : {
            key    : '', // -> e.g. 'update_list'
            data: {},     // -> key-specific
            created_at: null
        }
    });

    return ActivityModel;
});
