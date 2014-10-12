/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * ActivitiesView
 *
 * Manages the activity stream, invitations, etc
 *
 * @author Michael Wager <mail@mwager.de>
 */
define(function(require) {
    'use strict';

    var
        _        = require('lodash'),
        $        = require('zepto'),
        app      = require('app'),
        common   = require('common'),
        tpl      = require('text!templates/lists/activities.html'),
        User     = require('models/user'),
        BaseView = require('views/base');

    var events = {};

    // invitations
    events[app.defaultClickEvent + ' .accept-invitation'] = 'acceptInvitation';
    events[app.defaultClickEvent + ' .reject-invitation'] = 'rejectInvitation';

    // remove one or all from the stream (means from the activities collection)
    events[app.defaultClickEvent + ' .remove-activity']   = 'removeOneActivity';
    events[app.defaultClickEvent + ' .remove-activities'] = 'removeAllActivities';

    return BaseView.extend({
        template: _.template(tpl),
        events: events,

        initialize: function () {
            this.template = _.template(tpl);

            // here we can listen for the user and re-render easily
            this.user = app.user;
            this.listenTo(app.user, 'change', this.render);

            this.listenTo(app.activityCollection, 'add',    this.render);
            this.listenTo(app.activityCollection, 'remove', this.render);
            this.listenTo(app.activityCollection, 'reset',  this.render);
        },

        render: function () {
            var user = this.user ? this.user.toJSON() : new User();

            // app.activityCollection.reset();

            // entweder invitations liegen beim laden im user...
            // ...oder kommen bei update, dann ist "key" automatisch = "invitation"
            // und data ist same wie hier
            _.each(user.invite_list_ids, function(obj) {
                if(obj.user && obj.list) {
                    // we will not add duplicates!
                    app.activityCollection.addActivity({
                        key: 'invitation',
                        data: obj,
                        id: obj.list._id + '_' + obj.user._id
                    }, true); // SILENTLY!
                }
            });

            // not needed anymore ! -> WRONG.
            // app.user.set({'invite_list_ids': []}, {silent: true});

            var activities = app.activityCollection.toJSON();
            // TODO GROUP by key !!! ???

            this.renderSelf({
                app: app,
                common: common,
                activities: activities
            });

            return this;
        },

        acceptInvitation: function (e) {
            e.preventDefault();
            var self = this;
            var link = $(e.currentTarget);
            var userID = link.attr('data-user-id');
            var listID = link.attr('data-list-id');
            var activityID = link.attr('data-activity-id');

            var acceptInvitationAndJoinList = function (confirmed) {
                if(!confirmed) {
                    return false;
                }

                var u = new User({
                    _id: self.user.get('_id'),
                    issuer_user_id: userID,
                    list_id: listID,
                    add: true
                });

                common.showLoader();
                u.save(null, {
                    success: function (model, json) {
                        common.hideLoader();

                        var list = json.list;
                        var user = json.user;

                        log('SUCCESS ADD: ', json);
                        app.user.set(user);

                        app.todolists.remove(list._id);
                        app.todolists.add(list);

                        // ### local db update ###
                        app.storage.storeUser(user, function(/*err, success*/) {});
                        app.storage.storeListsForUser(app.user.get('_id'), app.todolists.toJSON(),
                            function(/*err, success*/) {});

                        app.router.go('todolists/' + listID);

                        // remove triggers re-render
                        app.activityCollection.remove(activityID);

                        // subscribe to this list
                        if(app.socketWrapper) {
                            app.socketWrapper.subscribeToList(listID);
                        }

                        common.notify(__('success'));
                    },
                    error: function (model, json) {
                        var msg = __('error');
                        if(json && json.message) {
                            msg = json.message;
                        }
                        common.hideLoader();
                        common.notify(msg);
                    }
                });
            };

            common.dialog(__('really'), acceptInvitationAndJoinList, true);
        },

        rejectInvitation: function (e) {
            e.preventDefault();
            var self = this;
            var link = $(e.currentTarget);
            var userID = link.attr('data-user-id');
            var listID = link.attr('data-list-id');
            var activityID = link.attr('data-activity-id');

            var rejectInvitationHelper = function (confirmed) {
                if(!confirmed) {
                    return false;
                }

                var u = new User({
                    _id: self.user.get('_id'),
                    issuer_user_id: userID,
                    list_id: listID,
                    reject: true
                });

                common.showLoader();
                u.save(null, {
                    success: function (model, json) {
                        common.hideLoader();

                        // XXX needed?
                        link.parent().parent().parent().parent().remove();

                        app.user.set(json);

                        // remove triggers re-render
                        app.activityCollection.remove(activityID);

                        common.notify(__('success'));
                    },
                    error: function (model, json) {
                        var msg = __('error');
                        if(json && json.message) {
                            msg = json.message;
                        }

                        common.hideLoader();
                        common.notify(msg);
                    }
                });
            };

            common.dialog(__('really'), rejectInvitationHelper, true);
        },

        removeOneActivity: function(e) {
            e.preventDefault();
            var activityID = $(e.currentTarget).attr('data-activity-id');
            var ac         = app.activityCollection.get(activityID);

            if(!ac) {
                return false;
            }

            if(ac.key === 'invitation') {
                return false;
            }

            // remove from dom
            $('#activity-' + activityID).remove();

            setTimeout(function() {
                app.activityCollection.remove(activityID);
            }, 10);
        },

        removeAllActivities: function(e) {
            e.preventDefault();

            setTimeout(_.bind(function __resetColl() {
                app.activityCollection.toJSON().forEach(function(ac) {
                    if(ac && (ac.key !== 'invitation')) {
                        app.activityCollection.remove(ac.id, {silent: true});
                    }
                });

                this.render();
            }, this), 10);

        }
    });
});
