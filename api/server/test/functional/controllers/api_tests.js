/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * Functional Tests of the RESTful API and the website
 *
 * @author Michael Wager <mail@mwager.de>
 */
'use strict';

process.env.NODE_ENV = 'test';

var
    // root = __dirname + '/../../../',
    // libpath = root + 'server/',
    // application = require(root + 'lib/application'),

    mongoose    = require('mongoose'),
    request     = require('request'),
    oldRequest,

    should      = require('should'),
    _           = require('underscore'),
    log,
    BOOTSTRAP   = require('../../bootstrap_tests');

log = console.log;

var testUserEmail   = 'trash@at-one-go.com',
    testUser2Email  = 'trash2@at-one-go.com';

var testUser, testUser2, testList, testTodo;
var listTestTitle = 'my private list';
var todoTestTitle = 'my todo list';

// models
var User, Todolist, Todo;

var API_TOKEN;
/**
 * Can be used to get a "request" object with
 * default HTTP Basic auth api token set on
 * all following requests
 */
function getAuthRequest(request) {
    if(!_.isFunction(request.defaults)) {
        return request;
    }

    var username = 'AtOneGo'; // (-;

    return request.defaults({
        headers: {
            'Authorization':
                'Basic ' + new Buffer(username + ':' + API_TOKEN).toString('base64')
        }
    });
}

describe('===== AtOneGo RESTful API (and parts of the website)', function () {

    before(function (done) {
        BOOTSTRAP.before(function () {

            // register models
            User        = mongoose.model('User');
            Todolist    = mongoose.model('Todolist');
            Todo        = mongoose.model('Todo');

            // db is cleanup up by bootstrapper,
            // now create 2 test users and a list
            User.createUser({
                email:testUserEmail,
                password: '123456',
                display_name: 'API Test User fredason',
                active: true
            }, function (err, user) {
                testUser = user;
                // log(testUser)

                User.createUser({
                    email:testUser2Email,
                    password: '123456',
                    display_name: 'API Test User2',
                    active: true
                }, function (err, user) {
                    testUser2 = user;
                    // log(testUser)

                    // NOW THE TEST-LIST
                    Todolist.createList(testUser, testUser._id, {
                        title: 'API test list'
                    }, function (err, list) {
                        testList = list;
                        done();
                    });
                });
            });
        });
    });

    after(function (done) {
        BOOTSTRAP.after(function () {
            done();
        });
    });


    /**
     * Testing the AuthController
     */
    describe('Controller::Auth', function () {
        /**
         * Try a login to the API via POST /login
         */
        function doLogin(email, password, fn) {
            request({
                method:'POST',
                url   :BOOTSTRAP.API_URL + '/login',
                form  :{
                    email:    email,
                    password: password
                }
            },function (err, res, body) {
                fn(err, res, body);
            });
        }

        describe('#POST '.cyan + '/login', function () {
            it('should not login if password wrong', function(done) {
                doLogin(testUser.email, 'wrong password', function(err, res, body) {
                    res.statusCode.should.equal(500);
                    var json = JSON.parse(body);
                    (typeof json.message).should.equal('string');
                    done();
                });
            });
            it('should not login if email wrong', function(done) {
                doLogin('wrong@abc.com', '123456', function(err, res, body) {
                    res.statusCode.should.equal(500);
                    var json = JSON.parse(body);
                    (typeof json.message).should.equal('string');
                    done();
                });
            });
            it('should get 500 if no data provided', function(done) {
                doLogin(null, null, function(err, res, body) {
                    res.statusCode.should.equal(500);
                    var json = JSON.parse(body);
                    (typeof json.message).should.equal('string');
                    done();
                });
            });
        });

        describe('#POST '.cyan + '/logout', function () {
            it('should logout the test user ', function(done) {
                request({
                    method:'POST',
                    url   :BOOTSTRAP.API_URL + '/logout',
                    form  :{}
                },function (err, res) {
                    res.statusCode.should.equal(204); // no content
                    done();
                });
            });
        });

        describe('#POST '.cyan + '/signup', function () {
            it('should not signup if no valid email ', function(done) {
                request({
                    method:'POST',
                    url   :BOOTSTRAP.API_URL + '/signup',
                    form  :{
                        display_name: 'new test user',
                        email:        'admin@',
                        p1:           '123456',
                        p2:           '123456'
                    }
                },function (err, res) {
                    res.statusCode.should.equal(500);
                    done();
                });
            });

            it('should not signup if no data provided', function(done) {
                request({
                    method:'POST',
                    url   :BOOTSTRAP.API_URL + '/signup',
                    form  :{}
                }, function (err, res) {
                    res.statusCode.should.equal(500);
                    done();
                });
            });

            /* this validation is done client side
            it('should not signup if passwords not match', function(done) {
                request({
                    method:'POST',
                    url   :BOOTSTRAP.API_URL + '/signup',
                    form  :{
                        display_name: 'new test user',
                        email:        'admin@demo.com',
                        p1:           '123456',
                        p2:           '12345'
                    }
                }, function (err, res) {
                    res.statusCode.should.equal(500);
                    done();
                });
            });*/

            it('should signup a new user', function(done) {
                request({
                    method:'POST',
                    url   :BOOTSTRAP.API_URL + '/signup',
                    form  :{
                        display_name: 'new test user',
                        email:        'admin@at-one-go.com',
                        p1:           '123456',
                        p2:           '123456'
                    }
                }, function (err, res, body) {
                    res.statusCode.should.equal(200);
                    var user = JSON.parse(body);
                    user.email.should.equal('admin@at-one-go.com');

                    // === we get the api token on login or signup ===
                    should.exist(user.API_TOKEN);
                    (user.API_TOKEN.length > 0).should.equal(true);
                    API_TOKEN = user.API_TOKEN;

                    done();
                });
            });
        });

        describe('#POST '.cyan + '/login -> again with success', function () {
            it('should logout the test user ', function(done) {
                request({
                    method:'POST',
                    url   :BOOTSTRAP.API_URL + '/logout',
                    form  :{}
                },function (err, res) {
                    res.statusCode.should.equal(204); // no content
                    done();
                });
            });

            it('should login the test user for further API access, this means storing the API TOKEN', function(done) {
                doLogin(testUser.email, '123456', function(err, res, body) {
                    // pseudo "rememberme" token cookie must be set
                    // var result = /atonego-token/.test(res.headers['set-cookie']);
                    // result.should.equal(true);
                    res.statusCode.should.equal(200);
                    var user = JSON.parse(body);
                    user.email.should.equal('trash@at-one-go.com');

                    // === we get the api token on login or signup ===
                    should.exist(user.API_TOKEN);
                    (user.API_TOKEN.length > 0).should.equal(true);
                    API_TOKEN = user.API_TOKEN;

                    oldRequest = request;

                    // from now on: set token on every req
                    request = getAuthRequest(request);

                    done();
                });
            });
        });
    });


    /**
     * TESTING /users
     */
    describe('Controller::Users', function () {
        /******
        describe('#GET '.cyan + '/users?search=true?query=fredason', function () {

            it('should search for users and find the test user', function (done) {

                request({
                    method: 'GET',
                    url: BOOTSTRAP.API_URL + '/users?search=true&query=fredason'
                }, function (err, res, body) {
                    if (err) {
                        throw err;
                    }

                    res.statusCode.should.equal(200);

                    var users = JSON.parse(body);
                    var user = users[0];
                    should.exist(user.display_name);
                    should.exist(user.todolists);
                    should.exist(user.created_at);
                    should.exist(user.updated_at);
                    user.email.should.equal(testUserEmail);

                    done();
                });
            });
        });*****/

        describe('#PATCH '.cyan + '/users', function () {
            it('should not patch is email not valid', function (done) {
                request({
                    method: 'PATCH',
                    url: BOOTSTRAP.API_URL + '/users/' + testUser._id,
                    form: {
                        email: 'updated'
                    }
                }, function (err, res) {
                    res.statusCode.should.equal(500);

                    User.findById(testUser._id, function(err, user) {
                        user.email.should.equal(testUserEmail);
                        testUser = user;
                        done();
                    });
                });
            });

            it('should update the api test user via PATCH', function (done) {
                request({
                    method: 'PATCH',
                    url: BOOTSTRAP.API_URL + '/users/' + testUser._id,
                    form: {
                        display_name: 'Test User from API updated',
                        lang: 'de',

                        // wenn gesetzt müssen ALLE settings mit!
                        notify_settings: JSON.stringify({ // MUST send stringified !!!
                            email:   false,
                            push:    true,
                            vibrate: true,
                            sound:   false
                        })
                    }
                }, function (err, res) {
                    res.statusCode.should.equal(204);

                    User.findById(testUser._id, function(err, user) {
                        user.display_name.should.equal('Test User from API updated');
                        user.lang.should.equal('de');

                        should.exist(user.notify_settings);
                        user.notify_settings.email.should.equal(false);
                        user.notify_settings.push.should.equal(true);
                        user.notify_settings.vibrate.should.equal(true);
                        user.notify_settings.sound.should.equal(false);

                        testUser = user;
                        done();
                    });
                });
            });

            // ===== INVITATION AND STUFF AUCH BEI PUT /users =====
        });

        describe('#PUT '.cyan + '/users', function () {
            function inviteUser(done) {
                request({
                    method: 'PUT',
                    url: BOOTSTRAP.API_URL + '/users/' + testUser._id,
                    form: {
                        _id:    '' + testUser._id, // Backbone...

                        invite:   true,
                        list_id:  '' + testList._id, // CAST TO STRING!

                        // invite by email ONLY!
                        email:    testUser2.email
                    }
                }, function (err, res, body) {

                    res.statusCode.should.equal(200);
                    var json = JSON.parse(body);
                    json.email.should.equal('trash2@at-one-go.com');

                    // check die invite list ids usw
                    User.findById(testUser2._id, function (err, user2) {

                        var hans = user2;
                        should.exist(hans.invite_list_ids);
                        var inv_ids = hans.invite_list_ids;
                        inv_ids.length.should.equal(1);

                        // check the created list entry
                        inv_ids[0].user_id.should.equal('' + testUser._id);
                        inv_ids[0].list_id.should.equal('' + testList._id);
                        done();
                    });
                });
            }

            it('=== LISTS: user1 should invite user2 to a list', function (done) {
                inviteUser(done);
            });

            it('=== LISTS: user2 should reject invitation from user1', function (done) {
                request({
                    method: 'PUT',
                    url: BOOTSTRAP.API_URL + '/users/' + testUser2._id,
                    form: {
                        reject: true,
                        list_id: '' +       testList._id, // CAST TO STRING!
                        issuer_user_id: '' + testUser._id, // CAST TO STRING!
                        _id:    '' +        testUser2._id  // CAST TO STRING!
                    }
                }, function (err, res, body) {
                    res.statusCode.should.equal(200);
                    var json = JSON.parse(body);
                    json.email.should.equal('trash2@at-one-go.com');

                    // hat keinen zugriff auf die liste
                    json.todolists.length.should.equal(0);

                    done();
                });
            });

            it('=== LISTS: user1 should invite user2 AGAIN', function (done) {
                inviteUser(done);
            });

            it('=== LISTS: user2 should now accept invitation from user1 and get access to the list', function (done) {
                request({
                    method: 'PUT',
                    url: BOOTSTRAP.API_URL + '/users/' + testUser2._id,
                    form: {
                        add: true,
                        list_id: '' +       testList._id, // CAST TO STRING!
                        issuer_user_id: '' + testUser._id, // CAST TO STRING!
                        _id:    '' +        testUser2._id  // CAST TO STRING!
                    }
                }, function (err, res, body) {
                    res.statusCode.should.equal(200);
                    var json = JSON.parse(body);

                    // wir bekommen user und list
                    should.exist(json.user);
                    should.exist(json.list);
                    json.list.participants.length.should.equal(2);

                    json.user.email.should.equal('trash2@at-one-go.com');

                    // hat nun auch zugriff auf die liste
                    json.user.todolists.length.should.equal(1);

                    done();
                });
            });

            // Benutzer2 entfernt sich selbst wieder von der Liste in dem er
            // bei Listsettings auf "delete list" klickt, dies löscht jedoch nicht die liste,
            // da Benutzer2 nicht der owner ist
            it('=== LISTS: user2 should now remove the list, but list will not be removed', function (done) {
                request({
                    method: 'PUT',
                    url: BOOTSTRAP.API_URL + '/users/' + testUser2._id,
                    form: {
                        _id:    '' +        testUser2._id,  // Backbone, CAST TO STRING!

                        remove: true,
                        list_id: '' +       testList._id, // CAST TO STRING!
                        user_id_to_be_removed: '' + testUser2._id  // CAST TO STRING!
                    }
                }, function (err, res, body) {
                    res.statusCode.should.equal(200);
                    var json = JSON.parse(body);

                    // wir bekommen user und list
                    should.exist(json.userToBeRemoved);
                    should.exist(json.list);

                    json.userToBeRemoved.email.should.equal('trash2@at-one-go.com');

                    // hat wieder KEINEN Zugriff
                    json.userToBeRemoved.todolists.length.should.equal(0);

                    should.exist(json.list);
                    should.exist(json.list.title);
                    should.exist(json.list.user);
                    should.exist(json.list.todos);
                    should.exist(json.list.participants);
                    json.list.participants.length.should.equal(1);

                    // liste existiert aber noch, da user2 nicht der Owner ist!
                    Todolist.findById(testList._id, function(err, list) {
                        should.not.exist(err);
                        should.exist(list);
                        done();
                    });
                });
            });
        });
    });


    /**
     * TESTING /lists
     */
    describe('Controller::Todolists', function () {
        describe('#GET '.cyan + '/lists', function () {
            it('should get all lists of the TestUser', function (done) {
                request(BOOTSTRAP.API_URL + '/lists', function (err, res, body) {
                    res.statusCode.should.equal(200);
                    var lists = JSON.parse(body);
                    should.exist(lists);

                    should.exist(lists[0].title);

                    should.exist(lists[0].created_at);
                    should.exist(lists[0].updated_at);
                    should.exist(lists[0].created_by);
                    should.exist(lists[0].updated_by);

                    // bei jeder liste müssen alle teilnehmer vorhanden sein
                    should.exist(lists[0].participants);

                    done();
                });
            });
        });

        describe('#POST '.cyan + '/lists', function () {
            it('should CREATE a list', function (done) {
                request({
                    method:'POST',
                    url   :BOOTSTRAP.API_URL + '/lists',
                    form  :{
                        title  :listTestTitle
                    }
                }, function (err, res, body) {
                    res.statusCode.should.equal(201);

                    var list = JSON.parse(body);

                    should.exist(list);
                    should.exist(list.title);


                    should.exist(list.created_at);
                    should.exist(list.updated_at);
                    should.exist(list.created_by);
                    should.exist(list.updated_by);
                    list.created_by.email.should.equal(testUser.email);
                    list.updated_by.email.should.equal(testUser.email);

                    list.title.should.equal(listTestTitle);
                    testList = list;
                    done();
                });
            });
        });

        describe('#PUT '.cyan + '/lists/:id', function () {
            it('should UPDATE a list', function (done) {
                request({
                    method:'PUT',
                    url   :BOOTSTRAP.API_URL + '/lists/' + testList._id,
                    form  :{
                        _id: testList._id, // -> Backbone...
                        title:listTestTitle + 'e'
                    }
                }, function (err, res) {
                    res.statusCode.should.equal(204); // PUT 204 'NO CONTENT'

                    Todolist.findById(testList._id).exec(function (err, list) {
                        list.title.should.equal(listTestTitle + 'e');

                        should.exist(list.created_at);
                        should.exist(list.updated_at);
                        should.exist(list.created_by);
                        should.exist(list.updated_by);
                        list.created_by.email.should.equal(testUser.email);
                        list.updated_by.email.should.equal(testUser.email);

                        done();
                    });
                });
            });
        });

        describe('#PATCH '.cyan + '/lists/:id', function () {
            it('should PATCH a list', function (done) {
                request({
                    method:'PATCH',
                    url   :BOOTSTRAP.API_URL + '/lists/' + testList._id,
                    form  :{
                        title:listTestTitle + 'e'
                    }
                }, function (err, res) {
                    res.statusCode.should.equal(204); // PUT 204 'NO CONTENT'

                    Todolist.findById(testList._id).exec(function (err, list) {
                        list.title.should.equal(listTestTitle + 'e');

                        should.exist(list.created_at);
                        should.exist(list.updated_at);
                        should.exist(list.created_by);
                        should.exist(list.updated_by);
                        list.created_by.email.should.equal(testUser.email);
                        list.updated_by.email.should.equal(testUser.email);

                        done();
                    });
                });
            });
        });
    });


    /**
     * TESTING /todos
     */
    describe('Controller::Todos', function () {
        describe('#GET '.cyan + '/todos', function () {
            it('should get all todos of the TestList', function (done) {
                request(BOOTSTRAP.API_URL + '/todos?list_id=' + testList._id, function (err, res, body) {
                    res.statusCode.should.equal(200);
                    var todos = JSON.parse(body);
                    should.exist(todos);
                    done();
                });
            });
        });

        describe('#POST '.cyan + '/todos', function () {
            it('should CREATE a todo', function (done) {
                request({
                    method:'POST',
                    url   :BOOTSTRAP.API_URL + '/todos',
                    form  :{
                        list_id: testList._id,
                        title  :todoTestTitle
                    }
                }, function (err, res, body) {
                    res.statusCode.should.equal(201);

                    var todo = JSON.parse(body);

                    should.exist(todo);
                    should.exist(todo.title);
                    should.exist(todo.completed);
                    should.exist(todo.todolist);

                    should.exist(todo.created_at);
                    should.exist(todo.updated_at);
                    should.exist(todo.created_by);
                    should.exist(todo.updated_by);
                    todo.created_by.email.should.equal(testUser.email);
                    todo.updated_by.email.should.equal(testUser.email);

                    todo.title.should.equal(todoTestTitle);
                    testTodo = todo;
                    done();
                });
            });
        });

        describe('#PUT '.cyan + '/todos/:id', function () {
            it('should UPDATE a todo', function (done) {
                var d = new Date();

                request({
                    method:'PUT',
                    url   :BOOTSTRAP.API_URL + '/todos/' + testTodo._id,
                    form  :{
                        _id: testTodo._id, // -> Backbone...
                        title:todoTestTitle + 'e',
                        notice: 'test111',
                        date: d.getTime(), // wir senden nur den timestamp!
                        users_to_notify: JSON.stringify([testUser._id])
                    }
                }, function (err, res) {
                    res.statusCode.should.equal(204); // PUT 204 'NO CONTENT'

                    // check updated title
                    Todo.findById(testTodo._id).exec(function (err, todo) {
                        todo.title.should.equal(todoTestTitle + 'e');
                        todo.notice.should.equal('test111');

                        todo.users_to_notify.length.should.equal(1);
                        todo.users_to_notify[0].should.equal(testUser._id.toString());

                        // todo.date ist nun ein normales JavaScript Date Objekt !
                        todo.date.toString().should.equal(d.toString());
                        todo.date.getTime().should.equal(d.getTime());
                        todo.date.getFullYear().should.equal(d.getFullYear());
                        todo.date.getMonth().should.equal(d.getMonth());
                        todo.date.getDay().should.equal(d.getDay());

                        should.exist(todo.created_at);
                        should.exist(todo.updated_at);
                        should.exist(todo.created_by);
                        should.exist(todo.updated_by);
                        todo.created_by.email.should.equal(testUser.email);
                        todo.updated_by.email.should.equal(testUser.email);

                        done();
                    });
                });
            });
        });

        describe('#PATCH '.cyan + '/todos/:id', function () {
            it('should PATCH a todo', function (done) {
                request({
                    method:'PATCH',
                    url   :BOOTSTRAP.API_URL + '/todos/' + testTodo._id,
                    form  :{
                        title:todoTestTitle + 'e2',
                        completed: false
                    }
                }, function (err, res) {
                    res.statusCode.should.equal(204); // PUT 204 'NO CONTENT'

                    Todo.findById(testTodo._id).exec(function (err, todo) {
                        todo.title.should.equal(todoTestTitle + 'e2');
                        todo.completed.should.equal(false);
                        done();
                    });
                });
            });
        });

        describe('#DELETE '.cyan + '/todos/:id', function () {
            it('NOW should delete the todo', function (done) {
                request({
                    method:'DELETE',
                    url   :BOOTSTRAP.API_URL + '/todos/' + testTodo._id
                }, function (err, res) {
                    // log(body);
                    res.statusCode.should.equal(204); // DELETE 204 'NO CONTENT'
                    done();
                });
            });
        });

        describe('#DELETE '.cyan + '/todos', function () {
            it('should delete multiple todos', function (done) {
                request({
                    method:'DELETE',
                    url   :BOOTSTRAP.API_URL + '/todos',
                    form: {
                        todo_ids: []
                    }
                }, function (err, res) {
                    res.statusCode.should.equal(204); // DELETE 204 'NO CONTENT'
                    done();
                });
            });
        });

        // NOTE: Jetzt erst die Liste löschen!
        describe('== LISTS: #DELETE '.cyan + '/lists/:id', function () {
            it('NOW should delete the list', function (done) {
                request({
                    method:'DELETE',
                    url   :BOOTSTRAP.API_URL + '/lists/' + testList._id
                }, function (err, res) {
                    res.statusCode.should.equal(204); // DELETE 204 'NO CONTENT'
                    done();
                });
            });
        });
    });


    describe('Controller::Website', function () {

        describe('#GET '.cyan + '/', function () {
            // TODO test lang !?
            it('should GET the website startpage in english by default', function(done) {

                // restore the req
                request = oldRequest;

                request({
                    method:'GET',
                    url   :BOOTSTRAP.BASE_URL // has trailing slash, e.g. 127.0.0.1:4001/
                }, function (err, res, body) {
                    res.statusCode.should.equal(200);
                    /<!DOCTYPE html>/.test(body).should.equal(true);
                    /__app_config__/.test(body).should.equal(true);
                    done();
                });
            });

            // TODO test lang !?
            it('should GET the website startpage in german using query string ?lang=de', function(done) {
                request({
                    method:'GET',
                    url   :BOOTSTRAP.BASE_URL + '?lang=de'
                }, function (err, res, body) {
                    res.statusCode.should.equal(200);
                    /<!DOCTYPE html>/.test(body).should.equal(true);
                    /__app_config__/.test(body).should.equal(true);
                    done();
                });
            });
        });

        describe('#GET '.cyan + '/notfound', function () {
            it('should return 404 status if not found', function(done) {
                request({
                    method:'GET',
                    url   :BOOTSTRAP.BASE_URL + 'notfound'
                }, function (err, res) {
                    res.statusCode.should.equal(404);
                    done();
                });
            });
        });

        describe('#GET '.cyan + '/imprint', function () {
            it('should GET the website imprint', function(done) {
                request({
                    method:'GET',
                    url   :BOOTSTRAP.BASE_URL + 'imprint'
                }, function (err, res, body) {
                    res.statusCode.should.equal(200);
                    /<!DOCTYPE html>/.test(body).should.equal(true);
                    done();
                });
            });
        });

        describe('#GET '.cyan + '/terms', function () {
            it('should GET the website terms', function(done) {
                request({
                    method:'GET',
                    url   :BOOTSTRAP.BASE_URL + 'terms'
                }, function (err, res, body) {
                    res.statusCode.should.equal(200);
                    /<!DOCTYPE html>/.test(body).should.equal(true);
                    done();
                });
            });
        });

        describe('#GET '.cyan + '/password/recover', function () {
            it('should GET the website password/recover', function(done) {
                request({
                    method:'GET',
                    url   :BOOTSTRAP.BASE_URL + 'password/recover'
                }, function (err, res, body) {
                    res.statusCode.should.equal(200);
                    /<!DOCTYPE html>/.test(body).should.equal(true);
                    done();
                });
            });
        });

        describe('#POST '.cyan + '/password/send_mail', function () {
            it('should POST an email and send if this email is a valid user email', function(done) {
                request({
                    method:'POST',
                    url   :BOOTSTRAP.BASE_URL + 'password/send_mail?lang=de',
                    form: {
                        e1:testUser.email
                    }
                }, function (err, res, body) {
                    res.statusCode.should.equal(302);
                    // "Moved Temporarily. Redirecting to http://127.0.0.1:4001/"
                    /Moved Temporarily/.test(body).should.equal(true);

                    User.findById(testUser._id, function(err, user) {
                        testUser = user;

                        // nun muss der token gesetzt sein:
                        (testUser.tmp_token.length > 0).should.equal(true);

                        done();
                    });
                });
            });
        });

        describe('#GET '.cyan + '/password/:tmp_token', function () {
            it('should GET the password recovery page', function(done) {
                request({
                    method:'GET',
                    url   :BOOTSTRAP.BASE_URL + 'password/' + testUser.tmp_token
                }, function (err, res, body) {
                    // return log(body);
                    res.statusCode.should.equal(200);

                    // "Moved Temporarily. Redirecting to http://127.0.0.1:4001/"
                    /<!DOCTYPE html>/.test(body).should.equal(true);

                    // new Regex('/Hi '+ testUser.display_name +'/').test(body).should.equal(true);
                    /<h2>Hi/.test(body).should.equal(true);

                    User.findById(testUser._id, function(err, user) {
                        // der tmp_token hat sich hier noch nicht verändert:
                        (user.tmp_token.length > 0).should.equal(true);
                        done();
                    });
                });
            });
        });

        describe('#POST '.cyan + '/password/change', function () {
            it('should POST 2 passwords which are not the same and redirect me to the same page', function(done) {
                request({
                    method:'POST',
                    url   :BOOTSTRAP.BASE_URL + 'password/change',
                    form: {
                        p1: '123456',
                        p2: '1234567',
                        tmp_token: testUser.tmp_token // wird hier nochmal benötigt
                    }
                }, function (err, res, body) {
                    res.statusCode.should.equal(302);
                    /Moved Temporarily/.test(body).should.equal(true);

                    // error redirect
                    /password\/change/.test(body).should.equal(true);

                    User.findById(testUser._id, function(err, user) {
                        testUser = user;

                        // nun muss der token wieder gelöscht worden sein!
                        (user.tmp_token.length > 0).should.equal(true);
                        done();
                    });
                });
            });

            it('should POST 2 passwords which must be the same PLUS the tmp token', function(done) {
                request({
                    method:'POST',
                    url   :BOOTSTRAP.BASE_URL + 'password/change',
                    form: {
                        p1: '123456',
                        p2: '123456',
                        tmp_token: testUser.tmp_token // wird hier nochmal benötigt
                    }
                }, function (err, res, body) {
                    res.statusCode.should.equal(302);
                    /Moved Temporarily/.test(body).should.equal(true);

                    // es könnte auch ein error redirect sein !
                    // es darf nicht wieder zur selben seite redirected werden !
                    // es wird zur startseitse geleitet wenn erfolgreich
                    // Außerdem wird unten noch der token überprüft.
                    /password\/change/.test(body).should.not.equal(true);

                    User.findById(testUser._id, function(err, user) {
                        testUser = user;

                        // nun muss der token wieder gelöscht worden sein!
                        (user.tmp_token.length === 0).should.equal(true);
                        done();
                    });
                });
            });
        });

        describe('#GET '.cyan + '/app', function () {
            it('should get the webapp sources', function(done) {
                request({
                    method:'GET',
                    url   :BOOTSTRAP.BASE_URL + 'app'
                }, function (err, res) {
                    res.statusCode.should.equal(200);
                    done();
                });
            });
        });
    });

    // finally
    describe('Controller::Users', function () {
        describe('#DELETE '.cyan + '/users/:testUserID', function () {
            it('should drop the logged in users account', function(done) {
                request = getAuthRequest(request);

                request({
                    method:'DELETE',
                    url   :BOOTSTRAP.API_URL + '/users/' + testUser._id
                },function (err, res) {
                    res.statusCode.should.equal(204); // success, no content
                    done();
                });
            });
        });
    });
});
