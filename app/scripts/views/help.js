/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * Help View
 *
 * @author Michael Wager <mail@mwager.de>
 */
define([
    'underscore',
    'app',
    'zepto',
    'text!templates/help.html',
    'views/base',
    'common'
],
    function (_, app, $, tpl, BaseView, common) {
        'use strict';

        var events = {};

        return BaseView.extend({
            id    : 'help-view',
            title : function () {
                return __('help');
            },
            events: events,

            initialize: function () {
                this.template = _.template(tpl);
            },

            dispose: function() {
                BaseView.prototype.dispose.call(this);
            },

            render: function () {
                this.renderSelf({
                    app: app,
                    version: app.VERSION + ' (' + common.generateClientID(app.VERSION, app.user.getId()) + ')',
                    ua: common.getUA()
                });

                // render the header
                // each "root-view" must render it's header
                this.renderHeader({
                    showBackButton: true,
                    el: $('header', this.el)[0],
                    title: this.title()
                });

                return this;
            }
        });
    }
);
