/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * BaseView
 * from http://addyosmani.github.com/backbone-fundamentals/ \
 *  #how-do-you-cleanly-dispose-views-to-avoid-memory-leaks
 */
define(function(require) {
    'use strict';

    var _ = require('lodash'),
        Backbone = require('backbone'),
        HeaderView = require('views/header');

    var BaseView = function (options) {
        this.defaultViewData = {};

        // so initialize in child calls initialize here automatically
        Backbone.View.apply(this, [options]);
    };

    _.extend(BaseView.prototype, Backbone.View.prototype, {
        initialize: function ( /*options*/ ) {},

        /**
         * cleanup
         */
        dispose: function () {
            /***
            "remove" looks like this in Backbone 1.0
            remove: function() {
              this.$el.remove();
              this.stopListening();
              return this;
            },
            ***/
            return this.remove();
        },

        /**
         * Wrapper for rendering the views template
         *
         * XXX render performance optimize?
         */
        renderSelf: function (data) {
            var html = this.template(data || this.defaultViewData);

            /* does this actually make it faster? #benchs #xxx
            this.$el.empty();
            f = document.createDocumentFragment(),
            div = document.createElement('div');

            div.innerHTML = html;
            f.appendChild(div);

            this.el.appendChild(f);
            */

            this.$el.html(html);
        },

        /**
         * Render the Header view.
         *
         * This means "this" is a "root-view" which
         * manages a whole screen
         */
        renderHeader: function(opts) {
            this.headerView = new HeaderView(opts);
            this.headerView.render();
        }
    });

    BaseView.extend = Backbone.View.extend;

    return BaseView;
});