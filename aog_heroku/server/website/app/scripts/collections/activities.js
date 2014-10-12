/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * ActivityCollection
 *
 * No API Endpoint, only needed on client side
 */
define([
    'app',
    'lodash',
    'backbone',
    'common',
    'models/activity'
], function (app, _, Backbone, common, ActivityModel) {
    'use strict';

    var ActivityCollection = Backbone.Collection.extend({
        model: ActivityModel,

        // check if an invitation already exists (XXX no automated tests here)
        __invitationAlreadyExists: function(obj) {
            var exists = false;

            this.each(function(model) {
                model = model.toJSON();

                if(obj.key === model.key && _.isEqual(obj.data, model.data)) {
                    exists = true;
                    return; // breaks the loop
                }
            });

            return exists;
        },

        /**
         * Add an activity
         *
         * @param {[type]} activity Normal JavaScript Object, will be converted to ActivityModel and id is generated
         * @param {[type]} silent   [description]
         */
        addActivity: function(activity, silent) {
            if(typeof silent === 'undefined') {
                silent = false;
            }

            // check for uniqueness manually
            if(this.__invitationAlreadyExists(activity)) {
                return false;
            }

            // convert to model
            activity = new ActivityModel(activity);

            // generate random id to unique identify all activities
            var id = common.random(16);

            activity.set({id: id, created_at: common.now(app.lang)}, {silent: true});

            // calls sort!
            this.add(activity, {silent: silent});

            // log('adding activity ' + id, 'now: ' + this.toJSON().length, this.toJSON(), this.cid);
        },

        /**
         * Order by created_at "desc"
         */
        comparator: function (activity) {
            var created = new Date(activity.get('created_at')).getTime();

            // order by "DESC":
            return -created;
        }
    });

    return ActivityCollection;
});
