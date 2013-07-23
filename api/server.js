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

// var ENV = process.env.NODE_ENV || 'development';

/**
 * Register this app with nodefly for realtime monitoring.
 *
 * "This must be the first require before you load any modules.
 * Otherwise you will not see data reported."
 *
 * XXX scaling. new app?
 *
 * @see http://nodefly.com/#howto
 * @see https://www.openshift.com/blogs/step-by-step-nodejs-guide-for-realtime-monitoring-and-scaling
  XXX now
if(ENV === 'production') {
    var app_name = process.env.OPENSHIFT_APP_NAME  || 'AtOneGo Local',
        host_url = process.env.OPENSHIFT_APP_DNS   || '127.0.0.1',
        gear_id  = process.env.OPENSHIFT_GEAR_UUID || 1,
        options  = {blockThreshold: 10},
        api_key  = require('./server/config/environments/production.json').NODEFLY_KEY;

    require('strong-agent').profile(
        api_key,
        [app_name, host_url, gear_id],
        options // optional
    );
}
*/
// -----------------------------------------------------------------------------

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
    logger.log('worker disconnect: WORKER ID = ' + worker.id +
        ' - pid was: ' + worker.process.pid + ' ==> forking new one...');

    // now fork a new one !
    cluster.fork();
});
