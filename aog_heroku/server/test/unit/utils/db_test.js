/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * Unit Tests for lib/db.js
 */
'use strict';

process.env.NODE_ENV = 'test';

var
    root = __dirname + '/../../../../',
    libpath = root + 'server/',
    should = require('should'),
    db = require(libpath + 'lib/db'),
    // ENV = process.env.NODE_ENV,
    mongoose = require('mongoose');

describe('===== DB UTILS', function () {

    before(function (done) {
        done();
    });

    after(function (done) {
        done();
    });

    // just in case some developer changes function names or removes something ...
    describe('check own properties', function () {
        it('should have functions the app uses', function (done) {
            db.hasOwnProperty('connectToDatabase').should.equal(true);
            db.hasOwnProperty('disconnectFromDB').should.equal(true);
            db.hasOwnProperty('cleanCollection').should.equal(true);
            db.hasOwnProperty('cleanDB').should.equal(true);

            done();
        });
    });

    // disconnect first
    describe('db.disconnectFromDB(...)', function () {
        it('should disconnect from a database', function (done) {
            db.disconnectFromDB(mongoose, function() {
                done();
            });
        });
    });

    describe('db.connectToDatabase(...)', function () {
        it('should connect to a database', function (done) {
            var config = {
                USER    :'',
                PASS    :'',
                HOST    :'127.0.0.1',
                PORT    :'27017',
                DATABASE:'todos-test'
            };

            mongoose = db.connectToDatabase(mongoose, config, function (err) {
                should.not.exist(err);
                ok();
            });

            function ok() {
                mongoose.disconnect();
                mongoose.hasOwnProperty('connections').should.equal(true);
                // console.log(mongoose.connections)
                done();
            }
        });
    });

    describe('db.disconnectFromDB(...)', function () {
        it('should disconnect from a database', function (done) {
            db.disconnectFromDB(mongoose, function() {
                done();
            });
        });
    });
});
