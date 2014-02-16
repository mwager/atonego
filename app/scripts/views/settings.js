/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * Settings View
 *
 * @author Michael Wager <mail@mwager.de>
 */
define(function (require) {
    'use strict';

    var $ = require('zepto'),
        _ = require('underscore'),
        app = require('app'),
        common = require('common'),
        UserView = require('views/userview'),
        tpl = require('text!templates/settings.html'),
        BaseView = require('views/base'),
        events = {};

    events[app.defaultClickEvent + ' #logout'] = 'logout';
    events[app.defaultClickEvent + ' #delete-account'] = 'deleteAccount';

    return BaseView.extend({
        id: 'settings-view',

        title: function () {
            return __('settings');
        },

        events: events,

        initialize: function () {
            this.template = _.template(tpl);

            this.userView = null;

            // we render this container only once
            this.alreadyRendered = false;
        },

        dispose: function() {
            this.alreadyRendered = false;

            if(this.userView) {
                this.userView.dispose();
            }

            BaseView.prototype.dispose.call(this);
        },

        // render the settings-screen
        render: function () {
            // only re-render the subviews?
            if(this.alreadyRendered) {
                // XXX Dieser ansatz hier ist zwar für mobile performance besser, aber
                // die "logout" und "delete-account" buttons werden nicht übersetzt
                // bei language change (wir bräuchten für alle weiterel elemente auf settings.html
                // eher eine subview, welche wir hier auch nur rendern müssten)
                this.userView.render();
                // this.customButtonView.render();
                return this;
            }

            this.alreadyRendered = true;

            var isLoggedIn = app.isLoggedIn;
            var user = app.user ? app.user.toJSON() : {
                email: ''
            };

            this.renderSelf({
                app: app,
                user: user,
                isLoggedIn: isLoggedIn
            });

            // render the header
            // each "root-view" must render it's header
            this.renderHeader({
                showBackButton: true,
                showSaveButton: true,
                el: $('header', this.el)[0],
                title: this.title()
            });

            this.userView = new UserView({
                el: $('#user-sub-view', this.el)[0],
                model: app.user
            });
            this.userView.render();

            return this;
        },

        // logout the current user
        logout: function (e) {
            e.preventDefault();

            setTimeout(function () {
                common.dialog(__('really'), function(con) {
                    if(con) {
                        app.router.go('logout');
                    }
                }, true);
            }, 20);

            return false;
        },

        // delete user account
        deleteAccount: function (e) {
            e.preventDefault();

            var dropAccount = function (userHasConfirmed) {
                if(!userHasConfirmed) {
                    return false;
                }

                // render the homescreen now
                app.router.deauthenticateUser();

                app.user.destroy({
                    success: function () {
                        setTimeout(function () {
                            common.notify(__('successfullyDeleted'));
                        }, 100);
                    },
                    error: function (model, json) {
                        var msg = __('error');
                        if(json && json.message) {
                            msg = json.message;
                        }

                        common.notify(msg);
                    }
                });
            };

            setTimeout(function () {
                common.dialog(__('reallyDeleteAccount'), dropAccount, true);
            }, 20);

            return false;
        }
    });
});
