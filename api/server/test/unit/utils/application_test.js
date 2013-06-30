/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * Unit Tests for the application object
 */
'use strict';

process.env.NODE_ENV = 'test';

var
    app = require(__dirname + '/../../../../server/lib/application'),
    // ENV = process.env.NODE_ENV,
    should = require('should');

describe('===== Application', function () {

    // testsuite v1
    it('should expose some globals', function () {
        should.exist(app);
        app.hasOwnProperty('PROJECT_ROOT').should.equal(true);
        app.hasOwnProperty('defaultLang').should.equal(true);
        app.hasOwnProperty('apiVersion').should.equal(true);

        app.apiVersion.should.equal('/api/v1');

        (typeof app.initI18n).should.equal('function');
        (typeof app.setLanguageFromSocketRequest).should.equal('function');
    });

    it('should expose a singleton i18n object', function () {
        var i18n = app.getI18nInstance();
        (typeof i18n).should.not.equal('undefined');
    });

});
