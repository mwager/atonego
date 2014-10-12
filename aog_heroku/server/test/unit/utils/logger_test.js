/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * Unit Tests for the logger
 */
'use strict';

process.env.NODE_ENV = 'test';

var
    root = __dirname + '/../../../../',
    libpath = root + 'server/',
    logger = require(libpath + 'lib/logger');

describe('===== Logger', function () {
    it('should contain some functions the app uses', function () {
        logger.hasOwnProperty('log').should.equal(true);
        logger.hasOwnProperty('cronlog').should.equal(true);
    });

    it('should log things and return the logged message', function (done) {
        // hook into console.log to verfiy it was called
        /* hmm... var old = console.log;
        console.log = function(s) {
            s.should.equal('logger test');
            console.log = old;
            done();
        };*/

        logger.log('logger test').should.equal(true);
        done();
    });
});
