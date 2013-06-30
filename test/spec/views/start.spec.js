/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * Specs for start view
 *
 * @author Michael Wager <mail@mwager.de>
 */
define('StartViewSpec', [
    'zepto',
    'app',
    'common',
    'views/base'
], function ($, app, common, StartScreenView) {
    'use strict';

    describe('StartView', function () {

        before(function (done) {
            this.view = new StartScreenView();
            done();
        });

        it('should be defined', function () {
            expect(typeof StartScreenView).not.to.equal('undefined');
            expect(typeof StartScreenView).to.equal('function');
            //expect(typeof new StartScreenView().events).to.equal('object');

            expect(typeof this.view.trigger).to.equal('function');
            expect(typeof this.view.on).to.equal('function');
            expect(typeof this.view.off).to.equal('function');
            expect(typeof this.view.initialize).to.equal('function');
            expect(typeof this.view.render).to.equal('function');
        });

        it('render() should return self for chaining support', function () {
            var view = this.view.render();
            expect(typeof view).to.equal(typeof this.view);

            expect(this.view.render()).to.equal(this.view);

            // is this also a Backbone View?
            expect(typeof view.trigger).to.equal('function');
        });

        it('should create a div element', function () {
            expect(this.view.el.nodeName).to.equal('DIV');

            log($(this.view.el).children());
        });
    });
});