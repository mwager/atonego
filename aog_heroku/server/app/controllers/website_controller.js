/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * Website Controller
 *
 * Serves all pages for the website
 *
 * @author Michael Wager <mail@mwager.de>
 */
'use strict';

var
    ENV            = process.env.NODE_ENV || 'development',
    // application = require('../../lib/application'),
    _              = require('underscore'),
    utils          = require('../../lib/utils'),
    passport       = require('passport'),
    // logger      = require('../../lib/logger'),
    // log         = console.log,
    User,
    Todolist,
    Todo,
    WebsiteController,
    config;

/**
 * Helper:
 *     Render a template within layoutTop and layoutBottom
 *
 * @param name The template name (see /server/website/views)
 */
function renderTemplate(name, data, req, res) {
    // TODO:
    // Die baseurl hier ist immer: atonego-mwager.rhcloud.com
    // we use ssl ! TODO cleanup here
    // weg finden zu checken ob via ssl
    var protocol = utils.isSSL(req) ? 'https://' : 'https://';

    if(ENV === 'development') {
        protocol = 'http://';
    }

    var baseUrl = protocol + req.headers.host + '/'; //  + req.url,

    // flash messages
    var error = req.flash('error'),
        info = req.flash('info');

    var defaultData = {
        lang   : req.i18n.getLocale(),

        baseUrl: baseUrl,
        ENV    : ENV,
        user   : req.session && req.session.passport ? req.session.passport.user : false,

        error: error || '',
        info : info || '',

        // Global translations
        title: name,
        imprint: req.i18n.__('imprint'),
        terms: req.i18n.__('terms')

        // cache busting:
        // css_timestamp: utils.filemtime(__dirname + '/../../../' + 'public/build/main-built.css'),
        // js_timestamp : utils.filemtime(__dirname + '/../../../' + 'public/build/main-built.js')
    };

    data = _.extend(defaultData, data);

    res.render(name + '.html', data);

    // utils.sendMail('info@at-one-go.com', 'trash@mwager.de', 'test', 'translated body text');
}

/**
 * Authentication pre check helper
 */
function checkAuth(req, res, next) {
    if(req.user) {
        return next();
    }
    else {
        return res.redirect(config[ENV].BASE_URL + 'login');
    }
}

/**
 * Website Controller - Alle Routes für den Webauftritt zur App.
 *
 * NOTE I18N: Es wird bei jedem Request automatisch auf ?lang=XX reagiert
 */
WebsiteController = function (app, mongoose, _config) {
    config        = _config;
    this.mongoose = mongoose;

    // init the needed models in this controller
    User     = mongoose.model('User');
    Todolist = mongoose.model('Todolist');
    Todo     = mongoose.model('Todo');

    function getHome(req, res) {
        var features = [];
        features.push(req.i18n.__('f1'));
        features.push(req.i18n.__('f2'));
        features.push(req.i18n.__('f3'));
        features.push(req.i18n.__('f4'));
        features.push(req.i18n.__('f5'));
        features.push(req.i18n.__('f6'));

        var faqs = [];
        faqs.push(req.i18n.__('faq1'));
        faqs.push(req.i18n.__('faq2'));
        faqs.push(req.i18n.__('faq3'));
        faqs.push(req.i18n.__('faq4'));

        renderTemplate('home', {
            showHeader      : true,

            // Texts
            introText       : req.i18n.__('intro'),
            features:         features,
            faqs:             faqs
        }, req, res);
    }

    function getImprint(req, res) {
        renderTemplate('imprint', {

        }, req, res);
    }

    function getTerms(req, res) {
        renderTemplate('terms', {

        }, req, res);
    }

    /**
     *
     * NOT USED TODO REMOVE
     * Tricky:
     * 1. ALT: Nach dem oauth login vorgang leitet uns die API hier
     * 2. es können aber dabei keine infos gesendet werden, jeder könnte diese URL aufrufen
     * 3. also muss nun hier gecheckt werden ob wir eingeloggt sind, wenn ja:
     *  passwort neu eingabe formular
     */
    /*function getSignupSuccess(req, res) {
        var user = getUser(req);

        // hier checken ob user nun vorhanden
        if (user) {
            req.session.reset = user._id;

            renderTemplate('edit_user_data', {
                user         : user,
                change_pw_url: config[ENV].BASE_URL + 'password/change'
            }, req, res);
        }
        else {
            req.flash('error', 'Es ist ein Fehler aufgetreten. Versuch\'s nochmal!');
            res.redirect(config[ENV].BASE_URL + 'signup');
        }
    }*/

    function getPasswordForgot(req, res) {
        renderTemplate('password_forgot_email_form', {
            submit_email_url: config[ENV].WEBSITE_BASE_URL + 'password/send_mail'
        }, req, res);
    }

    // user gives us mail, we check if user by this mail exists
    // and send mail with reset link
    function postSendMail(req, res) {
        var email = req.body.e1;

        var errorURL = config[ENV].WEBSITE_BASE_URL + 'password/recover';

        if (!email) {
            req.flash('error', req.i18n.__('error'));
            return res.redirect(errorURL);
        }

        if (!utils.isValidMail(email)) {
            req.flash('error', req.i18n.__('noValidMail'));
            return res.redirect(errorURL);
        }

        User.find({email: email}, function (err, users) {
            if (err) {
                req.flash('error', req.i18n.__('error'));
                return res.redirect(errorURL);
            }

            if (users.length === 0) {
                req.flash('error', req.i18n.__('userDoesNotExist'));
                return res.redirect(errorURL);
            }

            var user = users[0];

            // save the tmp token
            var tmpToken = utils.randomString(64);
            user.tmp_token = tmpToken;
            user.save(function(err) {
                if(err) {
                    utils.handleError(err);
                    req.flash('error', req.i18n.__('error'));
                    return res.redirect(errorURL);
                }

                var username = user.display_name || user.name ||
                utils.generateNameFromEmail(user.email);

                var resetLink = config[ENV].WEBSITE_BASE_URL + 'password/' +
                    tmpToken + '?lang=' + req.i18n.getLocale();

                utils.sendMail(
                    config[ENV].ADMIN_EMAIL,
                    email,
                    req.i18n.__('passwordReset'),
                    req.i18n.__('passwordResetMail', username, resetLink)
                );

                req.flash('info', req.i18n.__('passwordRecoverMailSent', email));
                return res.redirect(config[ENV].WEBSITE_BASE_URL);
            });
        });
    }


    /**
     * Bei passwort vergessen bekommnt man eine mail mit nem link hier her.
     * Hier wird dann ein temporärer token beim user gespeichert und
     * kann sein passwort, welcher in der email und bei post change pw verwendet wird
     * und ermöglicht somit das EINMALIGE ändern seines passworts
     */
    function getChangePassword(req, res) {
        var tmp_token = req.param('tmp_token');

        User.find({tmp_token: tmp_token}, function (err, users) {
            if (err || users.length === 0) {
                utils.handleError('err oder kein user, err: ' + err);
                req.flash('error', req.i18n.__('error'));
                return res.redirect(config[ENV].WEBSITE_BASE_URL);
            }

            var user = users[0];

            renderTemplate('edit_user_data', {
                user         : user,
                change_pw_url: config[ENV].WEBSITE_BASE_URL + 'password/change',
                tmp_token    : tmp_token
            }, req, res);
        });
    }

    /**
     * POST to change a user's password
     */
    function postChangePassword(req, res) {
        var tmp_token = req.body.tmp_token;
        var errorUrl = config[ENV].WEBSITE_BASE_URL + 'password/change';

        User.find({tmp_token: tmp_token}, function (err, users) {
            if (err || users.length === 0) {
                req.flash('error', req.i18n.__('error'));
                return res.redirect(errorUrl);
            }

            var user = users[0];

            var p1 = req.body.p1,
                p2 = req.body.p2;
                // email = req.body.m;

            if (p1 !== p2) {
                req.flash('error', req.i18n.__('passwordsNotSame'));
                return res.redirect(errorUrl);
            }

            if (p1.length < 6) {
                req.flash('error', req.i18n.__('passwordsLenErr'));
                return res.redirect(errorUrl);
            }

            // not used yet
            // if(!email) {
            //     req.flash('error', 'email required'); // XXX locale
            //     return res.redirect(errorUrl);
            // }

            var data = {
                password: p1,
                tmp_token: '' // delete tmp token
            };

            User.updateUser(user._id, data, function (err, user) {
                if (err) {
                    utils.handleError(err);
                    req.flash('error', req.i18n.__('error'));
                    res.redirect(errorUrl);
                }
                else {
                    var msg = req.i18n.__('passwordChanged', user.email);
                    req.flash('info', msg);
                    res.redirect(config[ENV].BASE_URL); // success: redirect to startpage
                }
            });
        });
    }

    /**
     * A website visitor POSTs the feedback formular
     *
    function postFeedback(req, res) {
        var email   = _.escape(req.body.p1),
            subject = _.escape(req.body.p2),
            body    = _.escape(req.body.p3);

        var URL = config[ENV].WEBSITE_BASE_URL;

        if(!email || !utils.isValidMail(email)) {
            req.flash('error', req.i18n.__('error'));
            return res.redirect(URL);
        }

        // some more validation
        if(!subject || subject.length > 120) {
            req.flash('error', req.i18n.__('error'));
            return res.redirect(URL);
        }
        if(!body || body.length > 8192) {
            req.flash('error', req.i18n.__('error'));
            return res.redirect(URL);
        }

        // just send the feedback stuff to us via email (-;
        utils.sendMail(
            config[ENV].ADMIN_EMAIL,
            config[ENV].ADMIN_EMAIL,
            subject,
            'FEEDBACK FROM: ' + email + '<br/><br/><br/>' + body
        );

        req.flash('info', req.i18n.__('feedbackSuccess', email));
        return res.redirect(URL);
    }*/

    /**
     * "Admin panel" entry point
     */
    function getAdminPanel(req, res) {
        User.find({}).sort('-created_at').exec(function(err, users) {
            // also fetch "dirty" lists
            Todolist.findDirtyLists(function(err, lists) {

                // also fetch todos...
                Todo.find({}).sort('-created_at').exec(function(err, todos) {
                    renderTemplate('admin', {
                        users: users,
                        lists:lists,
                        todos: todos
                    }, req, res);
                });
            });
        });
    }
    function getDisplayUserData(req, res) {
        var id = req.param('_id');

        User.fetchUser(id, function(err, user) {
            if(!err && user) {
                renderTemplate('user', {
                    user: user
                }, req, res);
            }
        });
    }
    // function postDeleteUser(req, res) {
    //     var id = req.param('_id');
    // }


    function getLogin(req, res) {
        renderTemplate('login', {
            uer: req.user,
            login_post_url: config[ENV].WEBSITE_BASE_URL + 'login',
        }, req, res);
    }
    function postLogin(req, res) {

        function errReturn(err) {
            req.flash('error', 'Error: ' + err);
            res.redirect(config[ENV].BASE_URL + 'login');
        }

        passport.authenticate('local',

        // hier rein kommt der user wenn das passwort stimmt oder false wenn
        // nicht. Siehe LocalStrategy oben.
        function (err, user /*, info*/ ) {
            if(err) {
                return errReturn(err);
            }

            // LOGIN FAILED - SEE FAIL-CALLBACK IN STRATEGY
            if(user === false) {
                return errReturn('Login failed');
            }

            // req.login senseless yet, maybe for later use.
            // we need an api_token in headers on every req to identify the user
            req.logIn(user, function (err) {
                if(err) {
                    return errReturn(err);
                }

                req.flash('success', 'success!');
                res.redirect(config[ENV].BASE_URL + 'admin');
            });

        })(req, res);
    }


    /**
     * Website route pre hook
     *
     * Rewrite www.at-one-go.com to at-one-go.com
     *
     * @param  {[type]}   req  [description]
     * @param  {[type]}   res  [description]
     * @param  {Function} next [description]
     * @return {[type]}        [description]
     */
    function preHook(req, res, next) {
        next(); // XXX

        // try {
        //     logger.log('PRE HOOK: request header => ' + JSON.stringify(req.headers));
        // } catch(e) {}

        // detect at-one-go.com - problem:
        // req.headers.host == atonego-mwager.rhcloud.com

        // (want to) rewrite the "www." to "" like in a .htaccess via apache
        // if (req.headers.host === 'www.at-one-go.com') {
        //     res.writeHead(301, {'Location': 'http://at-one-go.com' + req.url});
        //     res.end();
        // }
        // else {
        //     next();
        // }
    }

    // --- register all routes for this controller

    // static stuff
    app.get('/',        preHook, getHome);
    app.get('/imprint', preHook, getImprint);
    app.get('/terms',   preHook, getTerms);

    // ===== PASSWORD CHANGE STUFF (also see api tests!) =====
    // 1. render email textfield
    app.get('/password/recover', preHook, getPasswordForgot);

    // 2. POST user submits his mail, we send password recover link
    app.post('/password/send_mail', postSendMail);

    // 3. link of mail takes the user here
    app.get('/password/:tmp_token', preHook, getChangePassword);

    // 4. POST change password goes here
    app.post('/password/change', postChangePassword);

    // admin panel:
    app.get('/login', getLogin);
    app.post('/login', postLogin);
    app.get('/admin', checkAuth, getAdminPanel);
    app.get('/admin/users/:_id', checkAuth, getDisplayUserData);

    // users can POST some feedback
    // app.post('/feedback', postFeedback);
};

module.exports = WebsiteController;
