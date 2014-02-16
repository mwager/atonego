/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * TodoView
 *
 * One Todo-list item
 */
define(function (require) {
    'use strict';

    var app             = require('app'),
        common          = require('common'),
        $               = require('zepto'),
        _               = require('underscore'),
        TodoEditLayer   = require('views/todos/editlayer'),
        // Backbone     = require('backbone'),
        todosTemplate   = require('text!templates/todos/todoview.html'),
        BaseView        = require('views/base'),
        events = {};

    events[app.defaultClickEvent + ' .ago-toggle-wrap'] = 'toggleCompleted';
    events[app.defaultClickEvent + ' .title-wrap']      = 'openEditLayer';

    if(app.isMobile) {
        events['longTap .title-wrap'] = 'edit';
    }
    // no edit-todo possible on webapp yet (XXX)
    // else {
    //     events['dblclick||longClick? .title-wrap'] = 'edit';
    // }

    events['blur .edit'] = 'close';
    events['keyup .edit'] = 'updateOnEnter';

    var TodoView = BaseView.extend({
        tagName: 'li',
        attributes: {
            // list items are not clickable (should not have an active state)
            // hmm oder doch? -> wegen klick auf todo um dialog zu öffnen
            // 'class': 'no-link'
        },

        template: _.template(todosTemplate),
        events: events,

        // The TodoView listens for changes to its model, re-rendering. Since there's
        // a one-to-one correspondence between a **Todo** and a **TodoView** in this
        // app, we set a direct reference on the model for convenience.
        initialize: function (args) {
            if(!args.parentView) {
                throw 'todoview.js: no parentView provided';
            }

            this.editMode = false;

            this.parentView = args.parentView;

            this.listenToModel();
        },

        listenToModel: function() {
            // NOTE: beim ersten rendern haben wir noch keine ID!
            this.listenTo(this.model, 'change',  this.render);
            this.listenTo(this.model, 'destroy', this.remove);
            this.listenTo(this.model, 'remove',  this.remove);
        },

        rebindAllEvents: function() {
            this.listenToModel();
            this.delegateEvents();
        },

        dispose: function () {
            BaseView.prototype.dispose.call(this);
        },

        render: function () {
            var todo = this.model.toJSON();

            // todo.cid = this.model.cid;
            this.renderSelf({
                common: common,
                todo: todo
            });

            this.$completedCheckbox = $('.ago-toggle', this.el);
            this.$title             = $('.title', this.el);
            this.$input             = $('.edit', this.el);
            this.$inputWrap         = $('.edit-wrap', this.el);

            this.$el.toggleClass('completed', this.model.get('completed'));

            return this;
        },

        /**
         * Klick/Tap auf Titel des Todos schaltet um in "edit-mode"
         * es wird der titel versteckt und das textfeld angezeigt
         */
        edit: function (e) {
            var self = this;

            if(e) {
                e.preventDefault();
                e.stopPropagation();
            }

            this.editMode = true; // siehe toggleCompleted !

            this.$input.val(this.$title.html());
            this.$inputWrap.removeClass('hidden');
            this.$completedCheckbox.addClass('hidden');
            this.$el.addClass('editing');

            // ? evtl weglassen? -> gut auf iphone. passt.
            setTimeout(function () {
                self.$input.focus();
            }, 0);

            return false;
        },

        // stop edit mode (save oder destroy)
        close: function (e) {
            if(e) {
                e.preventDefault();
            }

            // We cannot PATCH to the API without ID
            if(this.model.isNew()) {
                return false;
            }

            var value = this.$input.val().trim();
            var currentTitle = this.model.get('title');

            if(value && value !== currentTitle) {
                this.$title.html(value);
                this.saveTodo();
            } else if(!value) {
                // wir machen gar bichts, wenn der user gar nichts eingeg. hat
                // this.destroy(null, true);
            }

            this.$inputWrap.addClass('hidden');
            this.$el.removeClass('editing');
            this.$completedCheckbox.removeClass('hidden');
        },


        // wenn ich hier ein todo editiere und nicht im textfeld lasse, dann ENTER
        // wird das todo onEnter gelöscht aber der blur zieht AUCH!
        // deshalb wird hier einfach ein blur event gefeuert
        // DAMNIT auch: Uncaught Error: NotFoundError: DOM Exception 8
        updateOnEnter: function (e) {
            var key = e.keyCode || e.which;

            if(key === 13) {
                this.close();
                return false;
            }
        },

        openEditLayer: function(e) {
            // We need the ID first
            if(this.model.isNew()) {
                return false;
            }

            if(e) {
                e.preventDefault();
                e.stopPropagation();
            }

            var layer = new TodoEditLayer({
                todo: this.model
            });

            layer.on('save-success', _.bind(function(todoJSON) {
                this.model.set(todoJSON, {silent: true});
                this.render();
            }, this));

            layer.open();

            return false;
        },

        // Toggle the `'completed'` state of the model.
        toggleCompleted: function () {
            var self = this;

            if(this.editMode) {
                this.editMode = false;
                return false;
            }

            // We cannot PATCH to the API without ID
            // Es kann sein dass dieses todo gerade angelegt und noch nicht
            // zum server gespeichert wurde.
            if(this.model.isNew()) {
                return false;
            }

            // fast as possible:
            this.$completedCheckbox.toggleClass('checked', this.model.get('checked'));

            // first fadeOut, then save in background
            this.$el.animate({
                opacity: 0,
                translate3d: '0,0%,0'
            }, {
                duration: 200,
                easing: 'ease',
                complete: function() {
                    // triggers addOne() in todosview.js
                    self.saveTodo(null, true);
                }
            });

            return false;
        },

        saveTodo: function (e, toggle) {
            if(e) {
                e.preventDefault();
            }

            var title = $.trim(this.$title.html());

            if(title.length <= 0 || title.length > 1024) {
                return false;
            }

            var modelData = {
                title: title,
                completed: toggle ? !this.model.get('completed') : this.model.get('completed')
            };

            // THIS TRIGGERS change:completed IN todosview.js
            // KEEP IT LOCAL !!!
            this.model.set(modelData);

            // we must also update app.todolists !
            // the model's collection was already updated via set()
            var todos  = this.model.collection;
            var listID = this.model.get('todolist');
            var list   = app.todolists.get(listID);

            if(list && todos) {
                todos = todos.toJSON();

                list.set({
                    todos: todos
                }, {silent: true});
            }

            // test in console:
            // var app = require('app'); app.todolists.get('51c58a35737c3c3614000002').toJSON().todos;

            // if a user toggles the completed checkbox,
            // we do not want to show the loader
            // hmm...
            common.showLoader();

            // MUST PASS DATA AGAIN FOR PATCH TO /JUST/ SEND CHANGED DATA
            // else the whole client side model representation will be sent
            this.model.save(modelData, {
                patch: true,

                // silent:true, // double on iphone?

                success: function () {
                    common.hideLoader();
                },
                error: function (model, xhr) {
                    var msg = __('error');

                    var json = JSON.parse(xhr.responseText);

                    if(json && json.message && json.message.key) {
                        msg = __(json.message.key);
                    }

                    common.hideLoader();
                    common.notify(msg);
                }
            });
        },

        destroy: function (e, directly) {
            if(e) {
                e.preventDefault();
            }

            var self = this;

            var destroyTodo = function (userConfirmed) {
                if(!userConfirmed) {
                    return false;
                }

                common.showLoader();
                self.model.destroy({
                    success: function () {
                        common.hideLoader();
                    },
                    error: function (model, json) {
                        var msg = __('error');
                        if(json && json.message) {
                            msg = json.message;
                        }

                        common.hideLoader();
                        common.notify(msg, 6000);
                    }
                });
            };

            if(directly) {
                return destroyTodo(true);
            }

            setTimeout(function () {
                common.dialog(__('really'), destroyTodo, true);
            }, 20);

            return false;
        },

        // XXX? hat scheinbar was gebracht...
        // sonst bekommt toggle immer 2mal ein event oder
        // irgendwas is da sonst ganz faul
        preventDefault: function (e) {
            e.preventDefault();
        }
    });

    return TodoView;
});
