/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * Todolist API controller
 *
 * Author: Michael Wager <mail@mwager.de>
 */
'use strict';

var
    application = require('../../lib/application'),
    // utils = require('../../lib/utils'),
    // log = console.log,
    // logger = require('../../lib/logger'),
    Todolist,
    User,
    TodolistController;

TodolistController = function (app, mongoose, config) {
    this.mongoose = mongoose;
    this.config = config;

    User     = mongoose.model('User');
    Todolist = mongoose.model('Todolist');

    var auth = application.checkAuth;
    var v    = application.apiVersion;

    /**
     * Fetch the lists of a user
     */
    app.get(v + '/lists', auth, function __getLists(req, res) {
        var user = req.user;

        Todolist.findByUserID(user._id, function (err, lists) {
            if (err) {
                return application.sendDefaultError(req, res, err, err); // TODO locale
            }
            else {
                return application.sendDefaultSuccess(req, res, lists, 200);
            }
        });
    });

    /**
     * Create a list
     */
    app.post(v + '/lists', auth, function __createList(req, res) {
        var user = req.user;

        Todolist.createList(user, user._id, {title: req.body.title}, function (err, list) {
            if (err) {
                return application.sendDefaultError(req, res, err, err); // TODO locale
            }
            else {
                return application.sendDefaultSuccess(req, res, list, 201);
            }
        });
    });

    /**
     * Update a list
     */
    app.put(v + '/lists/:id', auth, function __updateList(req, res) {
        var user = req.user;
        // XXX check if user is allowed to update!?

        var ID = req.param('id'); // oder: req.params.id; Backbone: req.body._id

        Todolist.updateList(user, ID, req.body, function (err, list) {
            if (err) {
                return application.sendDefaultError(req, res, err, err); // TODO locale
            }

            // push an update
            // if(list) {
            //     var listID = list._id;
            //     self.socketController.broadcast(user, listID, 'update_list', list, req);
            // }

            return application.sendDefaultSuccess(req, res, list, 204);
        });
    });

    /**
     * Update a list (via PATCH)
     */
    app.patch(v + '/lists/:id', auth, function __updateList(req, res) {
        var user = req.user;
        // XXX check if user is allowed to update!?

        var ID = req.param('id'); // oder: req.params.id; Backbone: req.body._id
        var dataIn = {
            title: req.body.title
        };
        Todolist.updateList(user, ID, dataIn, function (err, list) {
            if (err) {
                return application.sendDefaultError(req, res, err, err); // TODO locale
            }

            // push an update
            // if(list) {
            //     var listID = list._id;
            //     self.socketController.broadcast(user, listID, 'update_list', list, req);
            // }

            return application.sendDefaultSuccess(req, res, list, 204);
        });
    });

    /**
     * Delete a list
     */
    app.del(v + '/lists/:id', auth, function __deleteList(req, res) {
        var user = req.user;

        var userID = user._id;
        var listID = req.param('id'); // oder: req.params.id; Backbone: req.body._id
        Todolist.findById(listID, function(/*error, todolist*/) {
            Todolist.dropTodolist(userID, listID, function (err/*,success, userIsOwner*/) {
                if (err) {
                    return application.sendDefaultError(req, res, err, err); // TODO locale
                } else {

                    // push an update
                    // WENN ICH DER OWNER BIN MUSS DIE LISTE BEI ALLEN ANDEREN
                    // GLEICH VERSCHWINDEN, SONST NICHT !
                    // if(userIsOwner) {
                    //     var listID = todolist._id;
                    //     self.socketController.broadcast(user, listID, 'delete_list', todolist, req);
                    // }

                    return application.sendDefaultSuccess(req, res, {}, 204);
                }
            });
        });
    });
};

module.exports = TodolistController;
