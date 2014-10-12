/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * Signup View
 *
 * @author Michael Wager <mail@mwager.de>
 */
define(function (require) {
    'use strict';

    var _        = require('lodash'),
        $        = require('zepto'),
        app      = require('app'),
        common   = require('common'),
        tpl      = require('text!templates/signup.html'),
        BaseView = require('views/base'),
        events   = {};

    events['keyup .signup-input'] = 'validate';
    events['blur #password2'] = 'validateOnFormInputBlur';
    events[app.defaultClickEvent + ' #signup'] = 'signup';

    return BaseView.extend({
        id: 'signup-view',

        title: function () {
            return __('signup');
        },
        events: events,

        initialize: function () {
            this.template = _.template(tpl);
        },

        render: function () {
            this.renderSelf();

            // render the header
            // each "root-view" must render it's header
            this.renderHeader({
                showBackButton: true,
                el: $('header', this.el)[0],
                title: this.title()
            });

            this.$display_name  = $('#display_name', this.el);
            this.$email         = $('#email', this.el);
            this.$pw            = $('#password', this.el);
            this.$pw2           = $('#password2', this.el);
            this.$pwErr         = $('#pw-error', this.el);
            this.$signupBtn     = $('#signup', this.el);
            this.$cancelBtn     = $('.cancel', this.el);

            return this;
        },

        // validate the signup form
        validate: function () {
            // dispay_name bei signup nicht, später schon this.$display_name.val().length > 0 &&
            var valid = this.$email.val().length > 0 &&
                        this.$pw.val().length  > 5 &&
                        this.$pw2.val().length > 5 &&
                        /@/.test(this.$email.val());

            // passwords must match
            if($.trim(this.$pw.val()) !== $.trim(this.$pw2.val())) {
                valid = false;
            }

            this.$signupBtn.attr('disabled', valid ? null : true);

            if(valid) {
                this.$pwErr.addClass('hidden');
            }

            return valid;
        },

        validateOnFormInputBlur: function() {
            var $el = $('#pw-error', this.el);

            $el.toggleClass('hidden', this.validate());
        },

        _toggleButtons: function (valid) {
            this.$cancelBtn.attr('disabled', valid ? null : true);
            this.$signupBtn.attr('disabled', valid ? null : true);
        },

        /**
         * signup the user via $.ajax and a jsonp GET request...
         */
        signup: function (e) {
            e.preventDefault();

            var ele = $(e.currentTarget);
            if(ele.attr('disabled')) {
                return false;
            }

            // erst connection check
            if(!app.checkInternetConnection()) {
                common.notify(__('noInternetConnection'));
                return false;
            }

            if(!this.validate()) {
                return false;
            }

            var self = this,
                display_name    = common.escape($.trim(this.$display_name.val())),
                email           = common.escape($.trim(this.$email.val())),
                password        = common.escape($.trim(this.$pw.val())),
                password2       = common.escape($.trim(this.$pw2.val()));

            // validation only cientside, do not send 2 passwords
            if(password !== password2) {
                return false;
            }

            // disable the cancel button
            this._toggleButtons(false);

            // blur all textfields now (so keyboard dissapears on real devices)
            this.$display_name.blur();
            this.$email.blur();
            this.$pw.blur();
            this.$pw2.blur();

            common.showDefaultLoader();

            $.ajax({
                cache: false,
                timeout: app.AJAX_TIMEOUT,

                type: 'POST',
                dataType: 'json',
                data: {
                    display_name: display_name,
                    email: email,
                    p1: password,

                    // pass "detected language", so the lang of the created
                    // user is the right one (hopefully)
                    lang: app.lang
                },
                url: app.API_ROOT + '/api/v1/signup',
                success: function (json) {
                    common.hideDefaultLoader();

                    if(json.error) {
                        self._toggleButtons(true);
                        common.notify(__(json.error), 8000);
                        return;
                    }

                    // save mail to localStorage for quick access
                    common.store.set('email', email);

                    setTimeout(function () {
                        common.notify(__('signupSuccessMessage'), 8000);
                    }, 100);

                    app.router.setAuthenticated(json);

                    app.router.go('todolists');

                    // display welcome message in the activity stream (-:
                    app.activityCollection.addActivity({
                        key: 'welcome_message_after_signup'
                    });
                },
                error: function () {
                    common.hideDefaultLoader();
                    common.notify(__('error'), 3000);

                    self._toggleButtons(true);
                }
            });

            return false;
        }
    });
});
