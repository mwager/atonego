/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * TodolistView
 *
 * Verwaltet mehrere todolistitem.js sub views.
 *
 * @author Michael Wager <mail@mwager.de>
 */
define(function (require) {
    'use strict';

    var app          = require('app'),
        _            = require('underscore'),
        tpl          = require('text!templates/lists/todolist.html'),
        Todolist     = require('models/todolist'),
        BaseView     = require('views/base'),
        TodolistItem = require('views/lists/todolistitem'),
        events       = {};

    return BaseView.extend({
        // id: '',
        // tagName: 'ul',
        events: events,

        initialize: function () {
            this.template = _.template(tpl);

            // this is called upon fetch
            this.listenTo(app.todolists, 'add', this.addTodolistItem);
            this.listenTo(app.todolists, 'remove', this.render);
            this.listenTo(app.todolists, 'reset', this.reset);
        },

        // on "reset" müssen wir hier leeren, der router "added"
        // danach wieder alle (siehe app.router.setAuthenticated())
        reset: function() {
            this.$el.empty();
        },

        /**
         * Render the todolists.
         *
         * NOTE: this is optimized for speed on real devices!
         *
         * @see http://coding.smashingmagazine.com/2012/11/05/writing-fast-memory-efficient-javascript/
         */
        render: function () {
            var self = this;

            // must be emptied because of appendChild
            this.$el.empty(); // zepto's impl: this.each(fn() {this.innerHtml = ''})

            var frag = document.createDocumentFragment();
            var subView;

            //var views = [], html = [];
            _.each(app.todolists.models, function (list) {
                subView = self.getTodolistSubViewFromModel(list);
                subView.render();
                frag.appendChild(subView.el);
            });

            this.el.appendChild(frag);

            return this;
        },

        /**
         * Get the list sub view from the model or modelData
         */
        getTodolistSubViewFromModel: function(listModel) {
            var listItemSubView;

            if(!_.isFunction(listModel.trigger)) {
                listModel = new Todolist(listModel);
            }

            // init the todolist_item sub view
            listItemSubView = new TodolistItem({
                todolist: listModel
            });

            return listItemSubView;
        },

        /**
         * Add a new todolist item sub view
         *
         * @param list Einfaches Objekt aus render() oder
         * backbone model (this.todolists.on('add'...))
         */
        addTodolistItem: function (listModel) {
            var listItemSubView = this.getTodolistSubViewFromModel(listModel);

            // append the sub view to the list
            listItemSubView.$el.appendTo(this.$el);
            listItemSubView.render();
        }
    });
});
