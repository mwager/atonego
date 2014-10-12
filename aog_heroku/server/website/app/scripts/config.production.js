/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * requrejs config for production use - see Makefile
 *
 * KEEP IN SYNC WITH config.js
 */
require.config({

    deps   : ['main'],

    shim: {
        backbone    : {
            deps   : ['lodash', 'zepto'],
            exports: 'Backbone'
        },

        mobiscroll: {
            deps   : ['zepto'],
            exports: 'Mobiscroll'
        },

        cryptojs: {
            exports: 'CryptoJS'
        }
    },

    paths: {
        libs        : '../scripts/libs',

        zepto       : '../scripts/libs/zepto',
        lodash      : '../scripts/libs/lodash',
        backbone    : '../scripts/libs/backbone',
        text        : '../scripts/libs/text',
        i18next     : '../scripts/libs/i18next.amd-1.6.0',
        moment      : '../scripts/libs/moment',
        mobiscroll  : '../scripts/libs/mobiscroll',
        cryptojs    : '../scripts/libs/cryptojs.aes.3.1.2',
        JrFork      : '../scripts/libs/junior_fork'
        // IScroll     : '../scripts/libs/iscroll-lite'
    }
});
