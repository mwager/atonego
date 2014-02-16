/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * TodoContainerView
 *
 * Renders once all relevant containers for the subviews
 *
 * @author Michael Wager <mail@mwager.de>
 */
define(function (require) {
    'use strict';

    var _       = require('underscore'),
        app     = require('app'),
        common  = require('common'),
        $       = require('zepto'),
        Todo    = require('models/todo'),
        tpl     = require('text!templates/todos/todoscontainer.html'),

        // Views
        BaseView = require('views/base'),

        // die TodoListe mit meheren Todoviews:
        TodosView = require('views/todos/todosview'),

        ClearCompletedTodosButtonView = require('views/todos/clearcompletedbtn'),
        events = {};


    events['keyup #new-todo-title'] = 'validateAndSaveOnEnter'; // checkt auch "onEnter"
    events['blur #new-todo-title'] = 'createTodo';

    // no. events['scroll .content'] = 'onScroll';

    return BaseView.extend({
        id: 'todoscontainer',

        // title: function() {} // see todoheader view.js for title change
        template: _.template(tpl),
        events: events,

        // depends on args.listID
        initialize: function (args) {
            if(!args || !args.listID) {
                throw 'no list id provided';
            }

            this.listID = args.listID;

            // the list
            this.todolist = app.todolists.get(args.listID);

            // Todos collection
            app.todosCollectionInstance.reset(this.todolist.get('todos'));
            this.todos = app.todosCollectionInstance;
        },

        // overwrite BaseView.dispose()
        // dispose all subviews here manually
        dispose: function () {
            var disposeSubView = function (v) {
                if(v && _.isFunction(v.dispose)) {
                    v.dispose();
                }
            };

            // disposeSubView(this.todolistHeaderView);
            disposeSubView(this.todosView);
            disposeSubView(this.clearBtn);

            // call parent dispose
            // this.__proto__.dispose();
            BaseView.prototype.dispose.call(this);
        },

        /**
         * wird pro liste nur EINMAL gerendert
         */
        render: function () {
            var list = app.todolists.get(this.listID);

            this.renderSelf({
                listID: this.listID,
                common: common,
                todolist: this.todolist ? this.todolist.toJSON() : {}
            });

            // render the header
            // each "root-view" must render it's header
            this.renderHeader({
                showHomeButton: true,

                // the edit button needs the todolist id
                showListEditButton: true,
                listID: this.listID,

                el: $('header', this.el)[0],
                title: list.get('title')
            });

            this.todosView = new TodosView({
                el: $('#todosview', this.el)[0],
                todosInstance: this.todos,
                listID: this.listID
            });
            // not necessary here:
            // this.todosView.render();

            this.$input = $('#new-todo-title', this.el);
            this.$save  = $('#save-todo', this.el);

            // clear completed button "view"
            this.clearBtn = new ClearCompletedTodosButtonView({
                el: $('#clear-completed-btn-view', this.el),
                listID: this.listID
            });
            this.clearBtn.render();


            // old: "pull to refresh stuff..."
            // this.todosView.on('fetch-success', function() {
            //     $('#tmp-loader').remove();
            // });
            // var $con = $('.content', this.el);
            // $con.off('scroll');
            // $con.on('scroll', _.bind(this.onScroll, this))

            return this;
        },

        validateNewTodo: function () {
            var valid = this.$input.val().length > 0 &&
                this.$input.val().length <= 1024;

            return valid;
        },

        validateAndSaveOnEnter: function(e) {
            if(this.validateNewTodo()) {
                var key = e ? (e.keyCode || e.which) : null;

                if(key === 13) {
                    this.createTodo();
                }
            }
        },

        /**
         * Create a new todo
         */
        createTodo: function (e) {
            var self = this;

            if(e) {
                e.preventDefault();
            }

            if(!this.validateNewTodo()) {
                return false;
            }

            var t = new Todo({
                // ein Todo gehört immer einer Liste an
                list_id: this.listID,
                title: this.$input.val(),
                completed: false
            });

            // ========== NOTES ZUM RENDERN ==========
            // 1. Wir wollen beim Erstellen eines Todos gleich rendern,
            // nicht erst on server success
            // 2. Problem: dann haben wir aber noch keine ID welcher wir aber
            // brauchen um die subviews zu verwalten
            // 3. also adden wir hier sofort was ein sofortiges rendern bedeutet
            // 4. es wird in der todosview.js temporär die cid des models verwendet
            //    -> on success wird diese dann ausgetauscht !
            //    -> sonst erscheinen todos doppelt
            self.todos.add(t);

            // trigger reset in todosview.js damit neu sortiert wird
            app.todosCollectionInstance.trigger('reset');

            common.showLoader();

            // this.todos.create(this._newAttributes()); // triggers add
            this.$input.val('');

            /*if(app.isAndroid) {
                this.$input.blur();
            }*/

            // CREATE
            t.save(null, {
                success: function (model) {
                    common.hideLoader();

                    // model.cid = model.get('_id'); // bullshit

                    // ===> subview Austausch!!!
                    model.trigger('create_success', model);

                    // ##### update todos local #####
                    // die collection wurd bereits aktualisiert
                    var todos = model.collection;
                    var listID = model.get('todolist');

                    if(todos && listID) {
                        todos = todos.toJSON();
                        // app.storage.storeTodosOfList(listID, todos, function(/*err, success*/) {});
                        self.__updateTodosCollection(listID, todos);
                    }
                },
                error: function (model, xhr) {
                    var json = JSON.parse(xhr.responseText);

                    var msg = __('error');
                    if(json && json.message && json.message.key) {
                        msg = __(json.message.key);
                    }

                    common.hideLoader();
                    common.notify(msg);

                    // XXX ?
                    // self.todos.remove(model.get('_id'));
                    self.todos.remove(t);
                }
            });
        },

        /**
         * On mobile we only refresh on scroll negative
        onScroll: function(e) {
            // the .content
            var $el = $(e.currentTarget)
            var $loader = $('#tmp-loader');
            var scrollTop = $el.scrollTop();
            var html = ['<p id="tmp-loader" class="centered aog-green-text">loading...</p>'];

            log(scrollTop);

            if(scrollTop < 20) {
                this.todosView.__fetchTodosFromServer();
                $loader.remove();
                $el.prepend(html.join(''));
            }
        },*/

        /**
         * Called by the SocketIO Wrapper if this
         * ViewInstance is currently active
         */
        pushUpdate: function(evnt, todo) {
            switch(evnt) {
            case 'create_todo':
                this.todos.add(new Todo(todo));
                break;

            case 'update_todo':
                // USE THE /EXISTING/ TASK !
                var todoModel = this.todos.get(todo._id);

                if(!todoModel) {
                    return false;
                }

                // this triggers the re-render of the existing todo
                todoModel.set(todo);

                // this.todos.add(todoModel)
                break;

            case 'delete_todo':
                this.todos.remove(todo._id);
                break;

            case 'delete_todos':
                var self  = this;
                var todos = todo; // "todo" is here an array of todos (-;
                todos.forEach(function(t) {
                    self.todos.remove(t._id);
                });
                break;
            }

            // ##### update local db #####
            var todosJSON = this.todos.toJSON();
            // app.storage.storeTodosOfList(this.listID, todosJSON, function(/*err, success*/) {});
            this.__updateTodosCollection(this.listID, todosJSON);
        },

        refetchTodos: function() {
            if(this.todosView) {
                this.todosView.__fetchTodosFromServer();
            }
        },

        /**
         * Update app.todolists.get(ID) with the passed todos
         */
        __updateTodosCollection: function(listID, newTodos) {
            // keep it local, we must update the app.todolists collection
            var list = app.todolists.get(listID);

            if(list) {
                list.set({
                    todos: newTodos
                }, {silent: true});
            }
        }
    });
});
