/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * Unit Tests for utils
 */
'use strict';

process.env.NODE_ENV = 'test';
var
    root    = __dirname + '/../../../../',
    libpath = root + 'server/',
    utils   = require(libpath + 'lib/utils'),
    moment  = require('moment');

describe('===== Utils', function () {

    // just in case some developer changes function names or removes something ...
    describe('utils', function () {
        it('should contain some functions the app uses', function (done) {
            utils.hasOwnProperty('handleError').should.equal(true);
            utils.hasOwnProperty('checkErr').should.equal(true);
            // utils.hasOwnProperty('etag').should.equal(true);
            utils.hasOwnProperty('loadConfig').should.equal(true);
            utils.hasOwnProperty('walkDir').should.equal(true);
            utils.hasOwnProperty('filemtime').should.equal(true);
            utils.hasOwnProperty('sendMail').should.equal(true);

            done();
        });
    });

    describe('utils.isValidMail(mail)', function () {
        it('should know valid addresses', function (done) {
            utils.isValidMail('mail@mwager.de').should.equal(true);
            utils.isValidMail('m@mwager.de').should.equal(true);
            utils.isValidMail('m@m.de').should.equal(true);
            utils.isValidMail('hans@example.org').should.equal(true);
            done();
        });

        it('should know invalid addresses', function (done) {
            utils.isValidMail('@mwager.de').should.equal(false);
            utils.isValidMail('@').should.equal(false);
            utils.isValidMail('').should.equal(false);
            utils.isValidMail(null).should.equal(false);
            utils.isValidMail(undefined).should.equal(false);
            done();
        });
    });

    describe('utils.generateNameFromEmail(email)', function () {
        var name, email;

        it('should get the name from a valid mail address', function () {
            email = 'fred@mwager.de';
            name = utils.generateNameFromEmail(email);
            name.should.equal('fred');
        });

        it('should get the name from a valid mail address', function () {
            email = 'fredfdgfdgdf5.fsd.5465@mwager.de';
            name = utils.generateNameFromEmail(email);
            name.should.equal('fredfdgfdgdf5.fsd.5465');
        });

        it('should return false if no valid email provided', function () {
            email = 'fredfdgfdgdf5.fsd.5465';
            name = utils.generateNameFromEmail(email);
            name.should.equal(false);
        });
    });

    describe('utils.round(number, n)', function () {
        it('should round numbers', function () {
            // default 2 decimal places
            utils.round(2.123).should.equal(2.12);
            utils.round(0.15634, 0).should.equal(0.16);
            utils.round(0.211, '').should.equal(0.21);

            utils.round(2.123, 3).should.equal(2.123);
            utils.round(2.123345576, 1).should.equal(2.1);
            utils.round(2.15334, 1).should.equal(2.2);
            utils.round(232.15334, 1).should.equal(232.2);


        });
    });

    /**
     * test the crypto helpers
     *
     * siehe auch model_tests -> user model tests
     */
    describe('=== utils crypto helpers ===', function () {
        it('encrypt and decrypt stuff 1', function () {
            var str = 'hello world',
                KEY = '1234567890',
                encrypted = utils.encrypt(KEY, str),
                plain     = utils.decrypt(KEY, encrypted);

            encrypted.should.not.equal(str);
            plain.should.equal(str);
        });
        it('encrypt and decrypt stuff 2', function () {
            var str = 'hello world',
                KEY = '---',
                encrypted = utils.encrypt(KEY, str),
                plain     = utils.decrypt(KEY, encrypted);

            encrypted.should.not.equal(str);
            plain.should.equal(str);
        });

        it('should generate random strings', function () {
            var rnd1, rnd2;

            rnd1 = utils.randomString(64); // smt like: "7eeaea15f4f99ab60d8848c4369ce643e0989f8e"
            (typeof rnd1).should.equal('string');
            rnd1.length.should.equal(40);

            rnd2 = utils.randomString(128); // smt like: "7eeaea15f4f99ab60d8848c4369ce643e0989f8e"
            (typeof rnd2).should.equal('string');
            rnd2.length.should.equal(40);
            // console.log(rnd2, utils.randomString(1287));

            rnd2.should.not.equal(rnd1);
        });
    });

    describe('some momentjs tests', function () {
        it('should get the diff between two dates', function (done) {
            var expiresDate      = moment().add('days', 30).toDate();
            var expiresTimestamp = expiresDate.getTime() + '';
            var today            = moment();

            // positive if d is later than today
            // console.log('===============================> diff: ', d.diff(today));
            // negative if d is later than today
            // console.log('===============================> diff: ', today.diff(d));

            var future = moment(parseInt(expiresTimestamp, 10));
            (future.diff(today) > 0).should.equal(true);

            // gestern
            var expires = moment().add('days', -1);
            (expires.diff(today) < 0).should.equal(true);

            // ----------------
            var s1 = moment().add('minutes', 3).toDate().getTime();
            var s2 = today.toDate().getTime();

            (s1 > s2).should.equal(true);

            s1 = moment().add('minutes', -2).toDate().getTime();
            s2 = today.toDate().getTime();

            // log(s1, s2);

            (s1 < s2).should.equal(true);

            done();
        });
    });
});
