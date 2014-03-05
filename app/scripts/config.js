/*
 * This file is part of the at-one-go project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// requirejs dev config
// keep in sync with config.production.js !
// der requirejs optimizer meckert wegen urlArgs, deshalb tauscht Makefile
// diese temporär mit "config.production.js" aus
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

require.config({

    urlArgs: 'v' + new Date().getMilliseconds() + Math.random() * 1000,

    waitSeconds: 60000, // dev only!

    deps   : ['main'],

    // for backbone: map jquery to zepto
    map: {
        '*': {
            'jquery': 'zepto'
        }
    },

    paths: {
        libs        : '../scripts/libs',

        zepto       : '../scripts/libs/zepto', // '../bower_components/zepto/index',
        underscore  : '../bower_components/underscore/underscore',
        backbone    : '../bower_components/backbone/backbone',
        fastclick   : '../bower_components/fastclick/lib/fastclick',
        text        : '../bower_components/requirejs-text/text',
        i18next     : '../scripts/libs/i18next.amd-1.6.0',
        moment      : '../scripts/libs/moment',
        mobiscroll  : '../scripts/libs/mobiscroll',
        JrFork      : '../scripts/libs/junior_fork',

        // storage stuff
        VanillaStorage: '../bower_components/vanilla-storage/src/VanillaStorage',
        WebSQLStorage:  '../bower_components/vanilla-storage/src/WebSQLStorage',
        IDBStorage:     '../bower_components/vanilla-storage/src/IDBStorage',
        storageHelpers: '../bower_components/vanilla-storage/src/storageHelpers',
        cryptojs    :   '../scripts/libs/cryptojs.aes.3.1.2'
    },

    shim: {
        zepto: {
            exports: 'Zepto'
        },

        mobiscroll: {
            deps   : ['zepto'],
            exports: 'Mobiscroll'
        },

        cryptojs: {
            exports: 'CryptoJS'
        }
    }
});
