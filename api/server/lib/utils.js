/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * File: utils.js
 * Author: Michael Wager <mail@mwager.de>
 *
 * some app global utils (server-side)
 */
'use strict';

var
    fs = require('fs'),

    // application hier nicht möglich, da dieses auch utils einbindet (???)
    // application = require('./application'),
    // i18n = application.getI18nInstance(),

    ENV = process.env.NODE_ENV || 'development',
    // _ = require('underscore'),
    // log = console.log,
    // moment = require('moment'),
    crypto = require('crypto'),
    logger = require('./logger'),
    nodemailer = require('nodemailer'),
    templatesDir   = __dirname + '/../locales/email_templates',
    emailTemplates = require('email-templates'),
    utils;


/**
 * simple function to send an email using `nodemailer` and `email-templates`
 *
 * XXX nodemailer supports batch mails. check out if needed.
 */
function sendMail(from, to, subject, body) {
    // XXX später evtl nur einmal init !?
    var transport = nodemailer.createTransport('SMTP', {
        host: 'smtp.strato.de', // XXX solange wir noch bei strato sind (02-2014 oder so...)
        // hostname
        secureConnection: true,
        // use SSL
        port: 465,
        // port for secure SMTP
        auth: {
            // email credentials hardcoded....... XXX
            user: 'info@at-one-go.com',
            pass: 'AtOneGoA00_$' // XXX config, no version control (alles in ein gitignored js-module)
        }
    });

    emailTemplates(templatesDir, function templateLoaded(err, template) {
        if (err) {
            utils.handleError(err);
            // TODO !?!?!? was geht hier?
            return;
        }

        // ## Send a single email
        // see docs @ https://github.com/niftylettuce/node-email-templates
        // ODER ? -> UPDATE: Teelaunch plans to rewrite this module,
        // subscribe to their email newsletter for special updates.

        var locals = {
            body: body
            // TODO kein application require hier möglich
            // signature: 'TODO' //
            // Lösung: ist einfach immer auf englisch...
        };

        template('default', locals, function defaultTmplLoaded(err, html, text) {
            if (err) {
                utils.handleError(err); // TODO!?
                return;
            }

            // setup e-mail data with unicode symbols
            var mailOptions = {
                // sender address
                from: 'AtOneGo ✔ <' + from + '>',

                // list of receivers
                to: to,

                subject: subject,
                html: html,
                text: text
            };

            // logger.info(JSON.stringify(smtpTransport));
            // send mail with defined transport object
            transport.sendMail(mailOptions, function (error, response) {
                if(error) {
                    utils.handleError(error); // TODO!?
                } else {
                    logger.info('mail sent to ' + to + ' ENV: ' + ENV + ' response: ' + response.message);
                }

                // if you don't want to use this transport object anymore, uncomment following line
                transport.close(); // shut down the connection pool, no more messages
            });
        });
    });
} // end func sendMail


// setTimeout(function() {
    // sendMail('info@at-one-go.com', 'info@at-one-go.com', 'test betreff', 'Das ist der Body.....<b>kein html</b>');
// }, 10);

utils = {
    loadJson: function (filePath, callback) {
        fs.readFile(filePath, 'UTF-8', function (err, data) {
            var tempData = null,
                tempErr = null;

            if(err) {
                callback(err, null);
            } else {
                try {
                    JSON.parse(data);
                } catch(err) {
                    tempErr = err;
                }

                if(!tempErr) {
                    tempData = JSON.parse(data);
                }

                callback(tempErr, tempData);
            }
        });
    },

    walkDir: function (dir, callback) {
        var results = [];

        fs.readdir(dir, function (err, list) {
            var pending;

            if(err) {
                return callback(err);
            }
            pending = list.length;
            if(!pending) {
                return callback(null, results);
            }

            list.forEach(function (file) {
                file = dir + '/' + file;
                fs.stat(file, function (err, stat) {
                    if(stat && stat.isDirectory()) {
                        utils.walkDir(file, function (err, res) {
                            results = results.concat(res);
                            if(!--pending) {
                                callback(null, results);
                            }
                        });
                    } else {
                        results.push(file);
                        if(!--pending) {
                            callback(null, results);
                        }
                    }
                });
            });

        });
    },

    /*
     * Recursively search the directory for all JSON files, parse them
     * and trigger a callback with the contents
     */
    loadConfig: function (directory, callback) {
        utils.walkDir(directory, function (err, files) {
            var pending = files.length,
                configs = {},
                ENV = process.env.NODE_ENV || 'development';

            files.forEach(function (filePath) {
                utils.loadJson(filePath, function (err, data) {
                    var filename;

                    if(err) {
                        utils.handleError(err);
                        throw err;
                    }

                    filename = filePath.split('/').pop().replace('.json', '');
                    configs[filename] = data;

                    // not used... using req.headers.host + req.url see common controller
                    if(!--pending) {
                        configs.site_url = (configs[ENV].HTTPS) ? 'https://' : 'http://';
                        configs.site_url += configs[ENV].HOST + ':' + configs[ENV].PORT;

                        callback(configs);
                    }
                });
            });
        });
    },

    // XXX Sinn?
    ifEnv: function (env, cb) {
        if(env === ENV) {
            cb();
        }
    },

    isSSL: function (req) {
        return process.env.NODE_ENV === 'production' &&
         (req.headers['x-forwarded-proto'] === 'https' || req.headers['x-arr-ssl']);
    },

    /**
     * APP GLOBAL ERROR HANDLER
     *
     * @param string err
     */
    handleError: function (err, res, sendEmail) {
        if(err && err.message && err.stack) {
            logger.err(err.message + '\n --------------------- STACK ------------------------- \n' + err.stack);
        } else {

            // try to stringify....
            if(typeof err === 'object') {
                try {
                    err = JSON.stringify(err);
                }
                catch(e) {
                    err = '==================== "err" is an object ' +
                          'DAMNIT CONVERT YOUR SHITTY OBJECTS!!!==============================';
                }
            }

            try {
                throw new Error(err);
            } catch(e) {
                logger.err(e.message + '\n --------------------- STACK ------------------------- \n' + e.stack);
                err += e.message + ' STACK: ' + e.stack;
            }
        }

        if(sendEmail) {
            sendMail(
                'info@at-one-go.com',
                'info@at-one-go.com',
                'AtOneGo ERROR - ENVIRONMENT ' + ENV,
                '<pre>' + new Date().toString() + '<br />' + err + '</pre>');
        }
    },

    // TODO
    checkErr: function (next, errArray, callback) {
        var i, len = errArray.length;

        for(i = 0; i < len; i++) {
            if(errArray[i].cond) {
                return next(errArray[i].err || errArray[i].cond);
            }
        }

        callback();
    },

    /**
     * return last modified timestamp of filename
     * @param string filename
     */
    filemtime: function (filename) {
        try {
            var time = new Date(fs.statSync(filename).mtime).getTime();
            return time;
        } catch(e) {
            return 0;
        }
    },

    sendMail: sendMail,

    d2h: function (d) {
        return d.toString(16);
    },
    h2d: function (h) {
        return parseInt(h, 16);
    },

    /** TODO use instead of validator!? zB user model !
     * check for valid email
     *
     * @param string mail
     * @return {Boolean}
     */
    isValidMail: function (mail) {
        if(typeof mail !== 'string') {
            return false;
        }

        return(/^[a-zA-Z0-9._\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,4}$/).test(mail);
        // return (/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/).test(mail);
    },

    /**
     * generate a name from a mail
     */
    generateNameFromEmail: function (email) {
        if(!utils.isValidMail(email)) {
            return false;
        }

        var name = email.split('@')[0];
        return name;
    },

    // === SIMPLE ENCRYPTION/DECRYPTION HELPERS ===

    /**
     * Encrypt a given string using the provided KEY
     */
    encrypt: function(KEY, text) {
        var crypted;
        try {
            if(!KEY) {
                return null;
            }

            var cipher  = crypto.createCipher('aes-256-cbc', KEY);
            crypted     = cipher.update(text, 'utf8', 'hex');
            crypted     += cipher.final('hex');
        }
        catch(e) {
            utils.handleError(e);
            return null;
        }

        // old stuff
        // crypto.createHmac('sha1', KEY)
        //      .update(plainPasswd)
        //      .digest('hex');

        return crypted;
    },

    /**
     * Descrypt a given string using the provided KEY
     */
    decrypt: function(KEY, text) {
        var dec;
        if(!KEY) {
            return null;
        }

        try {
            var decipher = crypto.createDecipher('aes-256-cbc', KEY);
            dec          = decipher.update(text, 'hex', 'utf8');
            dec          += decipher.final('utf8');
        }
        catch(e) {
            utils.handleError(e);
            return null;
        }

        return dec;
    },

    /**
     * TODO XXX ?
     */
    etag: function(data) {
        var hash;

        try {
            if (typeof data === 'object') {
                data = JSON.stringify(data);
            }
            hash = crypto.createHash('md5').update(data).digest('hex');
        }
        catch(e) {
            utils.handleError(e);
            return data;
        }


        return hash;
    },

    /**
     * Generate a random string
     *
     * See http://stackoverflow.com/questions/9407892/how-to-generate-random-sha1-hash-to-use-as-id-in-node-js
     *
     * @param  {[type]} countBytes How many bytes are used for the seed
     * @return {[type]}            SHA1 created random string as hexadecimal string
     */
    randomString: function(countBytes) {
        var seed         = crypto.randomBytes(countBytes);
        var randomString = crypto.createHash('sha1').update(seed).digest('hex');

        return randomString;
    }
};

//function NotFound(msg) {
//    this.name = 'NotFound';
//    this.msg = msg;
//    Error.call(this, msg);
//    Error.captureStackTrace(this, arguments.callee);
//}
//
//// deprecated ?
//NotFound.prototype = Error.prototype;
//
//utils.NotFound = NotFound;
module.exports = utils;