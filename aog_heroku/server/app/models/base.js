/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * BaseModel
 *
 * All other Models should extend from this Model
 *
 * Author: Michael Wager <mail@mwager.de>
 */
'use strict';

var
    ENV = process.env.NODE_ENV || 'development',
    _ = require('underscore'),
    // validator = require('../../lib/validator'),
    // utils = require('../../lib/utils'),
    // logger = require('../../lib/logger'),
    Schema, mongoose;

var BaseModel = {
    /**
     * Init this basemodel with a mongoose object
     */
    init: function(mongooseInstance) {
        mongoose = mongooseInstance;
    },

    /**
     * Get a mongoose schema by a schema definition object
     *
     * By default, we handle created_at and updated_by timestamps.
     *
     * @param  {object} schemaDefinition The mongoose schema definition object
     * @param  {bool}   editableByUsers  If true, created_by and updated_by properties are also created
     * @return {mongoose.Schema}
     */
    getSchema: function(schemaDefinition, editableByUsers, modelIdentifier) {
        if(!_.isObject(schemaDefinition)) {
            throw 'Param `schemaDefinition` is not an object';
        }

        var defaultData = {
            created_at: { type: String, index: true}, // Date ? -> we only save timestamps here
            updated_at: { type: String, index: true}
        };

        if(editableByUsers) {
            // wir speichern einfach ein normales javascript object
            defaultData.created_by = { type: Object, index: true };
            defaultData.updated_by = { type: Object, index: true };
        }

        schemaDefinition = _.extend(schemaDefinition, defaultData);

        // output all schema definitions in tests (-;
        if(ENV === 'test') {
            console.log('Schema definition of model `' + modelIdentifier +
                '` - mongoose usage: var ' + modelIdentifier + ' = mongoose.model(\'' + modelIdentifier + '\');');
            console.log(schemaDefinition);
            console.log('-----------------------------------------------------------');
        }

        Schema = new mongoose.Schema(schemaDefinition);

        BaseModel.__initTimestamps();
        BaseModel.__initDefaultMethods();

        return Schema;
    },

    /**
     * Return the user in raw object format to store on any record of
     * a "editable by a user" - collection
     */
    getUser: function(user) {
        if(!_.isObject(user)) {
            throw 'BaseModel.getCreatedBy() no user object provided';
        }

        if(_.isFunction(user.toJSON)) {
            user = user.toJSON();
        }

        // remove all unneeded properties
        // delete user._id;
        delete user.tmp_token;
        delete user.device_tokens;
        delete user.active;
        delete user.active_since;
        delete user.invite_list_ids;
        delete user.lang;
        delete user.name;
        delete user.todolists;
        delete user.password;
        delete user.notify_settings;
        delete user.__v;
        delete user.created_at;
        delete user.updated_at;

        return user;
    },

    /**
     * All records should have created_at and updated_at properties
     * We only store the unix timestamps
     */
    __initTimestamps: function() {
        Schema.pre('save', function (next) {
            var stamp = new Date().getTime();

            this.updated_at = stamp;

            if(!this.created_at) {
                this.created_at = stamp;
            }

            next();
        });
    },

    __initDefaultMethods: function() {
        // @overwrite findById
        /*Schema.statics.findById = function __findById(id, cb) {
            this.findById(id, cb);
        };*/
    }
};

module.exports = BaseModel;
