/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * TodosView - represents the list of todos
 *
 * Manages multiple todoview "subviews", which are listening
 * to the model's events, while this view (parent view) is listening
 * for the whole todos-collection.
 *
 * NOTE:
 * We use document.createDocumentFragment() to speed up rendering
 *
 * @author  Michael Wager <mail@mwager.de>
 */
define(function (require) {
    'use strict';

    var app     = require('app'),
        common  = require('common'),
        $       = require('zepto'),
        _       = require('underscore'),
        // Backbone = require('backbone'),
        BaseView = require('views/base'),
        TodoView = require('views/todos/todoview'),
        tpl = require('text!templates/todos/todosview.html'),
        events = {};

    return BaseView.extend({
        // Instead of generating a new element, bind to the existing skeleton
        // of the App already present in the HTML.
        // el: '#todosview',
        events: events,

        template: _.template(tpl),

        todoSubViews: {},

        initialize: function (args) {
            if(!args || !args.listID) {
                throw {
                    message: 'no list id provided'
                };
            }

            if(!args || !args.todosInstance) {
                throw {
                    message: 'no todos-collection instance provided'
                };
            }

            this.listID     = args.listID;
            this.isFetching = false;

            // we've already got the list populated with it's todos
            this.list = app.todolists.get(this.listID);

            if(!this.list) {
                throw {
                    message: 'no todolist found for ID = ' + this.listID
                };
            }

            // new todos collection instance
            this.todos = args.todosInstance;

            // the following DOM elements are already rendered in the todoscontainerView
            this.$input = $('#new-todo');
            this.$title = $('#title');

            // cache via zepto too
            this.$uncompletedList = $('#uncompleted-list', this.el);
            this.$completedList   = $('#completed-list', this.el);

            // see views/todos/todoscontainer.js
            this.uncompletedListEl = this.$uncompletedList[0];
            this.completedListEl   = this.$completedList[0];

            // set the title in the header...
            if(app && app.todolists) {
                var listTitle = app.todolists.get(this.listID).get('title');
                this.$title.html(common.escape(listTitle));
            }

            // so, listen to the collections relevant events and fetch the todos
            this.listenToCollection();
            this.fetchTodos();
        },

        // Dispose this view and all its sub views
        dispose: function () {
            _.each(this.todoSubViews, function (v) {
                if(v && _.isFunction(v.dispose)) {
                    v.dispose();
                }
            });

            BaseView.prototype.dispose.call(this);
        },

         // Add event bindings to the "todos collection"
        listenToCollection: function() {
            var self = this;

            // LISTEN FOR CUSTOM EVENT !!!
            this.listenTo(this.todos, 'fetched', function () {
                // log('todosview.js: request TODOS !!! length: ', self.todos.toJSON().length);

                // self.todos.sort();

                // add all subViews and render
                var view, v, ID;
                _.each(self.todos.models, function (todo) {
                    ID = todo.get('_id') || todo.cid;

                    v = self.todoSubViews[ID];
                    if(v && _.isFunction(v.dispose)) {
                        v.dispose();
                    }

                    view = new TodoView({
                        model: todo,
                        parentView: self
                    });
                    self.todoSubViews[ID] = view;
                });

                self.addAll();
            }, this);

            this.listenTo(this.todos, 'add', function (model) {
                this.addOne(model);
            }, this);

            // Performance BOOM!
            this.listenTo(this.todos, 'change:completed', function (model) {
                // log("CHANGE!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!", model.get('title'));
                this.addOne(model);
            }, this);

            this.listenTo(this.todos, 'remove', function (todo) {
                var ID = todo.get('_id') || todo.cid;
                delete this.todoSubViews[ID];
            }, this);

            // Listen for server-POST-success:
            // see todoscontainer.js @ createTodo()
            this.listenTo(this.todos, 'create_success', function (model) {
                // just switch:
                //  subviews[c39] = view
                // will be:
                //  subviews[model._id] = view

                this.todoSubViews[model.get('_id')] = this.todoSubViews[model.cid];
                delete this.todoSubViews[model.cid];

                this.addOne(model);

            });
        },

        // fetch all todos of the current todolist
        // (then silently from server in the background)
        fetchTodos: function () {
            var self = this;

            // keep it local (-;
            var todos = this.list.get('todos');

            if(todos && todos.length > 0) {
                log('local todos: ' + todos.length);

                // SILENT! we do not want to trigger "reset" or "add" events here.
                self.todos.reset(undefined, {silent: true});
                self.todos.add(todos, {silent: true});

                // Now trigger the custom event.
                // we add all stuff to the DOM at once using
                // document.createDocumentFragment()
                self.todos.trigger('fetched');
            }

            // wait some time for the rendering
            // we come to this view either from '#todolists' or from
            // the list settings (#todolists/edit/51bf51630f1b573dad00000a)
            // If we do come from the list settings, we do not need to fetch
            // from server again:
            var lastRoute = app.router.getLastRoute();
            if( ! (/todolists\/edit/).test(lastRoute)) {
                setTimeout(function() {
                    self.__fetchTodosFromServer();
                }, 200);
            }

            // old aproach, slow, memory...
            // ----------------------------
            // try to fetch from db (should be faster than fetching from server)
            // NOTE that we render two times. first (probably) after fetching from local db
            // then again after fetching the real todos from the server
            /*app.storage.fetchTodosOfList(this.listID, function(err, todos) {
                if(todos) {
                    // SILENT! we do not want to trigger "reset" or "add" events here.
                    self.todos
                        .reset(undefined, {silent: true})
                        .add(todos, {silent: true});

                    // Now trigger the custom event.
                    // we add all stuff to the DOM at once using
                    // document.createDocumentFragment()
                    self.todos.trigger('fetched');

                    // give the local db and rendering some time
                    setTimeout(function() {
                        self.__fetchTodosFromServer();
                    }, 200);
                }
            });*/
        },

        // just fetch the most recent todos from the API
        __fetchTodosFromServer: function() {
            var self = this;

            // nur wenn wir ne verbindung haben !
            if(!app.checkInternetConnection()) {
                // common.notify(__('noInternetConnection'));
                // app.router.go('todolists');
                return false;
            }

            if(this.isFetching) {
                return false;
            }

            this.isFetching = true;

            common.showLoader();

            this.todos.fetch({
                data: {
                    list_id: this.listID
                },

                success: function (model, json) {
                    self.isFetching = false;

                    self.trigger('fetch-success');

                    common.hideLoader();

                    // trigger custom event
                    self.todos.trigger('fetched');

                    if(json && json.length > 0) {
                        // ##### store local db #####
                        // app.storage.storeTodosOfList(self.listID, json, function(/*err, success*/) {});
                        // better aproach:
                        // keep it local, we must update the app.todolists collection
                        var list = app.todolists.get(self.listID);
                        if(list) {
                            list.set({
                                todos: json
                            }, {silent: true});
                        }
                    }
                },

                error: function () {
                    self.isFetching = false;
                    common.hideLoader();
                    common.notify(__('error'));
                }
            });
        },

        render: function () {
            // no template here...
            // this.renderSelf();

            return this;
        },

        // get the todo sub view from the todo model or create a
        // new subview if not exists
        getTodoSubview: function(todo) {
            var ID = todo.get('_id') || todo.cid;

            var view = this.todoSubViews[ID];

            // create new todo
            if(!view) {
                view = this.todoSubViews[ID] = new TodoView({
                    model:      todo,
                    parentView: this
                });
            }
            else {
                // update the view's model manually ! (XXX better approach?)
                view.model = todo;
            }

            if(!view) {
                return false;
            }

            return view;
        },

        // only one view will be rendered here (either new one or existing)
        addOne: function (todo, issetAppend) {
            /*if(todo.get('completed')) {
                // natural order from server
                if(fromAllLoop) {
                    view.$el.appendTo(this.$completedList);
                }
                else {
                    view.$el.prependTo(this.$completedList);
                }
            }
            else {
                // natural order from server
                if(fromAllLoop) {
                    view.$el.appendTo(this.$uncompletedList);
                }
                else {
                    view.$el.prependTo(this.$uncompletedList);
                }
            }*/

            // log("ADD ONE !!!!!!!!!!!!", todo.get('title'), todo.get('completed'));
            var view = this.getTodoSubview(todo);

            // log("????????? GOT VIEW: " + view.toString() + ' completed? ' + todo.get('completed'));

            if(view) {
                if(!issetAppend) {
                    view.$el.prependTo(
                        todo.get('completed') ? this.$completedList : this.$uncompletedList
                    );
                }

                view.render();

                // show it (it was faded out on the other list,
                // see todoview.js @ toggleCompleted())
                view.$el.css('opacity', 1);
            }
        },

        // Add all items in the **Todos** collection AT ONCE.
        // using document.createDocumentFragment()
        addAll: function () {

            // must be emptied first
            this.$uncompletedList.empty();
            this.$completedList.empty();

            var self = this;
            var fragUnCompleted = document.createDocumentFragment();
            var fragCompleted   = document.createDocumentFragment();
            var subView;

            this.todos.each(function(todo) {
                // just get the subview and render it,
                // the append to the fragment
                subView = self.getTodoSubview(todo);
                subView.render();

                if(todo.get('completed')) {
                    fragCompleted.appendChild(subView.el);
                }
                else {
                    fragUnCompleted.appendChild(subView.el);
                }
            }, this);

            this.uncompletedListEl.appendChild(fragUnCompleted);
            this.completedListEl.appendChild(fragCompleted);

            /*setTimeout(_.bind(function() {
                this.uncompletedListEl.appendChild(fragUnCompleted);
                this.completedListEl.appendChild(fragCompleted);
            }, this), 10);*/
        }
    });
});
