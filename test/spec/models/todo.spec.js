/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * Specs für `Todo` Model und Collection
 *
 * @author Michael Wager <mail@mwager.de>
 */
define('TodoSpec', [
    'backbone',
    'app',
    'common',
    'models/todo',
    'collections/todos'
], function (Backbone, app, common, Todo, Todos) {
    'use strict';

    describe('Todos', function () {
        before(function () {
            this.todo = new Todo();
            this.todos = Todos; // is already an instance !
        });

        describe('Model::Todo', function () {
            describe('Common stuff', function () {

                it('should be defined', function () {
                    expect(typeof Todo).to.equal('function');
                    expect(typeof this.todo.on).to.equal('function');
                    expect(this.todo instanceof Backbone.Model)
                        .to.equal(true);
                });

                it('should have a urlRoot property', function () {
                    expect(this.todo.urlRoot).to.equal('---/api/v1/todos');
                });
            });
        });

        describe('Collection::Todos', function () {
            describe('Common stuff', function () {
                it('should be defined', function () {

                    // ist hier bereits eine neue Instanz!
                    // expect(typeof Todos).to.equal('function');
                    expect(this.todos instanceof Backbone.Collection)
                        .to.equal(true);

                    expect(typeof this.todos).to.equal('object');
                    expect(this.todos.toJSON().length).to.equal(0);

                    // underscore/backbone functions?
                    expect(typeof this.todos.map).to.equal('function');
                    expect(typeof this.todos.on).to.equal('function');
                });

                it('should have the url property', function () {
                    expect(this.todos.url).to.equal('---/api/v1/todos');
                });
            });
        });

    });
});