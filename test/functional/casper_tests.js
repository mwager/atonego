/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/*global casper: true*/

/**
 * Some CasperJS Tests (http://casperjs.org)
 *
 * CasperJS eignet sich perfekt für Phonegab, da es auf PhantomJS
 * und somit Webkit basiert. Wir deployen die App für iOS und Android;
 *  -> beide webkit!
 *
 * XXX more ! use case / testprotocol...
 */
'use strict';

// enable for verbose logging
var DEBUG = false;


// Base-URL to test
var URL             = 'http://127.0.0.1/atonego/app/';
var email, password = 'new-password';
var remoteMessages  = [];

// Global log helper
function log() {
    casper.test.info.apply(casper.test, arguments);
}

var X = 1;

function shot(name) {
    // there is currently no such thing like __dirname in phantomjs...
    casper.capture('test/functional/screenshots/' + (X++) + '_' + name + '.png');
}

// Global casper config
(function __configureCasperJS() {
    var t = 15000;
    casper.defaultWaitTimeout = t;  // override casper default timeout
    casper.options.verbose = true;  // little bit more info
    casper.options.waitTimeout = t; // default 5000
    casper.options.timeout = t;

    // global jQuery
    // casper.options.clientScripts = ['../lib/jquery.js'];

    casper.options.pageSettings = {
        onError: function (msg, trace) {
            log(msg, trace);
        }
    };

    var timeoutCount = 0;
    casper.options.onTimeout = function (timeoutInMillis) {
        casper.test.error('=> DAMNIT TIMEOUT! after: ' + timeoutInMillis);
        shot('Z_Timeout' + (timeoutCount++));
        casper.test.fail('timeout somewhere...');
    };
    casper.options.onDie = function () {
        casper.test.error('=> DIE');
    };
    casper.options.onError = function (self, m) {
        casper.test.error('=> ERROR: ' + m);
        // capser.exit();
    };

    // catch all remote log messages (-:
    casper.on('remote.message', function (msg) {
        if(DEBUG) {
            log(msg);
        }

        remoteMessages.push('===> remote message: ' + msg);
    });
}());

var __signup, __editUserData, __logout, __login, __forceCleanState, generatePseudoRandomStr,
    __createTodolist, __createTodo, __deleteAccount, __doClick, __goBack,
    __inviteUser;
(function __helpers() {

    // following functions are evaluated/executed
    // in remote browser context
    // we must require necessary deps like zepto here manually

    __forceCleanState = function () {
        localStorage.clear();
        window.alert = function () {};
        window.confirm = function () {
            return true;
        }; // !!! phantomjs no support?
        window.prompt = function () {};

        // FORCE LOGOUT.
        __app_config__.router.logout();
    };

    /*__logoutForced = function () {
        var app = require('app');
        app.router.deauthenticateUser();
    };*/

    __signup = function (email) {
        var $ = require('zepto');

        var $displayName = $('#display_name');
        var $email = $('#email');
        var $password1 = $('#password');
        var $password2 = $('#password2');
        var $signupBtn = $('#signup');

        $displayName.val('CasperJS Test-User');
        $email.val(email);
        $password1.val('new-password');
        $password2.val('new-password');
        $password2.focus().keyup(); // focus UND keyup ! -> triggers "enable signup button"
        $signupBtn.trigger('tap');
    };

    __editUserData = function () {
        var $ = require('zepto');
        $('#display_name').val('casper-user');

        $('#password').val('new-password');
        $('#password2').val('new-password');

        $('#password').focus().keyup(); // focus UND keyup ! -> triggers "enable save button"

        $('#header-save').trigger('tap');
    };

    __logout = function () {
        var $ = require('zepto');
        $('#logout').trigger('tap');
    };

    __login = function (email, password) {
        var $ = require('zepto');
        var $email = $('#email');
        var $password = $('#password');
        var $loginBtn = $('#login-btn');

        $email.val(email);
        $password.val(password); // USE new password here (-;
        $password.focus().keyup(); // focus UND keyup ! -> triggers "enable signup button"
        $loginBtn.trigger('tap');
    };

    __createTodolist = function () {
        var $ = require('zepto');
        $('#create-list').focus().val('caspers test list').keyup().blur();
    };

    __createTodo = function () {
        var $ = require('zepto'),
            common = require('common');

        $('#new-todo-title')
            .focus()
            .val(common.random(20) + 'casper\'s todo lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum ')
            .blur();
    };

    __deleteAccount = function () {
        var $ = require('zepto');
        $('#delete-account').trigger('tap');
    };

    __doClick = function (selector) {
        var $ = require('zepto');

        log('CASPER ReMOTE DO CLICK --> ' + selector + ' leng: ' + $(selector).length);
        $(selector).each(function() { $(this).trigger('tap'); });
    };

    __goBack = function () {
        window.history.back();
    };

    __inviteUser = function() {
        var $ = require('zepto');
        $('#search-input').val('casper@at-one-go.com')
                          .focus().keyup().blur();
    };

    // XXX ugly, see common.js...
    generatePseudoRandomStr = function (n) {
        var text = '';
        var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        for(var i = 0; i < n; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        return text;
    };
})();


// test StartScreen and force clean state (logged out, db clean etc)
casper.start(URL, function () {
    casper.page.injectJs('jquery.js');

    // first check index.html for some relevant dom elements
    this.test.assertExists('#ghostbuster-overlay', '#ghostbuster-overlay exists');
    this.test.assertExists('#notification', '#notification exists');
    this.test.assertExists('#app-container', '#app-container exists');
    this.test.assertExists('#app-main', '#app-main exists');

    // now force the clean state
    this.waitForSelector('.content', function () {
        this.evaluate(__forceCleanState);
    });
});

// navigate to the signup page
casper.thenOpen(URL, function () {
    this.waitForSelector('.signup-btn', function () {
        this.test.assertExists('#startview', '#startview exists -> start screen rendered');
        shot('StartScreen');
    });
});

// test signup
casper.then(function () {
    this.evaluate(__doClick, {
        selector: '.signup-btn'
    });

    this.waitForSelector('input#email', function () {
        this.test.assertExists('#signup-view', 'signup screen rendered');

        email = generatePseudoRandomStr(8) + '@at-one-go.com';

        this.evaluate(__signup, {
            email: email
        });

        this.waitForSelector('#todolist-main-view', function () {
            shot('SigningUp');
            this.test.assertExists('#todolists', 'user `' + email + '` signed up - todolist screen rendered');
        });
    });
});

// checkout the help page
casper.then(function () {
    // notification "registration success" entfernen durch klick darauf
    this.evaluate(__doClick, {
        selector: '#notification'
    });

    this.evaluate(__doClick, {
        selector: 'a.nav-help'
    });

    this.test.assertTextExists('Version', 'help page rendered1');
    // this.test.assertTextExists('Copyright', 'help page rendered2');

    shot('HelpPage');
});

// edit some user data and test save
casper.then(function () {
    this.evaluate(__goBack);

    this.waitForSelector('#todolist-main-view', function () {
        this.evaluate(__doClick, {
            selector: 'a.nav-settings'
        });

        this.waitForSelector('#display_name', function () {

            // XXX this will just send {} here WHY!?!?!?
            this.evaluate(__editUserData);

            this.waitForSelector('#header-save.disabled', function () {
                shot('SavedUserData');

                this.evaluate(__goBack);

                this.waitForSelector('#todolist-main-view', function () {

                    // after save, check for new user name
                    this.test.assertTextExists('Hi casper-user', 'successfully saved user data');
                });
            });
        });
    });
});


// test logout
casper.then(function () {
    this.evaluate(__doClick, {
        selector: 'a.nav-settings'
    });

    this.waitForSelector('#display_name', function () {
        this.evaluate(__logout);
        this.waitForSelector('.login-btn', function () {
            shot('LoggedOut');
            this.test.assertExists('.signup-btn', 'user is now logged out');
        });
    });
});

// now test login
casper.then(function () {
    this.evaluate(__doClick, {
        selector: '.login-btn'
    });

    this.evaluate(__login, {
        email:    email,
        password: password
    });

    shot('LoggedIn');

    this.wait(1);

    this.waitForSelector('#todolist-main-view', function () {
        //shot('LoggedIn');
        this.test.assertExists('#todolist-main-view', 'user `' + email + '` is now logged in again');
    });
});

// create a list
casper.then(function () {
    shot('createNewList');
    this.evaluate(__createTodolist);
    this.waitForSelector('#new-todo-title', function () {
        shot('listCreated');
        this.test.assertExists('#clear-completed-btn-view', 'yuhu! created a new todolist');
    });
});

// create some todos
casper.then(function () {
    for(var i = 0; i < 10; i++) {
        this.evaluate(__createTodo);
    }
    shot('todosCreated');

    this.test.assertTextExists('caspers test list', 'successfully saved some todos and rendered correctly1');
    // this.test.assertTextExists('casperjsjsjs', 'successfully saved some todos and rendered correctly2');

    // this.test.assertTextExists('caspers test list (10)', ...
});

// navigate to list settings
casper.then(function() {
    this.evaluate(__doClick, {selector: '#list-settings'});

    this.waitForSelector('.delete-list', function () {
        shot('ListSettings');
        this.test.assertExists('#search-input', 'rendered list settings screen');

        this.evaluate(__inviteUser);

        // now there has to be the "invite button"
        this.test.assertExists('.add-user-to-list', 'we can invite users via email');

        this.evaluate(__goBack);
    });
});

// delete accout
casper.then(function () {
    this.test.assertExists('header .back-btn', 'back-btn exists');

    // zurück zu lists
    this.evaluate(__goBack);

    this.evaluate(__doClick, {selector: 'header .back-btn'});
    this.evaluate(__doClick, {selector: '#gotolists'});

    this.waitForSelector('a.nav-settings', function () {
        this.test.assertExists('a.nav-settings', 'a.nav-settings exists');

        // zu den settings
        this.evaluate(__doClick, {
            selector: 'a.nav-settings'
        });

        this.waitForSelector('#settings-view', function () {
            this.test.assertExists('#delete-account', '#delete-account exists - we are on the settings screen');
            this.evaluate(__deleteAccount);
            this.waitForSelector('.login-btn', function () {
                this.test.assertExists('.signup-btn', 'user account dropped');
            });
        });
    });
});


// run all tests
casper.run(function () {
    log('--- ALL TESTS DONE ---');
    log(remoteMessages.join('\n'));

    casper.test.done();
});