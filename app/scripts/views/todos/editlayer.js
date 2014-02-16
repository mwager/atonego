/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * TodoEditLayer
 *
 * Used to edit a todos properties in a modal
 * using ratchet.css's modal support
 *
 * @see http://maker.github.io/ratchet/#modals
 *
 * @author Michael Wager <mail@mwager.de>
 */
define(function(require) {
    'use strict';

    // module privates and dependencies
    var
        app                 = require('app'),
        $                   = require('zepto'),
        common              = require('common'),
        BaseView            = require('views/base'),
        tpl                 = require('text!templates/todos/editlayer.html'),
        _                   = require('underscore'),
        events = {};

    events['focus input']        = 'switchToEditMode';
    events['focus textarea']     = 'switchToEditMode';

    events[app.defaultClickEvent + ' .close-layer']  = 'close';
    // events['blur #notice']                           = 'saveTodo';
    events[app.defaultClickEvent + ' .ago-toggle-wrap']  = 'toggleCheckbox';

    events[app.defaultClickEvent + ' #date-input']  = 'onClickDate';

    /**
     * Constructor
     */
    var TodoEditLayer = BaseView.extend({
        template: _.template(tpl),

        __id: 'todo-edit-layer',

        events: events,

        /**
         * Init the layer stuff.
         *
         * We append a new container to the body and then use
         * this as the layers 'el'
         */
        initialize: function(args) {
            // only to know if we should save on close
            this.editMode = false;

            this.todo = args.todo;
            this.listenTo(this.todo, 'change', this.render);

            this.$el = $('#' + this.__id); // reload

            if(this.$el.length > 0) {
                this.$el.remove();
            }

            var $body = $('body');
            $body.append('<div id="' + this.__id + '"></div>');

            // reload
            this.$el = $('#' + this.__id);
            this.el  = this.$el[0];
        },

        /**
         * Open the modal
         */
        open: function() {
            // first render content, then display it
            this.render();

            var $modal = this.$el.find('.modal');

            // this triggers the "slide up" animation
            // and shows the modal #thx @ratchet !
            setTimeout(function() {
                $modal.addClass('active');
            }, 30);
        },

        /**
         * Close the modal
         */
        close: function() {
            if(!this.$el || this.$el.length === 0) {
                return false;
            }

            var self   = this;
            var $modal = this.$el.find('.modal');

            if($modal.length > 0) {

                // this triggers the slide down (-;
                $modal.removeClass('active');

                // we only save on close !
                if(this.editMode) {
                    setTimeout(function() {
                        self.saveTodo();
                    }, 0);
                }

                setTimeout(function() {
                    if(self.$el.length > 0) {
                        // this.$el.remove();

                        // will remove $el and call stopListening()
                        self.dispose();
                    }
                }, 500);
            }
            else {
                // calls stopListening()
                this.dispose();
            }
        },

        /**
         * Render the layers components
         */
        render: function() {
            var self = this;
            var todo = this.todo.toJSON();

            // TODO better tests XXX stimmt ab und zu nicht -> 1970 ...
            // scheinbar bei sprachwechsel zwischen mehreren Geräten stimmt was nicht...
            var date = todo.date ? common.parseDate(new Date(todo.date), app.lang) : '';
            // log('RENDER ================================', todo.date, date, todo.users_to_notify);

            var todolist = app.todolists.get(todo.todolist);
            if(!todolist) {
                todolist = app.todolists.get(todo.todolist._id);
            }

            var list = todolist.toJSON();
            var theUser = app.user.toJSON();

            /**
             * Wenn wir kein Datum haben werden im Hintergrund schonmal
             * wieder alle user gesetzt!
             */
            if(date.length === 0) {
                _.each(list.participants, function(user) {
                    todo.users_to_notify.push(user._id);
                });
            }

            this.renderSelf({
                _     : _,
                common: common,
                app: app,
                todo: todo,
                date: date,
                todolist: list,
                theUser: theUser
            });

            this.$headerTitle = $('.bar-title .title', this.el);
            this.$todoTitle = $('#todo-title', this.el);
            this.$notice = $('#notice', this.el);
            this.$date   = $('#date-input', this.el);
            this.$chooseParticipants = $('.choose-participants', this.el);
            // this.$timestamp = $('#timestamp', this.el);

            if(todo.date) {
                setTimeout(function() {
                    self.$chooseParticipants.removeClass('hidden');
                }, 10);
            }

            // prevent ghostclick SHIT !!!
            setTimeout(function __fuckOffGhostclicks() {
                self.$notice.attr('readonly', null);
                self.__initDatepicker();
            }, 700);

            return this;
        },

        /**
         * After every render() we must re-init the datetime-picker
         */
        __initDatepicker: function() {
            var self = this;
            var dMin = new Date();

            // wir brauchen nur die optionen für typ "dateTIME" !
            var datetimeOption = {
                preset:     'datetime',
                minDate:    dMin,
                maxDate:    new Date(dMin.getFullYear() + 2, dMin.getMonth(), dMin.getDay()),
                stepMinute: 5 // YEAH!
            };

            this.$date.scroller('destroy').scroller($.extend(datetimeOption, {
                theme:      'default',
                mode:       'clickpick', // scroller || clickpick || mixed
                lang:       app.lang,
                display:    'top',
                animate:    '',

                // callbacks:
                onCancel: function(/*text, instance*/) {
                    // hide participants choosing div
                    setTimeout(function() {
                        self.$chooseParticipants.addClass('hidden');
                    }, 1000);

                    self.$date.val('');
                    // self.saveTodo();
                },
                onSelect: function(/*text/*, instance*/) {
                    // show participants choosing div

                    setTimeout(function() {
                        self.$chooseParticipants.removeClass('hidden');
                    }, 10);

                    // self.saveTodo();
                }
            }));
        },

        /**
         * Update the todo to the server
         * Called on blur notice textarea and change date
         */
        saveTodo: function() {
            var self = this;
            // var oldNotice = this.todo.get('notice');
            var title     = this.$todoTitle.val().trim();
            var notice    = this.$notice.val().trim();
            var dateVal   = this.$date.val().trim();
            var date      = null;
            var parser    = common.getDateParser(app.lang);

            // parse a date from the textfield value (see app.spec.js)
            if(dateVal.length > 0) {
                date = parser.parse(dateVal);
            }

            // Wir lassen nicht mehr als 1024 Zeichen zu
            if(notice.length > 1024) {
                return false;
            }

            var users_to_notify = [],
                $el;

            $('.ago-toggle', this.el).each(function() {
                $el = $(this);

                if($el.hasClass('checked')) {
                    users_to_notify.push($el.attr('data-user-id'));
                }
            });

            var theDate = date === null ? '' : date.getTime();

            var theData = {
                title: title,
                notice: notice,
                date: theDate, // send timestamp! see api tests.
                users_to_notify: users_to_notify,

                updated_at: new Date().getTime(),
                updated_by: app.user.toJSON()
            };

            /*** UPDATE TIMESTAMP MANUALLY
            not needed if we save on close
            this.$timestamp.html(
                __('updated') + ' ' +
                common.fromNow(this.todo.get('updated_at'), false, app.lang) + ' ' +
                __('by') + ' ' +
                common.getUser(this.todo.toJSON(), true)
            );*****/

            this.todo.set(theData, {silent: true});

            // we must also update app.todolists !
            // the model's collection was already updated via set()
            var todos  = this.todo.collection;
            var listID = this.todo.get('todolist');
            var list   = app.todolists.get(listID);

            if(list && todos) {
                todos = todos.toJSON();

                list.set({
                    todos: todos
                }, {silent: true});
            }

            var hasChanged =
                this.todo.hasChanged('title') ||
                this.todo.hasChanged('notice') ||
                this.todo.hasChanged('date') ||
                this.todo.hasChanged('users_to_notify');

                /* hmm
                log(hasChanged,
                    this.todo.hasChanged('title'),
                    this.todo.hasChanged('notice'),
                    this.todo.hasChanged('date'),
                    this.todo.hasChanged('users_to_notify'))*/

            if(!hasChanged) {
                return false;
            }

            common.showLoader();
            // must pass theData for PATCH to work properly
            this.todo.save(theData, {
                patch: true,

                success: function() {

                    // trigger success to re-render the todoview.js
                    self.trigger('save-success', self.todo.toJSON());

                    // only on error
                    // common.notify(__('saved'));
                    common.hideLoader();
                },
                error: function() {
                    common.notify(__('error'));
                    common.hideLoader();
                }
            });
        },

        /**
         * Toggle class "checked" and save
         */
        toggleCheckbox: function(e) {
            // just toggle !!! (-:
            $(e.currentTarget).find('.ago-toggle').toggleClass('checked');

            // this.saveTodo();

            this.switchToEditMode();

            return false;
        },

        switchToEditMode: function() {
            this.editMode = true;
        },

        /**
         * Fix iOS7 bug:
         * The datepicker input needs focus on ios7, else it wont open.
         */
        onClickDate: function(e) {
            var $el = $(e.currentTarget);
            $el.focus();
        }
    });

    return TodoEditLayer;
});
