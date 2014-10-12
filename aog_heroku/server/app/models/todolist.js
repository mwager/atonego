/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * Todolist Model
 *
 * @author Michael Wager <mail@mwager.de>
 */
'use strict';

module.exports = function (mongoose) {
    var
        _ = require('underscore'),
        BaseModel = require(__dirname + '/base'),
        utils = require('../../lib/utils'),
        // async = require('async'),
        // logger = require('../../lib/logger'),
        Schema,
        modelIdentifier = 'Todolist',
        LIST_TITLE_LENGTH = 32;

    /**
     * Schema definition
     */
    var editableByUsers = true;
    BaseModel.init(mongoose);
    Schema = BaseModel.getSchema({
        title     : {type: String},
        user      : {type: mongoose.Schema.Types.ObjectId, ref: 'User'}, // belongs to a User
        todos     : [
            {type: mongoose.Schema.Types.ObjectId, ref: 'Todo'} // has many Todos
        ]
    }, editableByUsers, modelIdentifier);

    /**
     * Fetch all lists of a user
     */
    Schema.statics.findByUserID = function __findByUserID(userID, cb) {
        // OPTION A: direkt
        //        this.find({user:userID}, cb);

        // ich brauch aber alle lists des users der reinkommt. dieser kann auch
        // eine ref auf die selbe liste eines anderen users haben, deshalb:
        // OPTION B: aus sicht des users mit populate
        var Todolist = this;
        var User     = mongoose.model('User');

        User.findById(userID)
            .populate('todolists')
            .exec(function (err, user) {
                if (err) {
                    utils.handleError(err);
                    return cb({key: 'error'});
                }

                if(!user) {
                    // sollte live eigtlich nicht vorkommen...
                    utils.handleError('Todolist.findByUserID(): user not found, hmm was soll das?');
                    return cb({key: 'error'});
                }

                // jetzt holen wir manuell noch die todos jeder liste,
                // da mongoose scheinbar (noch?) nicht mehrmaliges populate
                // unterstützt
                var todolists = [];
                var len = user.todolists.length;

                if(len === 0) {
                    return cb(null, todolists);
                }

                user.todolists.forEach(function (list) {
                    // außerdem alle berechtigten user der liste (auch owner)
                    User.fetchListParticipants(list, function(err, users) {

                        Todolist.findById(list._id)
                            .populate('todos')
                            .exec(function (err, listFound) {

                                var theList = listFound.toObject();

                                if (!err && theList) {
                                    theList.participants = users;
                                    todolists.push(theList);
                                }

                                if (--len === 0) {
                                    cb(null, todolists);
                                }
                            });
                    });
                });
            });
    };

    /**
     * Find one todolist with all its participants
     */
    Schema.statics.findByDocID = function __findByDocID(id, cb) {
        var Todolist = this;
        var User     = mongoose.model('User');

        Todolist.findById({_id: id}, function(err, list) {
            if(err || !list) {
                err = err || 'list not found'; // TODO locale
                utils.handleError(err);
                return cb(err);
            }

            User.fetchListParticipants(list, function(err, users) {
                if(err) { // TODO locale
                    utils.handleError(err);
                    return cb(err);
                }

                Todolist.findById(list._id)
                    .populate('todos')
                    .exec(function (err, listFound) {
                        var theList = listFound.toObject();

                        if (!err && theList) {
                            theList.participants = users;
                        }

                        cb(null, theList);
                    });
            });
        });
    };

    /**
     * Create a new todolist of a user
     */
    Schema.statics.createList = function __createList(userWhichCreates, userID, data, cb) {
        var Todolist = this;
        var User = mongoose.model('User');

        if(arguments.length !== 4) {
            return cb('arguments.length is not equal to 4');
        }

        User.findById(userID, function (err, user) {
            if (err) {
                utils.handleError(err);
                return cb({key: 'err'});
            }

            if(!data) {
                return cb({key: 'error'});
            }

            if(!data.title) {
                return cb({key: 'error'});
            }

            if(data.title.length > LIST_TITLE_LENGTH) {
                return cb({key: 'listTitleTooLong'});
            }

            var _user       = BaseModel.getUser(userWhichCreates);
            data.created_by = _user;
            data.updated_by = _user;
            var list = new Todolist(data);

            // !!! SET EXPLICITLY THE USER AND THE LIST !!!
            list.user = user;
            user.todolists.push(list);
            // --------------------------------------------

            user.save(function (err) {
                if (err) {
                    utils.handleError(err);
                    return cb({key: 'error'});
                }

                list.save(function (err) {
                    if (err) {
                        utils.handleError(err);
                        return cb({key: 'error'});
                    }

                    return cb(null, list);
                });
            });
        });
    };

    /**
     * update the list
     * egal ob owner oder nicht, editieren darf die liste jeder
     */
    Schema.statics.updateList = function __updateList(userWhichUpdates, id, data, cb) {
        this.findById(id, function (err, list) {
            if (err) {
                utils.handleError(err);
                return cb({key: 'error'});
            }

            // validation
            if(!data) {
                return cb({key: 'error'});
            }

            if(!data.title) {
                return cb({key: 'error'});
            }

            if(data.title.length > LIST_TITLE_LENGTH) {
                return cb({key: 'listTitleTooLong'});
            }

            // hier nicht relevant!
            if(data.todos && data.todos.length > 0) {
                delete data.todos;
            }

            var _user       = BaseModel.getUser(userWhichUpdates);
            data.updated_by = _user;

            list = _.extend(list, data);
            list.save(function (err) {
                if (err) {
                    utils.handleError(err);
                    return cb({key: 'error'});
                }

                cb(null, list);
            });
        });
    };

    /**
     * Delete the list
     *
     * BEIM LÖSCHEN EINER LISTE wird also immer geprüft, ob ein benutzer
     * der owner ist (also: lösche Liste) oder nur eine ref hat (also: lösche ref)
     *
     * @param userID ID des Users welcher diese Liste löschen möchte, also eine ref
     * schonmal sicher hat, jedoch nicht zwingend der "owner" dieser liste ist
     */
    Schema.statics.dropTodolist = function __dropTodolist(userID, todolistID, cb) {
        var Todolist = this;
        var Todo = mongoose.model('Todo');
        var User = mongoose.model('User');
        var isOwner = false;

        // nur die ref des users
        var dropListRef = function () {
            User.findById(userID, function (err, user) {
                if(err || !user) {
                    utils.handleError(err || 'user not found in Model Todolist.dropTodolist() -> dropListRef');
                    return cb({key: 'error'});
                }

                // ref löschen, speichern und cb()
                user.todolists.remove(todolistID);
                user.save(function(/*err, user*/) {
                    cb(null, true, isOwner);
                });
            });
        };

        // lösche die liste aus der collection
        var tryDropTheListFromDB = function () {
            Todolist.findById(todolistID, function (err, list) {
                if (err) {
                    utils.handleError(err);
                    return cb({key: 'error'});
                }

                if (!list) {
                    return cb({key: 'todolistNotFound'});
                }

                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // user check, d.h. todolist.user === user.id
                if (('' + list.user) === ('' + userID)) {
                    isOwner = true;
                }

                if(!isOwner) {
                    return dropListRef(); // hier NUR die ref, sonst BEIDES!
                }

                // NOW DROP TODOS TOO
                var nr = list.todos.length;
                var todos = list.todos;

                list.remove(function (err/*, _list*/) {
                    if (err) {
                        utils.handleError(err);
                        return cb({key: 'error'});
                    }

                    if (nr === 0) {
                        return dropListRef();
                    }

                    todos.forEach(function (todo_id) {
                        Todo.dropTodo(todo_id, function (/*err*/) {
                            // if (err) {
                                // ignore return cb(err);
                            // }

                            if (--nr === 0) {
                                // nun noch die ref vom user
                                dropListRef();
                                // cb(null, true, isOwner);
                            }
                        });
                    });
                });
            });
        };

        tryDropTheListFromDB();
    };

    /**
     * Helper for finding lists without a user ref
     */
    Schema.statics.findDirtyLists = function _fdl(cb) {
        var Todolist = this;
        //var User = mongoose.model('User');

        Todolist.find({}).sort('-created_at').exec(function(err, lists) {
            if(err || !lists) {
                return cb(err || 'DAMN NO LISTS FOUND');
            }
            // var retLists = [];
            return cb(null, lists);

            /*async.map(lists, function(l, cb) {
                User.fetchUser(l.created_by._id, function(err, user) {
                    // user der diese liste erstellt hat existiert nich mehr? PUSH!
                    if(err || !user) {
                        retLists.push(l)
                    }
                    cb();
                })
            }, function done() {
                cb(null, retLists)
            });*/

        });
    };

    return mongoose.model(modelIdentifier, Schema);
};
