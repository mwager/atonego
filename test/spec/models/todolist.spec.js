/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * Specs für `Todolist` Model und Collection
 *
 * @author Michael Wager <mail@mwager.de>
 */
define('TodolistSpec', [
    'app',
    'common',
    'models/todolist',
    'collections/todolists'
], function (app, common, Todolist, Todolists) {
    'use strict';

    describe('Todolists', function () {
        before(function () {
            this.todolist = new Todolist();
            this.todolists = new Todolists();
        });

        describe('Model::Todolist', function () {
            describe('Common stuff', function () {
                it('should be defined', function () {
                    expect(typeof Todolist).to.equal('function');
                    expect(typeof this.todolist.on).to.equal('function');
                });

                it('should have a urlRoot property', function () {
                    expect(this.todolist.urlRoot).to.equal('---/api/v1/lists');
                });
            });

            describe('Validation', function () {
                // set up fixture
                before(function () {
                    this.testTitle = 'test-list';

                    this.list = new Todolist({
                        _id:    '514c5d7d5f210d284c000015',
                        title:  this.testTitle
                    });
                });

                it('should not change the title if empty string passed', function (done) {
                    this.list.once('invalid', function(model, errorMsg, errorObject) {
                        log(errorMsg);
                        expect(model.get('title')).to.equal(this.testTitle);
                        expect(typeof errorMsg).to.equal('string');
                        expect(typeof errorObject).to.equal('object');
                        done();
                    }, this);

                    // this will trigger the invalid event -> validation FAILS
                    // note: you can pass custom data to the model's validation function
                    this.list.set('title', '', {validate: true, foo: 'bar'});

                    // still the same!
                    expect(this.list.get('title')).to.equal(this.testTitle);

                    // this also runs the validate() method !
                    expect(this.list.isValid()).to.equal(false);
                });

                it('should not change the title if longer than 32 characters', function (done) {
                    this.list.once('invalid', function(model, errorMsg, errorObject) {
                        expect(model.get('title')).to.equal(this.testTitle);
                        expect(typeof errorMsg).to.equal('string');
                        expect(typeof errorObject).to.equal('object');
                        done();
                    }, this);

                    this.list.set('title', '12345678901234567890123456789032_', {validate: true});
                });

                it('should change the title if length is ok', function () {
                    this.list.set('title', 'party', {validate: true});
                    expect(this.list.get('title')).to.equal('party');
                });
            });

            describe('Helpers', function () {
                it('should return the count of uncompleted todos', function (done) {
                    var todos = []; // fixtures

                    // #1
                    this.todolist.set('todos', todos);
                    expect(this.todolist.getUncompletedTodosCount()).to.equal(0);

                    // #2
                    todos = [
                        {title: 'a', completed: true},
                        {title: 'b', completed: true},
                        {title: 'c', completed: true},
                        {title: 'd', completed: false},
                        {title: 'e', completed: false},
                        {title: 'f', completed: false}
                    ];
                    this.todolist.set('todos', todos);
                    expect(this.todolist.getUncompletedTodosCount()).to.equal(3);

                    // #3
                    todos = [
                        {title: 'a', completed: true},
                        {title: 'b', completed: false},
                        {title: 'c', completed: false},
                        {title: 'd', completed: false},
                        {title: 'e', completed: false},
                        {title: 'f', completed: false}
                    ];

                    // also test the "change:attr" event for fun & profit
                    this.todolist.on('change:todos', function() {
                        expect(this.todolist.getUncompletedTodosCount()).to.equal(5);
                        done();
                    }, this);
                    this.todolist.set('todos', todos);
                });
            });
        });

        describe('Collection::Todolists', function () {
            describe('Common stuff', function () {
                it('should be defined', function () {
                    expect(typeof Todolists).to.equal('function');
                    expect(typeof this.todolists).to.equal('object');

                    expect(this.todolists.toJSON().length).to.equal(0);

                    // underscore/backbone functions?
                    expect(typeof this.todolists.map).to.equal('function');
                    expect(typeof this.todolists.on).to.equal('function');
                });

                it('should have the url property', function () {
                    expect(this.todolists.url).to.equal('---/api/v1/lists');
                });
            });
        });
    });
});
