/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * Author: Michael Wager <mail@mwager.de>
 *
 * Todo Model
 */
'use strict';

module.exports = function (mongoose) {
    var _ = require('underscore'),
        moment = require('moment'),
        BaseModel = require(__dirname + '/base'),
        utils = require('../../lib/utils'),
        modelIdentifier = 'Todo', // mongoose.model(modelID)
        // logger = require('../../lib/logger'),
        Schema;

    var TITLE_LENGTH = 1024;

    /**
     * Schema definition
     */
    var editableByUsers = true;
    BaseModel.init(mongoose);
    Schema = BaseModel.getSchema({
        title: {
            type: String,
            index: true
        },
        completed: {
            type: Boolean,
            index: true
        },

        // eine Notiz pro Aufgabe
        notice: {
            type: String
        },

        // wann ist diese Aufgabe fällig? [optional]
        date: {
            type: Date,
            index: true
        },

        // belongs to a Todolist
        todolist: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Todolist'
        },
        order: {
            type: Number,
            index: true
        },

        // Bei jedem Todo kann man wählen, welche user benachrichtigt werden sollen
        // zB ich und noch 2 aus der liste...
        users_to_notify: {
            type: Array
        }
    }, editableByUsers, modelIdentifier);

    // fetch all todos of listID
    Schema.statics.findByListID = function __findByListID(listID, cb) {
        // OPTION A: direkt
        this.find({
            todolist: listID
        }, {/*fields*/}, {'group': 'completed'})
        .sort({'updated_at': -1}) // updated by DESC
        /*.sort({
            updated_at: 'desc' -> works only if updated at is type "Date"
        })*/
        .exec(cb);
    };

    /**
     * Fetch all todos which are possibly due now.
     */
    Schema.statics.findPayableTodos = function __findPayableTodos(populateList, cb) {
        var query = this.find({
            completed: false,
            date:     {
                // "gte" muss bissl früher als "now" sein!
                // -> falls der "minutely" cron job zb um 15:05:13 läuft,
                //    das Todo aber um 15:05:00 gesetzt ist:
                //    (exakter bzw "minutengenauer" diff-check befindet sich
                //    im cronjob delbst, siehe readme.md)

                // NOTE: man darf den rückgabewert von "moment()"
                // nicht in einer variable speichern!
                '$gte': moment().add('minutes', -2).toDate(),
                '$lt' : moment().add('minutes',  3).toDate()
            }
        });

        if(populateList) {
            query.populate('todolist');
        }

        query.exec(cb);
    };


    /**
     * Create a new todolist of a user
     */
    Schema.statics.createTodo = function createTodo(userWhichCreates, listID, data, cb) {
        var Todo     = this;
        var Todolist = mongoose.model('Todolist');
        var User     = mongoose.model('User');

        // finde zuerst die liste, zu welcher dieses
        // todo hinzugefügt werden soll
        Todolist.findById(listID).populate('todos').exec(function (err, list) {
            if(err || !list) {
                utils.handleError(err || 'list not found in todo.js@createTodo()');
                return cb({key: 'error'});
            }

            if(!data.title) {
                utils.handleError('no title provided');
                return cb({key: 'error'});
            }

            if(data.title.length && data.title.length > TITLE_LENGTH) {
                return cb({key: 'todoTitleTooLong'});
            }

            var valid = true;

            if(!data.completed) {
                data.completed = false;
            }

            var createIt = function () {
                if(!data.users_to_notify) {
                    data.users_to_notify = [];
                }

                // jedes Todo hat per default alle list-teilnehmer
                // zum Erstellungszeitpunkt bei create mit drin!
                User.fetchListParticipants(list, function(err, users) {
                    users.forEach(function(user) {
                        data.users_to_notify.push(user._id + '');
                    });

                    var _user       = BaseModel.getUser(userWhichCreates);
                    data.created_by = _user;
                    data.updated_by = _user;

                    var todo = new Todo(data);

                    // !!! SET EXPLICITLY THE list AND THE todo !!!
                    list.todos.push(todo);
                    // --------------------------------------------
                    list.save(function (err) {
                        if(err) {
                            utils.handleError(err);
                            return cb({key: 'error'});
                        }

                        // NOW SET THE LIST
                        todo.todolist = list;

                        todo.save(function (err, todo) {
                            if(err) {
                                utils.handleError(err);
                                return cb({key: 'error'});
                            }

                            return cb(null, todo);
                        });
                    });
                });
            };

            // wenn auf dieser liste bereits ein todo mit dem selben titel
            // existiert, macht das wenig sinn
            list.todos.forEach(function(todo) {
                if(data.title === todo.title) {
                    valid = false;
                }
            });

            if(valid) {
                createIt();
            }
            else {
                return cb({key:'sameTitleNoSense'});
            }
        });
    };

    // update a todo item
    // XXX hier ist der check ob titel bereits auf der liste existiert nicht drin
    // naja...passt schon erstmal
    Schema.statics.updateTodo = function updateTodo(userWhichUpdates, id, data, cb) {
        this.findById(id, function (err, todo) {
            if(err) {
                utils.handleError(err);
                return cb({key: 'error'});
            }

            if(!todo) {
                err = 'todo not found';
                utils.handleError(err);
                return cb({key: 'error'});
            }

            if(data.title && data.title.length && data.title.length > TITLE_LENGTH) {
                return cb({key: 'todoTitleTooLong'});
            }

            var _user       = BaseModel.getUser(userWhichUpdates);
            data.updated_by = _user;

            todo = _.extend(todo, data);

            todo.save(function (err) {
                if(err) {
                    utils.handleError(err);
                    return cb({key: 'error'});
                }

                cb(null, todo);
            });
        });
    };

    // drop todo and referenz auf dieses todo in der zugehörigen Todoliste
    // param todo: todo object eg {completed:false, usw..}
    Schema.statics.dropTodo = function dropTodo(todoInstance, cb) {
        var Todo = this,
            Todolist = mongoose.model('Todolist'),
            todoID, listID;

        if(!todoInstance) {
            utils.handleError('first parameter must be todoModel-Instance or id');
            return cb({key: 'error'});
        }

        // haben wir sicher eine Instanz, nicht bloß die ID?
        if(todoInstance.title) {
            todoID = todoInstance._id;
        }
        // else try find by id first
        else {
            todoID = todoInstance;
        }

        Todo.findById(todoID, function (err, todo) {
            if(err) {
                utils.handleError(err);
                return cb({key: 'error'});
            }

            if(!todo) {
                utils.handleError('hmm todo not found');
                return cb({key: 'error'});
            }

            listID = todo.todolist;

            var dropIt = function(todo) {
                todo.remove(function (err) {
                    if(err) {
                        utils.handleError(err);
                        return cb({key: 'error'});
                    }
                    return cb(null, true);
                });
            };

            // Listenreferenz auch löschen
            Todolist.findById(listID, function (err, todolist) {
                if(err) {
                    utils.handleError(err);
                    return cb({key: 'error'});
                }


                // falls schon gelöscht wurde, ignorieren...
                if(!todolist || !todolist.todos || !todolist.save) {
                    return dropIt(todo);
                }

                // REMOVE A NESTED ARRAY ENTRY BY ID
                // todolist.todos.id(todoID).remove();
                todolist.todos.remove(todoID);
                todolist.save(function (err) {
                    if(err) {
                        utils.handleError(err);
                        return cb({key: 'error'});
                    }

                    dropIt(todo);
                });
            });
        });
    };

    return mongoose.model(modelIdentifier, Schema);
};
