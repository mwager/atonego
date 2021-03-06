/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * Server API test bootstrap file
 *
 * Dies ist notwendig um unsere Node.js-App via EventEmitter einzubinden
 *
 * Diese wird normalerweise als "worker" eines "masters" ausgeführt,
 * hier jedoch wird der worker direkt eingebunden, um die API direkt
 * testen zu können
 *
 * exports before and after methods for api tests
 *
 * @author Michael Wager <mail@mwager.de>
 */
'use strict';

// set test environment
process.env.NODE_ENV = 'test';

var
    application = require('../lib/application'),
    mongoose = require('mongoose'),
    AppEmitter,
    utils, db,
    appServ,
    config;

// this module exports:
var BOOTSTRAP = {};
BOOTSTRAP.ENV = process.env.NODE_ENV;
BOOTSTRAP.api_v1 = application.apiVersion;

utils = require(application.PROJECT_ROOT + 'server/lib/utils');
db = require(application.PROJECT_ROOT + 'server/lib/db');
BOOTSTRAP.BASE_URL = 'http://127.0.0.1:4001/';
BOOTSTRAP.API_URL = 'http://127.0.0.1:4001' + application.apiVersion;


console.log('===== BOOTSTRAP API TESTS ====='.green);

/**
 * clean all collections
 */
function cleanDB(cb) {
    db.cleanDB(mongoose, function () {
        cb();
    });
}

BOOTSTRAP.before = function (cb) {
    utils.loadConfig(application.PROJECT_ROOT + 'server/config', function (conf) {
        var calledApp = false;

        config = conf;

        // disconnect first!
        db.disconnectFromDB(mongoose, function() {
            // THIS STARTS THE SERVER
            // hier wird der worker direkt eingebunden (nicht also "worker")
            // Dies ist notwendig um die app für die api tests zu starten !
            // (anderer port zB 4001, siehe server-config)
            AppEmitter = require(application.PROJECT_ROOT + 'worker');

            AppEmitter.on('getApp', function (app) {
                if (calledApp) {
                    return false;
                }

                calledApp = true;
                appServ = app;

                app.listen(config[BOOTSTRAP.ENV].PORT);

                // clean whole db before running all tests
                cleanDB(cb);
            });

            // TIMEOUT NEEDED
            setTimeout(function() {
                AppEmitter.emit('checkApp');
            }, 1000);
        });
    });
};

BOOTSTRAP.after = function (cb) {
    var closedApp = false;

    db.disconnectFromDB(mongoose);

    appServ.on('close', function () {
        setTimeout(function () {
            if (!closedApp) {
                cb();
                closedApp = true;
            }
        }, 500);
    });

    setTimeout(function() {
        appServ.close();
    }, 100);
};

module.exports = BOOTSTRAP;
