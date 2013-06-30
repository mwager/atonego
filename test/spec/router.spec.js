/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * Tests für AppRouter und evtl. SubRouter
 *
 * @author Michael Wager <mail@mwager.de>
 */
define('AppRouterSpec', [
    'backbone',
    'app',
    'common',
    'router'
], function (Backbone, app, common, AppRouter) {

    'use strict';

    describe('AppRouter', function () {

        before(function (done) {
            this.router = app.router;
            done();
        });

        it('AppRouter should be defined', function () {
            expect(typeof AppRouter).not.to.equal('undefined');
            expect(typeof AppRouter).to.equal('function');
            expect(typeof new AppRouter().routes).to.equal('object');
            expect(typeof this.router).to.equal('object');

            expect(typeof this.router.routes).to.equal('object');
            expect(typeof this.router.initialize).to.equal('function');
            //expect(typeof this.router.defaultAction).to.equal('function');
            expect(typeof this.router.renderView).to.equal('function');
            expect(typeof this.router.go).to.equal('function');
        });

        it('should extend Backbone.Events', function () {
            var spy = sinon.spy();

            // Call the anonymous spy method when 'foo' is triggered
            app.router.on('foo', spy);

            // Trigger the foo event
            app.router.trigger('foo');

            // Expect that the spy was called at least once
            expect(spy.called).to.equal(true);
        });


        describe('testing our routes', function () {
            beforeEach(function () {
                this.router = new AppRouter();
                this.routeSpy = sinon.spy();
                try {
                    Backbone.history.start({silent: true, pushState: true});
                } catch (e) {
                }
                this.router.navigate('elsewhere');
            });

            it('fires the index route with a blank hash', function () {
                this.router.on('route:index', this.routeSpy);
                this.router.navigate('', {trigger: true});
                expect(this.routeSpy.called).to.equal(true);
            });
            it('fires the index route with hash #start', function () {
                this.router.on('route:index', this.routeSpy);
                this.router.navigate('start', {trigger: true});
                expect(this.routeSpy.called).to.equal(true);
            });

            /*it('fires the todolists route with hash #todolists', function () {
                this.router.on('route:todolists', this.routeSpy);
                this.router.navigate('todolists', {trigger: true});
                expect(this.routeSpy.called).to.equal(true);
            });*/

//            it('calls the todos route with hash #todolists/:id', function () {
//                // hmm? var onRouteSpy = sinon.spy(this.router, 'onRouteChange');
//                try {
//                    this.router.on('route:todolists/1', this.routeSpy);
//                    this.router.navigate('todolists/' + 1, {trigger:true});
//                }catch(e) {
//                    expect(this.routeSpy.called).to.equal(true);
//                }
//
//                // hmm? expect(onRouteSpy.called).to.equal(true);
//            });
        });
    });
});