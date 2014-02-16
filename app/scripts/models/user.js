/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * UserModel
 */
define(function(require) {
    'use strict';

    var
        // _ = require('underscore'),
        Backbone = require('backbone'),
        app      = require('app');

    var User = Backbone.Model.extend({
        idAttribute: '_id',
        urlRoot    : app.API_ROOT + '/api/v1/users',
        defaults   : {
            active: true, // default true, sonst erscheint die notActivated Meldung bei erstem Rendern
            active_since: new Date(),

            display_name: '',

            name : '',
            email: '',
            password: null,

            lang: 'en', // default 'en'

            // Benachrichtigungs-Einstellungen: default alles true
            notify_settings: {
                email:   true,
                vibrate: true,
                sound:   true
            },

            img_url: null, // XXX maybe later

            todolists  : [],

            // zu meinen Listen hinzugefügte benutzer
            added_users: [],

            // temporär: zu welchen listen ich von wem eingeladen wurde
            invite_list_ids: []
        }
    });

    return User;
});
