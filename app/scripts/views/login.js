/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * Login View
 *
 * @author Michael Wager <mail@mwager.de>
 */
define(function (require) {
    'use strict';

    var $           = require('zepto'),
        _           = require('lodash'),
        app         = require('app'),
        common      = require('common'),
        tpl         = require('text!templates/login.html'),
        BaseView    = require('views/base'),
        events      = {};

    events['keyup .login-input'] = 'validate';
    events[app.defaultClickEvent + ' #login-btn'] = 'login';

    return BaseView.extend({
        id: 'login-view',
        title: function () {
            return __('login');
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
                app: app
            });

            // render the header
            // each "root-view" must render it's header
            this.renderHeader({
                showBackButton: true,
                el: $('header', this.el)[0],
                title: this.title()
            });

            var email = common.store.get('email');

            this.$email     = $('#email', this.el);
            this.$pw        = $('#password', this.el);
            this.$loginBtn  = $('#login-btn', this.el);

            if(email) {
                this.$email.val(email);
            }

            return this;
        },

        // validate the login form
        validate: function (e) {
            var key = e.keyCode || e.which;
            var valid = this.$email.val().length > 0 &&
                        this.$pw.val().length > 0;

            try {
                this.$loginBtn.attr('disabled', valid ? null : true);
            } catch(e) {}

            // login on ENTER KEY
            if(key === 13) {
                this.login();
            }

            return valid;
        },

        _toggleButtons: function (valid) {
            try {
                this.$loginBtn.attr('disabled', valid ? null : true);
            } catch(e) {
                // ignore
                // log("ERROR: " + e.message)
            }
        },

        login: function (e) {
            if(e) {
                e.preventDefault();
            }

            var self = this;

            if(this.$loginBtn.attr('disabled')) {
                return false;
            }

            var email       = common.escape(this.$email.val()),
                password    = common.escape(this.$pw.val());

            // save the user's mail to localStorage
            common.store.set('email', email);

            // erst connection check
            if(!app.checkInternetConnection()) {
                common.notify(__('noInternetConnection'));
                return false;
            }

            this._toggleButtons(false);

            common.showDefaultLoader();

            // blur now, focus password on error
            this.$email.blur();
            this.$pw.blur();

            app.login(email, password, function (error, success) {
                common.hideDefaultLoader();

                if(error) {
                    self._toggleButtons(true);

                    // app.router.go('login');
                    return common.notify(error, 5000);
                }
                if(success) {
                    app.router.go('todolists');
                }
            });

            return false;
        }
    });
});
