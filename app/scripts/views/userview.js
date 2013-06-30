/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * User Edit View
 *
 * @author Michael Wager <mail@mwager.de>
 */
define([
    'app',
    'common',
    'zepto',
    'lodash',
    'text!templates/userview.html',
    'views/base'
], function (app, common, $, _, tpl, BaseView) {
    'use strict';

    var events = {};
    events['keyup input']     = 'validate';
    events['blur #password2'] = 'validateOnFormInputBlur';

    events['change #select-lang'] = 'changeLang';
    events[app.defaultClickEvent + ' .ago-toggle-wrap'] = 'toggleCheckbox';

    return BaseView.extend({
        // bind to existing element !
        // (passed from settings view after rendering the root scfreen dom once!)
        // el    : '#user-sub-view',
        events: events,

        initialize: function () {
            var self = this;

            this.template = _.template(tpl);

            // triggered by the header view
            app.off('header-save');
            app.on('header-save', function(e) {
                self.saveUser(e);
            });

            // needed at all?
            // no. #mobile-performance
            // this.listenTo(this.model, 'change', this.render);
        },

        render: function () {
            var user = this.model.toJSON();

            var days = common.getUserActiveDays(user, app.lang);

            this.renderSelf({
                user:            user,
                app:             app,
                days:            days
            });

            this.$display_name  = $('#display_name', this.el);
            this.$email         = $('#email', this.el);
            this.$pw            = $('#password', this.el);
            this.$pw2           = $('#password2', this.el);
            this.$selLanguage   = $('#select-lang', this.el);
            this.$notifySettingsList = $('.notify-settings-list', this.el);

            this.$saveBtn = $('#header-save');

            return this;
        },

        validate: function () {
            common.lockScreen();

            var pw1 = $.trim(this.$pw.val()),
                pw2 = $.trim(this.$pw2.val());

            // sync with server... XXX model validation #reuse #tests
            var valid =
                this.$display_name.val().length > 0 &&
                    this.$display_name.val().length <= 32 &&
                    /@/.test(this.$email.val());

            this.$saveBtn = $('#header-save');

            var passwordChanged = pw1.length > 0 || pw2.length > 0;

            if(passwordChanged && (pw1 !== pw2)) {
                valid = false;
            }
            if(passwordChanged && (pw1.length < 6 || pw2.length < 6)) {
                valid = false;
            }

            if(this.$saveBtn.length > 0) {
                this.$saveBtn.toggleClass('disabled', !valid);
            }

            if(valid) {
                $('#pw-error', this.el).addClass('hidden');
            }

            return valid;
        },

        validateOnFormInputBlur: function() {
            var pw1 = $.trim(this.$pw.val()),
                pw2 = $.trim(this.$pw2.val());

            var passwordChanged = pw1.length > 0 || pw2.length > 0;

            var $el = $('#pw-error', this.el);

            $el.toggleClass('hidden', !(passwordChanged && !this.validate()));
        },

        /**
         * Update the user to the local db and to the server
         */
        saveUser: function (e) {
            e.preventDefault();

            var self         = this;
            var pw           = this.$pw.val();
            var pw2          = this.$pw2.val();
            var email        = this.$email.val();
            var display_name = this.$display_name.val();
            var mail         = $.trim(this.$email.val());
            var oldEmail     = app.user.get('email');

            // clear the password inputs after saving
            var clearPwFields = _.bind(function() {
                this.$pw.val('');
                this.$pw2.val('');
            }, this);

            // auch client seitig...
            var active = app.user.get('active');
            if(oldEmail !== mail) {
                active = false;
            }

            app.user.set({
                active: active,
                active_since: new Date()
            }, {silent: true});

            var notify_settings = {
                email:      this.$notifySettingsList.find('.email-checkbox').hasClass('checked'),
                push:       this.$notifySettingsList.find('.push-checkbox').hasClass('checked'),
                vibrate:    this.$notifySettingsList.find('.vibrate-checkbox').hasClass('checked'),
                sound:      true // evtl später ...
            };

            var data = {
                display_name: display_name,
                email       : mail,
                lang        : app.lang,
                notify_settings: notify_settings
            };

            // ##### local db update in folgenden 3 Fällen #####
            // Fall 1: Password changed
            // Fall 2: Email changed
            // Fall 3: Password & Email changed
            // lang changed... XXX immer!?!?!?!?

            // var passwordChanged   = pw ? pw !== app.user.get('password') : false;
            // var emailChanged      = app.user.get('email') !== mail;
            // var pwAndEmailChanged = passwordChanged && emailChanged;
            var userInLocalDb = {
                _id         : app.user.get('_id'),
                display_name: display_name,
                email       : mail,

                // WE DO NOT NEED THIS ON CLIENT SIDE!
                // password : passwordChanged ? pw : app.user.get('password'),
                API_TOKEN:       app.user.get('API_TOKEN'),

                todolists:       app.user.get('todolists'),
                active:          active,
                invite_list_ids: app.user.get('invite_list_ids'),

                lang:            app.lang,

                notify_settings: notify_settings
            };

            // check for both pws only client side
            if (pw.length > 0 && pw === pw2) {
                data.password = pw;
            }

            common.showLoader();

            // Der "save-button" muss hier bereits disabled werden:
            this.$saveBtn.addClass('disabled');

            // now the user can leave the screen while we save in the background
            common.unlockScreen();

            // NOTE for "patch" to work, data must not be set(),
            // it has to be passed to save()
            this.model.save(data, {
                patch: true,

                success: function () {
                    common.hideLoader();
                    clearPwFields();

                    if(oldEmail !== mail) {
                        common.dialog(__('userEmailWasChanged'));
                    }

                    // only notify the user on errors
                    /*else {
                        common.notify(__('saved'), 5000);
                    }*/

                    common.store.set('email', email);

                    // ##### db update #####
                    // IMMER !
                    app.storage.storeUser(userInLocalDb, function(/*err, success*/) {});
                },
                error  : function (model, json) {
                    common.hideLoader();

                    self.$saveBtn.removeClass('disabled');

                    var msg = __('error');

                    if(json && json.message) {
                        msg = json.message;
                    }

                    common.notify(msg); // zB mail exists
                }
            });
        },

        /**
         * Just enable the save button if any checkbox
         * gets checked/unchecked
         */
        toggleCheckbox: function(e) {
            // just toggle !!! (-:
            $(e.currentTarget).find('.ago-toggle').toggleClass('checked');

            this.__enableSaveButton();
        },

        changeLang: function (e) {
            e.preventDefault();

            var lang = this.$selLanguage.val();

            // triggers re-render
            app.changeLang(lang);

            this.__enableSaveButton();

            // update the title
            $('#title').html(__('settings'));
        },

        /**
         * Enable the save-button (remove "disabled" attribute)
         */
        __enableSaveButton: function() {
            common.lockScreen(); // (-;

            this.$saveBtn = $('#header-save');
            this.$saveBtn.removeClass('disabled');
        }
    });
});
