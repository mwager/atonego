/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * The users collection
 */
define([
    'app',
    'lodash',
    'backbone',
    'models/user'
], function (app, _, Backbone, User) {
    'use strict';

    var UsersCollection = Backbone.Collection.extend({
        model: User,
        url  : app.API_ROOT + '/api/v1/users'
    });

    return UsersCollection;
});
