#!/bin/env node

/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * The AtOneGo "master" process
 *
 * "The important thing is that the master does very little,
 *  increasing our resilience (= Widerstandsfähigkeit) to unexpected errors."
 *
 * @see http://nodejs.org/api/domain.html#domain_warning_don_t_ignore_errors
 */
'use strict';

// var ENV = process.env.NODE_ENV || 'development'

var
    cluster     = require('cluster'),
    application = require('./server/lib/application'),
    pjson       = require('./package.json'),
    logger      = require(application.PROJECT_ROOT + 'server/lib/logger');


console.log('===== AtOneGo ' + pjson.version +
    ' Cluster isMaster : ' + cluster.isMaster);


/**
 * If we are a fork of the master: boot the app (-;
 */
if (!cluster.isMaster) {
    return require('./worker').bootApp();
}

// fork ONLY ONE worker
cluster.fork();

cluster.on('disconnect', function(worker) {
    logger.info('worker disconnect: WORKER ID = ' + worker.id +
        ' - pid was: ' + worker.process.pid + ' ==> forking new one...');

    // now fork a new one !
    cluster.fork();
});
