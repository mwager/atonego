/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * Logger
 *
 * NOTE that on openshift, every console.log call will be written
 * to the node logs, so we do not need to write log files
 *
 * @author Michael Wager <mail@mwager.de>
 */
var
    ENV     = process.env.NODE_ENV || 'development',
    logger  = {},
    fs      = require('fs');

// var logFilePath = __dirname + '/../logs/' + ENV.toLowerCase() + '.log';
// var logFileWriter = fs.createWriteStream(logFilePath, {
//     flags   :'a',
//     encoding:'utf-8',
//     mode    :0666
// });

var cronLogFile = __dirname + '/../logs/' + ENV.toLowerCase() + '_cronjob.log';
var cronFileWriter = fs.createWriteStream(cronLogFile, {
    flags   :'a',
    encoding:'utf-8',
    mode    :0666
});

/***
 * Return a formatted date like '2012-10-09 12:34:12'
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
logger.log = function (msg, isError) {
    'use strict';

    if(!msg) {
        msg = 'no message provided';
    }

    if(isError) {
        try {
            throw new Error(msg);
        }
        catch (err) {
            msg = err.message + ' stack: ' + err.stack;
        }
    }

    var str = (isError ? '### AtOneGo ERROR' : '### AtOneGo INFO') +
     ' [' + getLogDate() + '] ' + msg.toString();

    str = '\n---> ENV: ' + ENV + ' <---\n' + str;

    if (ENV !== 'test') {
        console.log(str);
        // logFileWriter.write(str);
    }

    return true;
};

/**
 * Log a message to the cronjob logfile
 * XXX
 * @param string msg
 */
logger.cronlog = function (msg) {
    'use strict';

    console.log(msg);

    cronFileWriter.write(msg + '\n');
};

module.exports = logger;
