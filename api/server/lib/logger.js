/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * File: logger.js
 * Author: Michael Wager <mail@mwager.de>
 *
 * simple env based logger
 */
// 'use strict'; Octal literals are not allowed in strict mode. 0666

var
    fs = require('fs'),
    log = {},
    ENV = process.env.NODE_ENV || 'development',
    filePath, fileWriter;
//utils = require('./utils');

filePath = __dirname + '/../logs/' + ENV.toLowerCase() + '.log';

fileWriter = fs.createWriteStream(filePath, {
    flags   :'a',
    encoding:'utf-8',
    mode    :0666
});

/***
 * return a formatted date like '2012-10-09 12:34:12'
 * @return {String}
 */
function getLogDate() {
    'use strict';

    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() + ' ' +
        d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
}

/**
 * log a message to one of the log files
 * @param string msg
 */
log.info = function (msg, isError) {
    'use strict';

    var str = (isError ? '### TODOS-APP ERROR' : '### TODOS-APP INFO') +
     ' [' + getLogDate() + '] ' + msg.toString();

    str = '\n---> ENV: ' + ENV + ' <---\n' + str;

    fileWriter.write(str);

    // in dev env, also log to stdout
    // if (ENV === 'development' || ENV === 'staging' || ENV === 'production') {
    if (ENV !== 'test') {
        // log to stdout too in "production",
        // bei openshift werden zwar alle console logs in eine globale
        // "Node-Log" Datei geschrieben, wir haben jedoch auch unsere eigenen
        // Hier loggen wir auch in Production, 2mal logs is besser als 1mal logs
        console.log(str);
    }

    return true;
};

/**
 * log an error message with stack trace
 *
 * @param string msg
 */
log.err = function (msg) {
    'use strict';

    try {
        throw new Error(msg);
    }
    catch (err) {
        log.info(err.stack, true);
        return true;
    }
};

/**
 * Log a message to the cronjob logfile
 *
 * @param string msg
 */
log.cronlog = function (msg) {
    var filePath = __dirname + '/../logs/' + ENV.toLowerCase() + '_cronjob.log';
    var fileWriter = fs.createWriteStream(filePath, {
        flags   :'a',
        encoding:'utf-8',
        mode    :0666
    });

    fileWriter.write(msg + '\n');
};

module.exports = log;
