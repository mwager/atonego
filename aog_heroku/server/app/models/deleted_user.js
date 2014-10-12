/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * "DeletedUser" - Model
 *
 * Wenn ein user seinen account löscht, werden ein paar Infos über ihn gespeichert
 * und dann der tatsächliche User-datensatz mit allen Listen etc gelöscht.
 *
 * Author: Michael Wager <mail@mwager.de>
 */
'use strict';

module.exports = function (mongoose) {
    var
        BaseModel = require(__dirname + '/base'),
        utils = require('../../lib/utils'),
        Schema,
        modelIdentifier = 'DeletedUser';

    /**
     * Schema definition
     */
    BaseModel.init(mongoose);
    Schema = BaseModel.getSchema({
        info      :{type:String}
    }, false, modelIdentifier);

    /**
     * Wenn ein user seinen account löscht, werden alle infos über diesen
     * hier in eine zeile in ein feld "info" gespeichert und aus der user
     * collection gelöscht
     */
    Schema.statics.addDeletedUser = function addDeletedUser(info, callback) {
        var DeletedUser = this;
        var self = new DeletedUser();
        self.info = info;

        self.save(function (err, deletedUser) {
            if (err) {
                utils.handleError(err);
                return callback({key: 'error'});
            }

            callback(null, deletedUser);
        });
    };

    // collection name will be "deletedusers"
    // $ mongo
    // >> use todos-dev
    // >> db.deletedusers.find().pretty()

    return mongoose.model(modelIdentifier, Schema);
};
