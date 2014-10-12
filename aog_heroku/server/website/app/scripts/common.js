/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/*global unescape:true*/

/**
 * module for global common functionality
 */
define(function (require) {
    'use strict';

    var $ = require('zepto');
    var _ = require('lodash');
    var Backbone = require('backbone');
    var moment = require('moment');

    // var app = require('app'); hmm...
    // public API
    var common = {};

    var localStorageNamespace = 'aog-';

    var userTrialDays = 3; // sync with user-model on server!

    // DOM Elements
    var $htmlBody, $doc, $notification;

    // setTimeout
    var notifyTimer;

    // cache DOM Selectors
    $(document).ready(function () {
        $htmlBody = $('html,body');
        $doc = $(document);

        $notification= $('#notification');
        $notification.on(__app_config__.defaultClickEvent, function() {
            $notification.hide().html('');
        });
    });

    common = _.extend(common, {
        PAGED_EDIT_LOCK: false,

        // moment.js formatting:
        // http://momentjs.com/docs/#/parsing/string-format/
        // Global constants for date formats
        dateFormats: {
            de: {
                DATE_FORMAT:     'YYYY-MM-DD',
                DATE_FORMAT_OUT: 'DD.MM.YYYY HH:mm'
            },
            en: {
                DATE_FORMAT:     'YYYY-MM-DD',
                DATE_FORMAT_OUT: 'MM/DD/YYYY h:mm A'
            }
        },

        // Which filter are we using?
        // empty, active, completed
        TodoFilter: '',


        // html/ui helpers
        showDefaultLoader: function () {
            // close the notify message, if its open
            common.closeNotify();

            $('#app-loader').show();

            return this;

        },
        hideDefaultLoader: function () {
            $('#app-loader').hide();
            return this;
        },

        showLoader: function () {
            this.showDefaultLoader();
            return this;
        },

        hideLoader: function () {
            this.hideDefaultLoader();
            return this;
        },

        /**
         * If user edits and wants to leave the screen without saving the data,
         * we lock the page and can ask him if he really want to leave
         */
        lockScreen: function() {
            common.PAGED_EDIT_LOCK = true;
        },
        unlockScreen: function() {
            common.PAGED_EDIT_LOCK = false;
        },
        isScreenLocked: function() {
            return common.PAGED_EDIT_LOCK;
        },

        hideSplashscreen: function () {
            // hide splashscreen:
            // http://simonmacdonald.blogspot.dk/2012/04/phonegap-android-splashscreen-just-got.html
            if(navigator && navigator.splashscreen) {
                navigator.splashscreen.hide();
                // cordova.exec(null, null, "SplashScreen", "hide", []);
            }
        },

        /**
         * simple notify message
         *
         * @param string msg The Info message to display to the user
         * @param int millis Millis till auto close (default 3000)
         * @param function onclose OnClose Callback
         */
        notify: function (msg, millis, onclose) {
            if(!_.isFunction(onclose)) {
                onclose = function () {};
            }

            if(!$notification) {
                return false;
            }

            // close first if already vivible
            if(notifyTimer) {
                clearTimeout(notifyTimer);
            }

            common.closeNotify();

            $notification.html('<p>' + msg + '</p>').show();

            notifyTimer = setTimeout(function() {
                common.closeNotify();
            }, millis || 7000);
        },

        closeNotify: function() {
            if(!$notification) {
                return false;
            }

            $notification.hide().html('');
        },

        /**
         * simple dialog based on phonegap notification
         */
        dialog: function (msg, onclose, confirmDialog) {
            if(!_.isFunction(onclose)) {
                onclose = function () {};
            }

            if(confirmDialog) {
                if(!__app_config__.touch || !navigator.notification) {
                    var confirmed = window.confirm(msg);
                    if(_.isFunction(onclose)) {
                        onclose(confirmed);
                    }
                } else {
                    var confirmCallback = function(idx) {
                        onclose(idx === 1);
                    };

                    navigator.notification.confirm(
                        msg,
                        confirmCallback,
                        __('Confirm'),
                        [__('yes'), __('no')] /// NOTE  pg >=2.7 this must be an arry
                    );
                }

            } else {
                if(!__app_config__.touch || !navigator.notification) {
                    window.alert(msg);
                } else {
                    navigator.notification.alert(msg, onclose, 'Info', __('close'));
                }
            }
        },

        // ----- DATE utils -----
        /**
         * function checks if given object has a created_at property and if
         * this is a valid date e.g. 2012-01-01 22:00:01
         * @param object obj Sollte created_at oder updated_at property besitzen
         * @return {Boolean}
         */
        hasDate: function (obj) {
            if(typeof obj !== 'object') {
                return false;
            }

            // einer von beiden sollte gesetzt sein
            if(typeof obj !== 'undefined' && typeof obj.created_at !== 'undefined' &&
             typeof obj.updated_at !== 'undefined' &&
            // obj.created_at !== null  && obj.updated_at !== null &&
            (typeof obj.created_at === 'string' || typeof obj.updated_at === 'string')) {
                return true;
            }

            return false;
        },

        /**
         * function parses a date using moment.js
         * @param string date
         * @return {*}
         */
        parseDate: function (date, lang) {
            try {
                return moment(date).format(common.dateFormats[lang].DATE_FORMAT_OUT);
            } catch(e) {
                return '';
            }
        },

        /**
         * function returns time since given date
         * @param string date
         * @return {*}
        */
        fromNow: function (stamp, onlyValue, lang) {
            try {
                stamp    = parseInt(stamp, 10);
                var date = new Date(stamp);

                moment.lang(lang);

                return moment(date).fromNow(onlyValue);
            } catch(e) {
                return '';
            }
        },

        /**
         * return formatted string of current time
         * @return {*}
         */
        now: function (lang) {
            try {
                return moment().format(common.dateFormats[lang].DATE_FORMAT);
            } catch(e) {
                return '';
            }
        },

        // hm not used!?
        diffInDaysFromNowTo: function (date, lang) {
            return moment().format(common.dateFormats[lang].DATE_FORMAT)
                           .diff(moment(date, common.dateFormats[lang].DATE_FORMAT), 'days');
        },

        /**
         * Try to get the user of an editable record
         * (updated_by || created_by)
         */
        getUser: function(data, isUpdatedAt) {
            if(!_.isObject(data)) {
                return __('unknown');
            }
            if(!data.updated_by || !data.created_by) {
                return __('unknown');
            }

            if(isUpdatedAt) {
                return data.updated_by.display_name;
            }
            else {
                return data.created_by.display_name;
            }
        },

        /**
         * Get custom parse and format objects for working with datetimes
         * and different languages
         *
         * parse & format inspired by
         * http://dl.dropboxusercontent.com/u/143355/datepicker/datepicker.html
         * -> https://github.com/twitter/bootstrap/pull/614
         */
        getDateParser: function(lang) {
            switch(lang) {
            case 'en':
                return {
                    parse: function (string) {
                        var matches;
                        if ((matches = string.match(/^(\d{2,2})\/(\d{2,2})\/(\d{4,4}) (\d{1,2}):(\d{2,2}) (AM|PM)$/))) {
                            // ["06/03/2013 00:00 AM", "06", "03", "2013", "00", "00", "AM", index: 0, input: "06/03..
                            // log(matches)

                            var type  = matches[6].toLowerCase();
                            var hours = parseInt(matches[4], 10);
                            var mins  = parseInt(matches[5], 10);

                            if(type === 'pm') {
                                hours += 12;
                            }

                            return new Date(matches[3], matches[1] - 1, matches[2], hours, mins);
                        } else {
                            return null;
                        }
                    },
                    format: function (date) {
                        var
                            type = 'AM',
                            month = (date.getMonth() + 1).toString(),
                            dom   = date.getDate().toString(),
                            hours = date.getHours(),
                            mins  = date.getMinutes().toString();

                        if (month.length === 1) {
                            month = '0' + month;
                        }
                        if (dom.length === 1) {
                            dom = '0' + dom;
                        }

                        // "For the first hour of the day (12 Midnight to 12:59 AM), subtract 12 Hours"
                        if(hours >= 12) {
                            type = 'PM';
                            hours -= 12;
                        }

                        // erst jetzt
                        hours = hours.toString();

                        if (hours.length === 1) {
                            hours = '0' + hours;
                        }
                        if (mins.length === 1) {
                            mins = '0' + mins;
                        }

                        return month + '/' + dom + '/' + date.getFullYear() + ' ' + hours + ':' + mins + ' ' + type;
                    }
                };
            case 'de':
                return {
                    parse: function (string) {
                        var matches;

                        if ((matches = string.match(/^(\d{2,2})\.(\d{2,2})\.(\d{4,4}) (\d{2,2}):(\d{2,2})$/))) {
                            //log(matches) // ->   ["10.05.2013", "10", "05", "2013", "18", "15", index: 0, input: ...

                            var hours = parseInt(matches[4], 10);
                            var mins  = parseInt(matches[5], 10);

                            return new Date(matches[3], matches[2] - 1, matches[1], hours, mins);
                        } else {
                            return null;
                        }
                    },
                    format: function (date) {
                        var
                            month = (date.getMonth() + 1).toString(),
                            dom   = date.getDate().toString(),
                            hours = date.getHours().toString(),
                            mins  = date.getMinutes().toString();

                        if (month.length === 1) {
                            month = '0' + month;
                        }
                        if (dom.length === 1) {
                            dom = '0' + dom;
                        }

                        if (hours.length === 1) {
                            hours = '0' + hours;
                        }
                        if (mins.length === 1) {
                            mins = '0' + mins;
                        }

                        return dom + '.' + month + '.' + date.getFullYear() + ' ' + hours + ':' + mins;
                    }
                };
            }
        },

        /**
         * How long ist the user active from now
         */
        getUserActiveDays: function(user, lang) {
            // wieviele tage ist der account noch gültig, falls noch nicht aktiviert?
            // created_at + 3 Tage (siehe auch api: user.js -> "userTrialDays")
            var date = moment(user.active_since).add('days', userTrialDays);

            var days = common.fromNow(date.toDate().getTime(), true, lang);

            return days;
        },

        /**
         * Scroll to the top
         */
        scrollTop: function () {
            var el = $('#app-main .content')[0];

            if(!el) {
                return false;
            }

            el.scrollTop = 0;

            // window.scrollTo(0, 0);

            return this;
        },

        /**
         * Scroll to the bottom
         */
        scrollBottom: function () {
            if(!$doc) {
                return false;
            }

            var el = $('#app-main .content')[0];

            if(!el) {
                return false;
            }

            el.scrollTop = $doc.height();

            // if(window.scrollTo) {
            //    window.scrollTo(0, $doc.height());
            // }

            return this;
        },

        isValidMail: function (mail) {
            if(typeof mail !== 'string') {
                return false;
            }

            return(/^[a-zA-Z0-9._\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,4}$/).test(mail);
            // return (/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/).test(mail);
        },

        /**
         * Generate a name from a mail
         */
        generateNameFromEmail: function (email) {
            if(!common.isValidMail(email)) {
                return '---';
            }

            var name = email.split('@')[0];
            return name;
        },

        // simple localStorage proxy
        store: {
            set: function (key, value) {
                if(!_.isString(value)) {
                    throw 'must provide a string';
                }

                return localStorage.setItem(localStorageNamespace + key, value);
            },
            get: function (key) {
                if(!key) {
                    return null;
                }

                var value = localStorage.getItem(localStorageNamespace + key);

                if(!value) {
                    return null;
                }

                return value;
            },
            drop: function (key) {
                return localStorage.removeItem(localStorageNamespace + key);
            }
        },

        // phone notify util on any IO Update
        // supports sound, vibration, both or none
        notifyIOUpdate: function (notify_settings) {
            if(__app_config__.isPaused || !notify_settings) {
                return false;
            }

            var vibrateMillis = 500;

            // on browser too, using default notify()
            if(!__app_config__.touch || !navigator.notification) {
                return common.notify(__('ioUpdate'));
            }

            common.vibrate(vibrateMillis, notify_settings);

            try {
                /* later?
                if(notify_settings.sound === true) {
                    navigator.playDaRiddim!()
                }*/
            } catch(e) {}
        },

        /**
         * Vibrate the phone via phonegap's js api
         */
        vibrate: function(millis, notify_settings) {
            if(!navigator.notification || !navigator.notification.vibrate) {
                return false;
            }

            if(typeof notify_settings !== 'object') {
                return false;
            }

            if(notify_settings.vibrate !== true) {
                return false;
            }

            try {
                navigator.notification.vibrate(millis);
            } catch(e) {}
        },

        /**
         * generate a pseudo random string
         * @param  {[type]} n [description]
         * @return {[type]}   [description]
         */
        random: function(n) {
            var text = [];
            var possibleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            var len = possibleChars.length;
            var i, random;

            for(i = 0; i < n; i++) {
                random = Math.floor(Math.random() * len);
                text.push(possibleChars.charAt(random));
            }

            return text.join('');
        },

        /**
         * Escape some tricky stuff from a string
         */
        escape: function(str) {
            return str.replace(/&/ig, '&amp;') // must be first !
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/'/g, '&#039;')
                    .replace(/"/g, '&quot;');

            // return encodeURIComponent(str);
        },

        /**
         * Creates a base-64 encoded ASCII string from a "string" of binary data
         * using the browser's native function window.btoa()
         *
         * @see https://developer.mozilla.org/en-US/docs/Web/API/window.btoa
         */
        base64Encode: function(val) {
            if(!window.btoa) {
                throw 'Native Base64 encoding not supported in this browser';
            }

            if(!_.isString(val)) {
                throw 'Base64 encoding - no string: ' + val;
            }

            // without Unicode support:
            // var encodedData = window.btoa(val);

            // with Unicode support:
            var encodedData = window.btoa(unescape(encodeURIComponent( val )));

            return encodedData;
        }

    }, Backbone.Events);

    return common;
});
