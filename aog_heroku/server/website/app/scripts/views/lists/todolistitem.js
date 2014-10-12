/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * TodolistItem View
 *
 * Kümmert sich um die Darstellung einer Todolists als Listeneintrag.
 * Ist eine der SubViews von todolist.js
 *
 * @author Michael Wager <mail@mwager.de>
 */
define(function (require) {
    'use strict';

    var _           = require('lodash'),
        app         = require('app'),
        BaseView    = require('views/base'),
        tpl         = require('text!templates/lists/todolistitem.html'),
        events      = {};

    return BaseView.extend({
        tagName: 'li',
        // attributes: {},

        events: events,
        template: _.template(tpl),

        initialize: function (args) {
            var self = this;

            if(!args || !args.todolist) {
                throw 'todolistitem.js: no todolist model provided!';
            }

            this.todolist = args.todolist;

            this.listenTo(this.todolist, 'change', this.render);
            this.listenTo(this.todolist, 'destroy', function (model) {
                self._onDelete(model.get('_id'));
            });
        },

        render: function () {
            var list = this.todolist.toJSON();

            this.renderSelf({
                todolist: list,
                uncompletedTodosCount: this.todolist.getUncompletedTodosCount()
            });

            return this;
        },

        // what to do if a list is deleted (locally or from some other user)
        _onDelete: function (todolistID) {
            app.router.go('todolists');
            app.todolists.remove(todolistID); // triggers render
        }
    });
});
