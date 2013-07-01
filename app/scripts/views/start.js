/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * StartScreenView
 *
 * @author Michael Wager <mail@mwager.de>
 */
define(function (require) {
    'use strict';

    var
        _        = require('lodash'),
        app      = require('app'),
        // common = require('common'),
        tpl      = require('text!templates/start.html'),
        BaseView = require('views/base'),
        events   = {};

    // events[app.defaultClickEvent + ' .no-account-btn'] = 'startWithoutAccount';

    return BaseView.extend({
        id: 'startview',

        title: function () {
            return __('start');
        },
        events: events,

        initialize: function () {
            this.template = _.template(tpl);

            app.user.on('change', this.render, this);
        },

        /**
         * render the start screen
         */
        render: function () {
            this.renderSelf({
                app: app
            });

            return this;
        }

        /*,
        startWithoutAccount: function() {
            common.store.set('no-account', 1);
            return true;
        }*/
    });
});
