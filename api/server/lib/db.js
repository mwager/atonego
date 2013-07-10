/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * File: db.js
 *
 * Some DB helpers using mongoose
 *
 * Author: Michael Wager <mail@mwager.de>
 */
'use strict';

var
    _       = require('underscore'),
    logger  = require('./logger'),
    utils   = require('./utils'),
    ENV     = process.env.NODE_ENV || 'development';

module.exports = {

    /**
     * Connect to a mongodb database using mongoose
     *
     * @param  object  mongoose
     * @param  object  config {USER, PASS, HOST, PORT, DATABASE}
     * @return mongoose.connect connection
     */
    connectToDatabase: function (mongoose, config, cb) {
        var dbPath, connection;

        // DB PASS/ROCKMONGO: admin/EJplfkDXbXuy
        var isLive = (process.env.OPENSHIFT_MONGODB_DB_USERNAME &&
                      process.env.OPENSHIFT_MONGODB_DB_USERNAME.length > 0);

        var HOST = process.env.OPENSHIFT_MONGODB_DB_HOST || config.HOST;
        var PORT = process.env.OPENSHIFT_MONGODB_DB_PORT || config.PORT;
        var USER = process.env.OPENSHIFT_MONGODB_DB_USERNAME || config.USER;
        var PASS = process.env.OPENSHIFT_MONGODB_DB_PASSWORD || config.PASS;

        // DIE DB HEIßT BEI openshift WIE DER APP-NAME zB "test1" ... -namespace usw
        var DATABASE = isLive ? 'atonego' : config.DATABASE;

        dbPath = 'mongodb://' + (USER) + ':';
        dbPath += (PASS) + '@';
        dbPath += (HOST) + ':';
        dbPath += (PORT) + '/';
        dbPath += DATABASE;

        logger.log('connecting to db: ' + dbPath);

        connection = mongoose.connect(dbPath, cb);

        mongoose.connection.on('error', function (err) {
            utils.handleError('########################>>>>>>>>>>>>>>>>>>>> DB ERROR: ' + err);
        });

        return connection;
    },

    /**
     * remove all documents from a collection
     *
     * @param  Mongoose.Model  Model
     * @param  function        done Success callback
     * @throws err
     */
    cleanCollection: function (Model, done) {
        if (ENV === 'production') {
            var msg = 'SOME IDIOT IS TRYING TO CLEAN A COLLECTION IN PRODUCTION ENV.';
            utils.handleError(msg);
            throw new Error(msg);
        }

        logger.log('CLEANING COLLECTION');

        var q = Model.find();
        q.remove(function (err) {
            if (err) {
                throw err;
            }
            done();
        });
    },

    /**
     * clean all collections of current db
     *
     * @param done
     */
    cleanDB: function (mongoose, done) {
        if(!done || typeof done !== 'function') {
            throw 'db.cleanDB(): done is not a function';
        }

        if (ENV === 'production') {
            var msg = 'SOME IDIOT IS TRYING TO CLEAN WHOLE DB IN PRODUCTION ENV';
            utils.handleError(msg);
            // throw new Error(msg);
            return done();
        }

        var collections = mongoose.connection.collections;
        var count = _.size(collections);

        if(count === 0) {
            return done();
        }

        _.each(collections, function (coll) {
            coll.drop(function (err) {
                if (err) {
                    utils.handleError(err);
                } // collection empty, MongoError: ns not found
                else {
                    logger.log('collection ' + coll.name + ' dropped');
                }

                if (--count === 0) {
                    done();
                }
            });
        });
    }

//    bulkInsert   :function (Model, model_data, done) {
//        console.log('bulkInsert...'.yellow);
//
//        async.forEach(model_data, function saveClient(m_data, callback) {
//            var model = new Model(m_data);
//            model.save(callback);
//        }, function (err) {
//            if (err) {
//                throw err;
//            }
//            done();
//        });
//    },
//
//    // XXX not used
//    loadFixtures :function (callback) {
//        utils.loadJson(__dirname + '/../test/fixtures/clients.json', callback);
//    },
//
//    // XXX not used
//    parseDbErrors:function (err, errorMessages) {
//        var response = {}, errors = {};
//
//        // MongoDB specific errors which are not caught by Mongoose
//        if (err.name && err.name === 'MongoError') {
//            // duplicate key error
//            if (err.code === 11000 || err.code === 11001) {
//                return {
//                    errors:{
//                        email:errorMessages.DUPLICATE
//                    }
//                };
//            } else {
//                return {
//                    code  :500,
//                    errors:{
//                        internal:'internal error - data couldnt be saved'
//                    }
//                };
//            }
//        } else if (err.name === 'ValidationError') {
//            Object.keys(err.errors).forEach(function (key) {
//                errors[key] = errorMessages[key.toUpperCase()];
//            });
//            response.errors = errors;
//
//            return response;
//        } else if (err.name === 'CastError' && err.type === 'date') {
//            errors.born = errorMessages.BORN;
//            response.errors = errors;
//
//            return response;
//        }
//
//        return err;
//    }
};
