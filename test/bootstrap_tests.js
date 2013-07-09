/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/*global requirejs:true, mocha:true */

/**
 * This script is responsible for the configuration of requirejs for the tests
 * and loading and running the test modules.
 *
 * We support execution via "testem" or in the browser (index_browser.html),
 * which leads to some strange looking conditional code in here.
 * But this way we can 1. test in testem's ci mode
 * (see https://github.com/airportyh/testem) in an automated way in lots of
 * browsers and 2. quickly run the suite in a browser. Even the optimized
 * sources are testable and we can even run this suite via phonegap in a
 * mobile simulator or a real device. (see /readme.md)
 *
 * @author Michael Wager <mail@mwager.de>
 */

// scope is "window"
(function(undefined) {
    'use strict';

    // todo!? good way to mock socketio globally? just include!?
    /*window.io = {
        connect: function () {},
        on: function () {},
        emit: function () {}
    };*/

    if(__app_config__.ENV !== 'test') {
        throw {
            message: 'App-environment is not `test`!'
        };
    }

    var conf = {
        // needed in test environment:
        urlArgs: 'v=' + (new Date()).getTime(),
        waitSeconds: 60000, // dev only!

        // we run in testem as node app, so leading "/"
        baseUrl: '/app/scripts/',

        // BOOM! the app will be started like normal
        deps: ['main'],

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
        }
    };

    // the following paths are relative to the baseUrl !
    // keep in sync with paths in /app/config.js// keep in sync with config.js
    // ----- browser tests against optimized code (see index_browser.html) -----
    if(__app_config__.browser && __app_config__.optimized) {
        conf.baseUrl = '../dist/scripts/';
        conf.paths = {};
    }

    // ----- testem oder browser dev -----
    else if((!__app_config__.browser) || (__app_config__.browser && !__app_config__.optimized)) {
        conf.baseUrl = '../app/scripts/';

        // keep in sync with config.js
        conf.paths = {
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
        };
    }

    // muss immer sein:
    conf.paths.chai = '../../test/lib/chai';

    // --- specs:
    conf.paths.AppSpec = '../../test/spec/app.spec';
    conf.paths.AppRouterSpec = '../../test/spec/router.spec';

    // --- models & collections
    conf.paths.UserSpec = '../../test/spec/models/user.spec';
    conf.paths.TodolistSpec = '../../test/spec/models/todolist.spec';
    conf.paths.TodoSpec = '../../test/spec/models/todo.spec';

    // --- views
    conf.paths.StartViewSpec = '../../test/spec/views/start.spec';

    // --- phonegap specific tests
    conf.paths.PhonegapSpec = '../../test/spec/phonegap.spec';

    requirejs.config(conf);

    require(['require', 'chai', 'zepto'], function (require, chai, $) {

        window.log = function () {
            if(console) {
                if(arguments.length === 1) {
                    var $log = $('#logs');
                    if($log.length > 0) {
                        $log.append(arguments[0] + '<br />');
                    }

                }

                console.log.apply(console, arguments);
            }
        };

        window.chai = chai;

        var assertion_counter = 0;

        // hook into the expect method
        window.expect = function (a) {
            assertion_counter++;
            return chai.expect(a);
        };

        window.should = function (a) {
            assertion_counter++;
            return chai.should(a);
        };

        // from http://robdodson.me/blog/2012/05/29/testing-backbone-modules/
        // ..."ignoreLeaks is useful because it’s easy for mocha to see jQuery or any other
        // global variable as a good reason to abort a test. IMO that’s what JSLint/Hint
        // is for, and bailing everytime you see a global is going to make testing 3rd
        // party code especially difficult."

        // After mocha.run will be called it will check the global vars for leaks
        // You can setup allowed globals by setting the globals opt to an array
        // in mocha.setup(opts);
        // Any global vars defined before mocha.run() are accepted
        mocha.setup({
            ui: 'bdd',
            ignoreLeaks: true
        });

        // load all specs and start mocha
        require(['app',

            'AppSpec',

            // Routers
            'AppRouterSpec',

            // Models & Collections
            'UserSpec', 'TodolistSpec', 'TodoSpec',

            // Views
            'StartViewSpec',

            // Phonegap stuff
            'PhonegapSpec'

            // The specs doesn't export anything. They will just be register their
            // test function so mocha can run the suite once we loaded all specs.
            ], function ( /*app*/ ) {
                log('=== all modules loaded, running mocha ===');

                /**
                 * Show count of assertions (only via "expect()" yet)
                 *
                 * Called as all tests were run
                 */
                var onTestsDone = function () {
                    log('assertion_counter: ' + assertion_counter);

                    $('#stats').append('<li>ASSERTIONS: <em>' + assertion_counter + '</em></li>');

                    setTimeout(function () {
                        $('.ui-loader').addClass('hidden'); // jqm loader...
                    }, 500);
                };

                $('#loading').html('soon...');

                // hmm e.g. app.spec.js gets executed before main.js !?!? )-:
                setTimeout(function () {
                    $('#loading').remove();

                    mocha.run(onTestsDone);
                }, 400);
            });
    });
}(this));
