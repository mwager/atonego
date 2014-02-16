/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * HeaderView
 *
 * @author Michael Wager <mail@mwager.de>
 */
define(function (require) {
    'use strict';

    var _ = require('underscore'),
        $ = require('zepto'),
        app = require('app'),
        // common = require('common'),
        tpl = require('text!templates/header.html'),
        Backbone = require('backbone'),
        events = {};

    events[app.defaultClickEvent + ' #header-save'] = 'onHeaderSaveClick';

    return Backbone.View.extend({
        // el:     'header', (must be passed in everytime)
        events: events,

        initialize: function (args) {
            this.template = _.template(tpl);

            this.title = args.title;

            // state of this view maintained via these bools
            // (which buttons should be displayed depending on
            // the current screen)
            this.showBackButton      = args.showBackButton     || false;
            this.showHomeButton      = args.showHomeButton     || false;
            this.showListEditButton  = args.showListEditButton || false;

            // depending on the view we have a "save " button top right
            this.showSaveButton = args.showSaveButton || false;

            if(this.showListEditButton) {
                this.listID = args.listID;
            }
        },

        /**
         * Render the header
         */
        render: function () {
            this.$el.html(this.template({
                title:              this.title,
                showBackButton:     this.showBackButton,
                showHomeButton:     this.showHomeButton,
                showListEditButton: this.showListEditButton,
                showSaveButton:     this.showSaveButton,
                listID:             this.listID
            }));

            // header needs this class in "ratchet”
            this.$el.addClass('bar-title');

            return this;
        },

        /**
         * On click on header save, we just trigger an event,
         * so other views can easily listen for this event to save
         */
        onHeaderSaveClick: function(e) {
            e.preventDefault();

            // disabled check
            var $ele = $(e.currentTarget);
            if($ele.hasClass('disabled') || $ele.attr('disabled')) {
                return false;
            }

            app.trigger('header-save', e);

            return false;
        }
    });
});
