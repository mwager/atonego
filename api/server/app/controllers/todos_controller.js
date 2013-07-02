/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * Todos API controller
 *
 * Author: Michael Wager <mail@mwager.de>
 */
'use strict';

var
    _           = require('underscore'),
    application = require('../../lib/application'),
    i18n        = application.getI18nInstance(),
    utils       = require('../../lib/utils'),
    // log      = console.log,
    // logger   = require('../../lib/logger'),
    TodosController,
    // privates:
    Todo, User;


// helper for finding all participants of a list
// and send out a push notification to them
function doAPNPush(user, todo, pushMsgArgs) {
    var msg;

    // wir müssen hier manuell alle user finden, zu welchen ich pushen soll!
    User.fetchListParticipants(todo.todolist, function(err, users) {
        if(!err && users.length > 0) {
            users.forEach(function(userFound) {

                // not to me (multiple devices...)
                if(user.email !== userFound.email) {
                    i18n.setLocale(userFound.lang);

                    // now translate with passed args
                    msg = i18n.__.apply(i18n, pushMsgArgs);

                    application.sendAPN_PUSH(userFound, msg);
                }
            });
        }
    });
}

TodosController = function (app, mongoose, config) {
    this.mongoose = mongoose;
    this.config = config;

    Todo     = mongoose.model('Todo');
    User     = mongoose.model('User');

    var auth = application.checkAuth;
    var v    = application.apiVersion;

    /**
     * Fetch the Todos of a todolist
     */
    app.get(v + '/todos',  function __getTodos(req, res) {
        // var user = req.user;
        var listID = req.param('list_id');

        Todo.findByListID(listID, function (err, todos) {
            if(err) {
                return application.sendDefaultError(req, res, err, err); // TODO locale
            }

            // XXX
            //res.header('ETag', utils.etag(todos));

            return application.sendDefaultSuccess(req, res, todos, 200);
        });
    });

    /**
     * Create a todo
     */
    app.post(v + '/todos', auth, function __createTodo(req, res) {
        var user = req.user;
        // TODO check if user is allowed to create!?

        var listID = req.body.list_id;

        if(!listID) {
            var err = 'list id must be provided!';
            return application.sendDefaultError(req, res, err, err); // TODO locale
        }

        Todo.createTodo(user, listID, req.body, function (err, todo) {
            if(err) {
                return application.sendDefaultError(req, res, err, err); // TODO locale
            }

            // push an update
            // wir brauchen auch die liste:
            // var listID = todo.todolist;
            Todo.findById(todo._id).populate('todolist').exec(function(err, todo) {
                // push
                // self.socketController.broadcast(user, listID, 'create_todo', todo, req);

                var pushMsgArgs = ['create_todo', todo.title, todo.todolist.title];
                doAPNPush(user, todo, pushMsgArgs);
            });

            return application.sendDefaultSuccess(req, res, todo, 201);
        });
    });

    /**
     * Update a todo
     */
    app.put(v + '/todos/:id', auth, function __updateTodo(req, res) {
        var user = req.user;

        // TODO check if user is allowed to update!?

        // was kann ein user editieren?
        var dataIn = {
            title       : req.body.title,
            completed   : req.body.completed,
            notice      : req.body.notice,
            date        : '' // defaults to none
        };

        // === Date ===
        // Es kommt der timestamp von getTime(), wir speichern aber
        // ein Date-Objekt direkt:
        // "It's a 64-bit integer that stores the milliseconds since the Unix epoch"
        // http://stackoverflow.com/questions/3778428/best-way-to-store-datetime-in-to-mongodb
        if(req.body.date && ('' + req.body.date).length > 0) {
            try {
                var stamp = parseInt(req.body.date, 10);
                dataIn.date = new Date(stamp);
            } catch(e) {
                utils.handleError(e);
            }

            // Im Falle "Benachrichtigung": welche Benutzer sollen benachr. werden?
            var users_to_notify = req.body.users_to_notify;
            if(users_to_notify && _.isString(users_to_notify) && users_to_notify.length > 0) {
                try {
                    users_to_notify = JSON.parse(req.body.users_to_notify);
                } catch(e) {
                    utils.handleError(e);
                }
            }

            dataIn.users_to_notify = users_to_notify;
        }

        Todo.updateTodo(user, req.body._id, dataIn, function (err, todo) {
            if(err) {
                return application.sendDefaultError(req, res, err, err); // TODO locale
            }

            application.sendDefaultSuccess(req, res, {}, 204);

            // push an update
            // wir brauchen auch die liste:
            // var listID = todo.todolist;
            Todo.findById(todo._id).populate('todolist').exec(function(err, todo) {
                // self.socketController.broadcast(user, listID, 'update_todo', todo, req);

                var pushMsgArgs = ['update_todo', todo.title, todo.todolist.title];
                doAPNPush(user, todo, pushMsgArgs);
            });
        });
    });

    /**
     * PATCH a todo (title and completed are the only properties which go over the wire)
     */
    app.patch(v + '/todos/:id', auth, function __patchTodo(req, res) {
        // TODO check if user is allowed to update!?
        var user = req.user;
        var todoID = req.param('id');
        var dataIn = {};

        // was kann ein user editieren?
        if(typeof req.body.title !== 'undefined') {
            dataIn.title = req.body.title;
        }
        if(typeof req.body.completed !== 'undefined') {
            dataIn.completed = req.body.completed;
        }
        if(typeof req.body.notice !== 'undefined') {
            dataIn.notice = req.body.notice;
        }

        // === Date ===
        // Es kommt der timestamp von getTime(), wir speichern aber
        // ein Date-Objekt direkt:
        // "It's a 64-bit integer that stores the milliseconds since the Unix epoch"
        // http://stackoverflow.com/questions/3778428/best-way-to-store-datetime-in-to-mongodb
        if(req.body.date && ('' + req.body.date).length > 0) {
            try {
                var stamp = parseInt(req.body.date, 10);
                dataIn.date = new Date(stamp);
            } catch(e) {
                utils.handleError(e);
            }

            // Im Falle "Benachrichtigung": welche Benutzer sollen benachr. werden?
            var users_to_notify = req.body.users_to_notify;
            if(users_to_notify && _.isString(users_to_notify) && users_to_notify.length > 0) {
                try {
                    users_to_notify = JSON.parse(req.body.users_to_notify);
                } catch(e) {
                    utils.handleError(e);
                }
            }

            dataIn.users_to_notify = users_to_notify;
        }

        Todo.updateTodo(user, todoID, dataIn, function (err, todo) {
            if(err) {
                return application.sendDefaultError(req, res, err, err); // TODO locale
            }

            application.sendDefaultSuccess(req, res, {}, 204);

            // push an update
            // wir brauchen auch die liste:
            // var listID = todo.todolist;
            Todo.findById(todo._id).populate('todolist').exec(function(err, todo) {
                // self.socketController.broadcast(user, listID, 'update_todo', todo, req);

                var pushMsgArgs = ['update_todo', todo.title, todo.todolist.title];
                doAPNPush(user, todo, pushMsgArgs);
            });
        });
    });

    /**
     * Delete multiple todos
     */
    app.del(v + '/todos', auth, function __deleteTodos(req, res) {
        // collect the really deleted todos for the push notification
        var todos = [];
        var user = req.user;
        var todoIDs = req.body.todo_ids;
        // var ok = true;
        var i = 0,
            n = todoIDs ? todoIDs.length : 0,
            todoID;

        if(n === 0) {
            return application.sendDefaultSuccess(req, res, {}, 204);
        }

        var dropOneTodo = function() {
            todoID = todoIDs[i++];

            Todo.findById(todoID).populate('todolist').exec(function(error, todo) {
                if(error) {
                    utils.handleError(error);
                    // ok = false;
                }

                var listID;

                Todo.dropTodo(todoID, function (err/*, success*/) {
                    if(err) {
                        utils.handleError(err);
                        // ok = false;
                    }

                    if(todo && todo.todolist) {
                        todos.push(todo.title);
                        listID = todo.todolist._id; // hier id, da bereits populate !
                    }

                    if(--n === 0) {
                        application.sendDefaultSuccess(req, res, {}, 204);

                        // push only ONE update
                        // if(todos.length > 0) {
                        //     self.socketController.broadcast(user, listID, 'delete_todos', todos, req);
                        // }

                        if(todos.length > 0 && todo.todolist && todo.todolist.title) {
                            var pushMsgArgs = ['delete_todos', todos.join(', '), todo.todolist.title];
                            doAPNPush(user, todo, pushMsgArgs);
                        }
                    }
                    else {
                        setTimeout(function() {
                            dropOneTodo();
                        }, 100);
                    }
                });
            });
        };

        // geht zu schnell: "ERROR: No matching document found"
        // es wird scheinbar "gleichzeitig" versucht das todolist item zu ändern
        // https://groups.google.com/forum/?fromgroups#!topic/mongoose-orm/NW_8yvatjbI
        // todoIDs.forEach(function (todoID) {

        // deshalb: hier mit erstem beginnen und weitere in setTimeout !
        dropOneTodo();
    });

    /**
     * Delete one todo
     */
    app.del(v + '/todos/:id', auth, function __deleteTodo(req, res) {
        var user = req.user;
        var todoID = req.param('id');

        // XXX ugly fetch todo for list id....... needed to broadcast...
        Todo.findById(todoID).populate('todolist').exec(function(error, todo) {
            if(error) {
                return application.sendDefaultError(req, res, error, error); // TODO locale
            }

            var title     = todo.title;
            var listTitle = todo.todolist.title;

            Todo.dropTodo(todoID, function (err/*, success*/) {
                if(err) {
                    return application.sendDefaultError(req, res, err, err); // TODO locale
                }

                application.sendDefaultSuccess(req, res, {}, 204);

                // push an update
                // if(!error && todo) {
                //     var listID = todo.todolist;
                //     self.socketController.broadcast(user, listID, 'delete_todo', todo, req);
                // }
                var pushMsgArgs = ['delete_todo', title, listTitle];
                doAPNPush(user, todo, pushMsgArgs);
            });
        });
    });
};

module.exports = TodosController;