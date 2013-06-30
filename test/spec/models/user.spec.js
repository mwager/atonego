/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * Specs für User Model und Collection
 *
 * @author Michael Wager <mail@mwager.de>
 */
define('UserSpec', [
    'app',
    'common',
    'models/user',
    'collections/users'
], function (app, common, User, Users) {
    'use strict';

    describe('Users', function () {
        before(function () {
            this.user = new User();
            this.users = new Users();
        });

        describe('Model::User', function () {
            describe('Common stuff', function () {

                it('should be defined', function () {
                    expect(typeof User).to.equal('function');
                    expect(typeof this.user.on).to.equal('function');
                });

                it('should have a urlRoot property', function () {
                    expect(this.user.urlRoot).to.equal('---/api/v1/users');
                });
            });
        });

        describe('Collection::Users', function () {
            describe('Common stuff', function () {
                it('should be defined', function () {
                    expect(typeof Users).to.equal('function');
                    expect(typeof this.users).to.equal('object');

                    expect(this.users.toJSON().length).to.equal(0);

                    // underscore/backbone functions?
                    expect(typeof this.users.map).to.equal('function');
                    expect(typeof this.user.on).to.equal('function');
                });

                it('should have the url property', function () {
                    expect(this.users.url).to.equal('---/api/v1/users');
                });
            });
        });

    });
});