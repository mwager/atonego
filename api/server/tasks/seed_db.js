/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * Used to seed the db with demo data
 *
 * Run:
 *
 * $ mocha --ui bdd --reporter spec --timeout 200000 --slow 300 api/server/tasks/seed_db.js
 */
'use strict';

process.env.NODE_ENV = 'development'; // seed dev db !

var
    root = __dirname + '/../../',
    application = require(root + 'server/lib/application'),
    libpath = root + 'server/',
    mongoose = require('mongoose'),

    moment = require('moment'),
    utils = require(root + 'server/lib/utils'),
    db = require(root + 'server/lib/db'),
    should = require('should'),
    // _ = require('underscore'),
    // cleanCollection = db.cleanCollection,
    colors = require('colors'),
    ENV = process.env.NODE_ENV || 'test';

colors = colors;

describe('===== Seeding DB with demo data', function () {
    var config, User, Todolist, Todo; // MODEL REFS!

    before(function (done) {
        utils.loadConfig(libpath + 'config', function (conf) {
            config = conf;

            mongoose.disconnect();

            application.setEncryptionSalt(config[ENV].SALT);

            mongoose = db.connectToDatabase(mongoose, config.db[ENV].main, function (err) {
                if(err) {
                    throw err;
                }

                // --- register all needed models ---
                require(root + 'server/app/models/user')(mongoose);
                require(root + 'server/app/models/todolist')(mongoose);
                require(root + 'server/app/models/todo')(mongoose);

                User     = mongoose.model('User');
                Todolist = mongoose.model('Todolist');
                Todo     = mongoose.model('Todo');

                db.cleanDB(mongoose, function() {
                    // create default users
                    User.createUser({
                        email:      'mail@mwager.de',
                        password:   '1',
                        display_name:'fred',
                        active:      true
                    },
                    function (err, user) {
                        console.log('created user ' + user.email);
                        done();
                    });
                });
            });
        });
    });

    after(function (done) {
        mongoose.disconnect();
        done();
    });

    describe('===== Users', function () {
        it('should create some demo users', function(done) {
            var i = 0,
                X = 100, // how many demo users!?
                n = X,
                users = [];

            for(i = 0; i < X; i++) {
                users.push('demo' + i + '@mwager.de');
            }

            users.forEach(function(email) {
                User.createUser({email: email, password: '1'}, function (err, user) {
                    should.not.exist(err);
                    should.exist(user);

                    if(--n === 0) {
                        done();
                    }
                });
            });
        });
    });

    describe('===== Todolists', function () {
        it('should create some demo lists for each user', function(done) {
            var i = 0,
                X = 3, // how many lists?
                n = X,
                lists = [];

            for(i = 0; i < X; i++) {
                lists.push('demo' + ' list ' + i);
            }

            User.find(function(err, users) {
                n = users.length * lists.length;

                should.not.exist(err);
                should.exist(users);

                users.forEach(function(user) {
                    lists.forEach(function(title) {
                        Todolist.createList(user, user._id, {title:title}, function(err, list) {
                            should.not.exist(err);
                            should.exist(list);

                            if(--n === 0) {
                                done();
                            }
                        });
                    });
                });
            });
        });

        describe('===== Todos', function () {
            it('should create some demo todos for each list', function(done) {
                var i = 0,
                    X = 5, // how many todos?
                    n = X,
                    todos = [];

                var todoData;

                for(i = 0; i < X; i++) {
                    todos.push('demo' + ' todo ' + i);
                }

                Todolist.find().populate('user').exec(function(err, lists) {
                    n = lists.length * todos.length;

                    console.log(('creating ' + n + ' todos').green);

                    should.not.exist(err);
                    should.exist(lists);

                    lists.forEach(function(list) {
                        todos.forEach(function(title) {
                            todoData = {
                                title:title,
                                completed: false,
                                date: moment().add('minutes', 1).toDate(),
                                notice: 'demo task...'
                            };

                            Todo.createTodo(list.user, list._id, todoData, function(err, todo) {
                                should.not.exist(err);
                                should.exist(todo);
                                todo.title.should.equal(title);

                                if(--n === 0) {
                                    done();
                                }
                            });
                        });
                    });
                });
            });
        });
    });
});
