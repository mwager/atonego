'use strict';
/*global app:true, localforage:true*/
/**
 * File contains all services
 */

var _ = require('../lib/underscore/underscore.js');

// TODO testing?
// TODO module definition only once app wide?!
window.app

.factory('Todolists', ['$window', function(/*win*/) {
  // var STORAGE_KEY = 'todolists';
  // var LISTS = [];

  // find a list by id in the LISTS array (TODO performance/data structures?)
  function findList(lists, id) {
    var listFound;

    lists.some(function(l) {
      if(l._id === id) {
        listFound = l;
        return true; // break loop
      }
    });
    return listFound;
  }

  // public API
  return {
    clearAll: function(done) {
      localforage.clear(done);
    },
    // setLists: function(lists) {
    //   LISTS = lists;
    //   persistAllLists();
    // },

    // addList: function(list) {
    //   list.dirty = true;
    //   list.todos = [];

    //   LISTS.push(list);

    //   persistAllLists();
    // },

    // updateList: function(list) {
    //   updateList(list);

    //   persistAllLists();
    // },

    // getLists: function(done) {
    //   log('fetching lists...');
    //   localforage.getItem(STORAGE_KEY, function(data, lists) {
    //     log('fetched lists:', lists);
    //     LISTS = lists || [];
    //     done(null, LISTS);
    //   });
    // },

    getListByID: function(id, done) {
      if(app.user && app.user.todolists) {
        var list = findList(app.user.todolists, id);
        if(list) {
          return done(null, list);
        }
        else {
          return done('no list');
        }
      }
      else {
        return done('no list');
      }
    },

    // deleteCompletedTodosOfList: function(list) {
    //   var l = findList(list.id);
    //   if(!l) {
    //     return;
    //   }
    //   var todos = [];
    //   l.todos.forEach(function(t) {
    //     if(!t.completed) {
    //       todos.push(t);
    //     }
    //   });
    //   l.todos = todos;
    //   updateList(l);
    //   persistAllLists();
    // },

    // deleteListByID: function(id) {
    //   removeList(id);
    //   persistAllLists();
    // }
  }
}])

// XXX better place?
.factory('PushNotificationHelpers', function() {
  return {
    /**
     * Init and register the push notification plugin
     * "This should be called as soon as the device becomes ready"
     *
     * NOTE:
     * if the received payload has too much "'" signs, apple will send it to
     * the device, but the JSON parser will then fail with an uncaught exception
     * So, watch out for clean messages.
     *
     * NOTE2: (XXX)
     * This method is pretty long and ugly, consider refactoring
     * (caused by platform specific code)
     *
     * @see https://github.com/phonegap-build/PushPlugin
     */
    initAndRegisterPushNotifications: function (options) {
      if(!window.plugins || !window.plugins.pushNotification) {
        return false;
      }

      // XXX module?
      app.pushNotification = window.plugins.pushNotification;

      var opts;

      // custom logic must be executed on every push receive (ios/android)
      var customReceiveHook = function(platform, evnt) {
        options.receivePush(platform, evnt);
      };

      // PUSH Plugin "register error handler" (iOS and Android)
      var errorHandler = function(err) {
        log('PUSH INIT ERROR');
        app.handleError(err);
        options.error(err);
      };

      // we add the token to our server via "PATCH /users/:id"
      var sendTokenToServer = function(token) {
        options.sendToken({
          apn_device_token: token
        });
      };

      // we add the regID to our server via "PATCH /users/:id"
      var sendRegIDToServer = function(regID) {
        options.sendToken({
          gcm_reg_id: regID
        });
      };

      // --- notification callback handlers ---
      // MUST BE GLOBAL!?!?

      // iOS handler gets called if app is open (sadly, this must be global...)
      window.onNotificationAPN = function(evnt) {
        customReceiveHook('ios', evnt);
      };

      // Android handler
      window.onNotificationGCM = function(e) {
        switch( e.event ) {
        case 'registered':
          if ( e.regid.length > 0 ) {
            setTimeout(function() {
              sendRegIDToServer(e.regid);
            }, 1000);

            // Your GCM push server needs to know the regID before it can push to this device
            // here is where you might want to send it the regID for later use.
            log('REGISTERED -> REGID:' + e.regid);
          }
          break;

        case 'message':
          customReceiveHook('android', e);
          break;

        case 'error':
          log('onNotificationGCM ERROR: ' + e.msg);
          app.handleError(e.msg, true);
          break;

        default:
          log('EVENT -> Unknown, an event was received and we do not know what it is');
          break;
        }
      };

      if (app.common.isAndroid()) {
        var successHandler = function() {
          log('PUSH: =================> ANDROID PUSH SUCCESS');
        };
        opts = {
          'senderID': '231725508602', // XXX not public?
          'ecb':      'onNotificationGCM'
        };

        app.pushNotification.register(successHandler, errorHandler, opts);
      }
      else if(app.common.isIOS()) {
        var tokenHandler = function(result) {
          log('PUSH: ==> IOS PUSH SUCCESS -> token: ' + result);

          // "Your iOS push server needs to know the token before
          // it can push to this device..."
          setTimeout(function() {
            sendTokenToServer(result);
          }, 1000);
        };

        opts = {
          'badge': 'true',
          'sound': 'true',
          'alert': 'true',
          'ecb':   'onNotificationAPN'
        };

        // am Besten die apple docs
        log('#register call now................................................');
        // return app.pushNotification.register(tokenHandler, errorHandler, opts);

        var unregisterErrHandler = function(a, b) {
          log('====== UNREGISTER ERROR ======');
          log(a);
          log(b);
          app.pushNotification.register(tokenHandler, errorHandler, opts);
        };

        var unregisterHandler = function(a, b) {
          log('====== UNREGISTER FIRST ======');
          log(a);
          log(b);

          log('=========> REGISTERING IOS PUSH...');
          app.pushNotification.register(tokenHandler, errorHandler, opts);
        };

        // "Since such invalidations are beyond your control, its
        // recommended that, in a production environment, that you
        // have a matching unregister() call, for every call to register(),
        // and that your server updates the devices' records each time."
        app.pushNotification.unregister(unregisterHandler, unregisterErrHandler);
      }
    },

    /**
     * Unregister push on "deauthenticate".
     *
     * Note that we delete ALL apn tokens or gcm reg ids on server side
     */
    unregisterPUSHNotifications: function(options) {
      if(!window.plugins || !window.plugins.pushNotification) {
        return false;
      }

      if(!app.pushNotification) {
        return false;
      }

      app.pushNotification = null;

      var noop = function() {};

      options.sendToken({delete_push_tokens: true});

      window.plugins.pushNotification.unregister(noop, noop);
    }
  };
})

/**
 * Responsible for all AJAX based logic
 */
.factory('Backend', function($http, PushNotificationHelpers /*, $resource*/) {
  // configure localforage
  localforage.config({
    name: 'AtOneGo App'
  });

  // TODO
  var BASE_URL = 'https://atonego-mwager.rhcloud.com/';

  function doReq(options) {
    return $http({
        url:     options.url,
        method:  options.method || 'GET',
        headers: options.headers || {},
        // {
        //   // 'Authorization': 'Basic dGVzdDp0ZXN0',
        //   // 'Content-Type': 'application/x-www-form-urlencoded'
        //   // 'Content-Type': 'application/json'
        // },
        // cache: false,
        data: options.data || {}
      }).success(function(data/*, status*/) {
        // log('success', arguments)
        options.done(null, data);
      }).error(function(err/*, status*/) {
        // log('error', arguments)
        options.done(err);
      });
  }

  return {
    /**
     * Does the login against the REST API
     */
    doLogin: function(e, p, cb) {
      return doReq({
        url: BASE_URL + 'api/v1/login',
        method: 'POST',
        data: {
          email:   e,
          password:p
        },
        done: function(err, data) {
          cb(err, data);
        }
      });
    },

    setAuthenticated: function(userJSON) {
      var self = this;
      // XXX ...
      // app.todolists.reset();
      // app.todolists.add(lists);

      // update user's language
      // app.user.set('lang', userJSON.lang, {silent: true});
      // app.changeLang(userJSON.lang ? userJSON.lang : app.lang);

      // XXX
      // if(!userJSON.lang) {
      //     userJSON.lang = app.lang;
      // }

      // init push notifications
      if(!app.isLoggedIn) {
        PushNotificationHelpers.initAndRegisterPushNotifications({
          success: function() {
            log('PUSH SUCCESS');
          },
          error: function() {
            log('push init error');
          },
          receivePush: function(platform, evnt) {
            log('receive push', arguments);

            if(platform === 'ios') {
              if (evnt.alert) {
                window.alert(evnt.alert);
                // XXX common.vibrate(500, app.user.get('notify_settings'));
                // show a short notify and add the message
                // to the activity collection
                // app.common.notify(evnt.alert);
              }

              if (evnt.badge) {
                app.pushNotification.setApplicationIconBadgeNumber(function success() {
                  // log('ok set the badge......'); // XXX TODO raus
                }, function error(e) { log(e); }, evnt.badge);
              }
            }
            else if(platform === 'android') {
              var msg = evnt && evnt.payload ? evnt.payload.message : 'no message';

              // if the foreground flag is set, this notification happened while we were  in the foreground.
              // you might want to play a sound to get the user's attention, throw up a   dialog, etc.
              if (evnt.foreground || evnt.coldstart) {
                window.alert(msg);

                // XXX
                // app.common.vibrate(500, app.user.get('notify_settings'));
              }
            }
          },
          sendToken: function(data) {
            data._id = app.user._id;
            self.__sendTokenToServer(data, function(err, data) {
              log('token sent? ', err, data);
            });
          }
        });
      }

      if(userJSON.API_TOKEN) {
        this.__setUser(userJSON);

        // persist
        localforage.setItem('user', userJSON);
        log('persisted user: ', userJSON)

        app.isLoggedIn = true;
      }
      else {
        log('setAuth ERROR: ', app.user);
      }
    },

    // XXX see aog..?
    deauthenticate: function() {
      var self = this;

      // MUST be called before we reset the user!
      PushNotificationHelpers.unregisterPUSHNotifications({
        sendToken: function(data) {
          data._id = app.user._id;
          self.__sendTokenToServer(data, function(err, data) {
            log('token unregistered from server? ', err, data);
          });
        }
      });
    },

    /**
     * Send the apn token or ios device token to the server
     */
    __sendTokenToServer: function(data, cb) {
      var authStr  = 'Basic ' +
        app.common.base64Encode('AtOneGo' + ':' + app.API_TOKEN);

      return doReq({
        url: BASE_URL + 'api/v1/users/' + data._id,
        method: 'PATCH',
        data: data,
        headers: {
          'Authorization': authStr
        },
        done: function(err, data) {
          cb(err, data);
        }
      });
    },

    __setUser: function(userJSON) {
      // ##### API ACCESS TOKEN #####
      // der token muss nun bei jedem weiteren request mitgehn!
      app.API_TOKEN  = userJSON.API_TOKEN;

      // remember user
      app.user = userJSON;
    },

    /**
     * Try to load the user on the app launch
     */
    loadUser: function(cb) {
      var self = this;

      // XXX encrypt key and value in the storage!
      localforage.getItem('user', function(err, userJSON) {
        self.__setUser(userJSON);

        cb(err, userJSON);
      });
    },

    /**
     * If we are logged in (api token from storage)
     * then we just fetch the user from the server
     */
    fetchUser: function(userID, cb) {
      // TODO global!
      // "token based" authentication
      var authStr  = 'Basic ' +
        app.common.base64Encode('AtOneGo' + ':' + app.API_TOKEN);

      return doReq({
        url: BASE_URL + 'api/v1/users/' + userID,
        method: 'GET',
        headers: {
          'Authorization': authStr
        },
        done: function(err, data) {
          cb(err, data);
        }
      });
    },

    /**
     * Fetch all todos of a list
     */
    fetchTodosOfList: function(listID, cb) {
      // TODO global!
      // "token based" authentication
      var authStr  = 'Basic ' +
        app.common.base64Encode('AtOneGo' + ':' + app.API_TOKEN);

      log('fetching todos of list: ' + listID);

      return doReq({
        url: BASE_URL + 'api/v1/todos?list_id=' + listID,
        method: 'GET',
        headers: {
          'Authorization': authStr
        },
        done: function(err, data) {
          cb(err, data);
        }
      });
    },

    /**
     * POST a todo
     */
    createTodo: function(todo, cb) {
      log('createTodo: ', todo)

      // TODO global!
      // "token based" authentication
      var authStr  = 'Basic ' +
        app.common.base64Encode('AtOneGo' + ':' + app.API_TOKEN);

      var data = todo; // _.pick(todo, 'title', 'completed');

      return doReq({
        url: BASE_URL + 'api/v1/todos',
        method: 'POST',
        headers: {
          'Authorization': authStr
        },
        data: data,
        done: function(err, data) {
          cb(err, data);
        }
      });
    },

    /**
     * PUT(or PATCH?) a todo
     */
    updateTodo: function(todo, cb) {
      log('update todo: ', todo)

      // TODO global!
      // "token based" authentication
      var authStr  = 'Basic ' +
        app.common.base64Encode('AtOneGo' + ':' + app.API_TOKEN);

      // TODO was noch
      var data = _.pick(todo, 'title', 'completed', 'notice');

      return doReq({
        url: BASE_URL + 'api/v1/todos/' + todo._id,
        method: 'PATCH',
        headers: {
          'Authorization': authStr
        },
        data: data,
        done: function(err, data) {
          cb(err, data);
        }
      });
    },

    deleteCompletedTodos: function(list, cb) {
      // TODO global!
      // "token based" authentication
      var authStr  = 'Basic ' +
        app.common.base64Encode('AtOneGo' + ':' + app.API_TOKEN);


      var completedTodos = list.todos.filter(function(t) {
        return t.completed === true;
      });
      var uncompletedTodos = list.todos.filter(function(t) {
        return t.completed === false;
      });
      // update ui !!!
      list.todos = uncompletedTodos;

      var todo_ids = [];
      completedTodos.forEach(function(t) {
        todo_ids.push(t._id);
      });

      var data = {
        todo_ids: todo_ids
      };

      return doReq({
        url: BASE_URL + 'api/v1/todos',
        method: 'DELETE',
        headers: {
          'Authorization': authStr
        },
        data: data,
        done: function(err, data) {
          cb(err, data);
        }
      });
    },

    /**
     * POST or PUT(or PATCH?) a list
     */
    createOrUpdateList: function(isCreate, list, cb) {
      log('update list: ', list)

      // XXX global!
      // "token based" authentication
      var authStr  = 'Basic ' +
        app.common.base64Encode('AtOneGo' + ':' + app.API_TOKEN);

      // XXX was noch
      var data = list; // _.pick(todo, 'title', 'completed');

      return doReq({
        url: BASE_URL + (isCreate ? 'api/v1/lists' : 'api/v1/lists/' + list._id),
        method: isCreate ? 'POST' : 'PATCH',
        headers: {
          'Authorization': authStr
        },
        data: data,
        done: function(err, data) {
          cb(err, data);
        }
      });
    },
  };
  // return $resource(url,
  //   {email:'test@test.de', password:'xxx'}, {
  //   charge: {method:'POST', params:{charge:true}}
  // });
});
