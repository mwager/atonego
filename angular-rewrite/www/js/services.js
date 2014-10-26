'use strict';

/**
 * File contains all services
 */

// TODO testing?
// TODO module definition only once app wide?!
window.app

.factory('Todolists', ['$window', function(win) {
  var STORAGE_KEY = 'todolists';
  var LISTS = [];

  var persistAllLists = function() {
    // persist all lists at once
    localforage.setItem(STORAGE_KEY, LISTS, function(err) {
      log('persisted ALL lists', LISTS, err);
    });
  }

  // find a list by id in the LISTS array (TODO performance/data structures?)
  function findList(lists, id) {
    var listFound;

    lists.some(function(l) {
      log(l._id, id)

      if(l._id === id) {
        listFound = l;
        return true; // break loop
      }
    });
    return listFound;
  }

  // remove a list by id in the LISTS array (TODO performance/data structures?)
  function removeList(id) {
    var idx = 0;
    LISTS.some(function(l) {
      if(l.id === id) {
        LISTS.splice(idx, 1);
        return true; // break loop
      }
      idx++;
    });
  }

  /**
   * Update a list entry. we remove it and add it...
   */
  function updateList(list) {
    removeList(list.id);
    LISTS.push(list);
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

/**
 * Responsible for all AJAX based logic
 */
.factory('Backend', function($http /*, $resource*/) {
  // configure localforage
  localforage.config({
    name: 'AtOneGo App'
  });

  // TODO
  var BASE_URL = 'https://atonego-mwager.rhcloud.com/';

  return {
    /**
     * Does the login against the REST API
     */
    doLogin: function(e, p, cb) {
      return $http({
        url:    BASE_URL + 'api/v1/login',
        method: 'POST',
        headers: {
          // 'Authorization': 'Basic dGVzdDp0ZXN0',
          // 'Content-Type': 'application/x-www-form-urlencoded'
          // 'Content-Type': 'application/json'
        },
        cache: false,
        data: {
          email:   e,
          password:p
        }
      }).success(function(data/*, status*/) {
        // log('success', arguments)
        cb(null, data);
      }).error(function(err/*, status*/) {
        // log('error', arguments)
        cb(err);
      });
    },

    setAuthenticated: function(userJSON) {
      // ##### API ACCESS TOKEN #####
      // der token muss nun bei jedem weiteren request mitgehn!
      app.API_TOKEN  = userJSON.API_TOKEN;
      app.isLoggedIn = true;

      // persist
      localforage.setItem('user', userJSON);
      log('persisted user: ', userJSON)

      // app.todolists.reset();
      // app.todolists.add(lists);

      // update user's language
      // app.user.set('lang', userJSON.lang, {silent: true});
      // app.changeLang(userJSON.lang ? userJSON.lang : app.lang);

      // TODO
      // if(!userJSON.lang) {
      //     userJSON.lang = app.lang;
      // }

      // remember user
      app.user = userJSON;
      // app.ls.save('user', userJSON) // ? TODO localForage!
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

      return $http({
        url:    BASE_URL + 'api/v1/users/' + userID,
        method: 'GET',
        headers: {
          'Authorization': authStr
        },
        cache: false,
        data: {

        }
      }).success(function(data/*, status*/) {
        // log('success', arguments)
        cb(null, data);
      }).error(function(err/*, status*/) {
        // log('error', arguments)
        cb(err);
      });
    }
  };
  // return $resource(url,
  //   {email:'test@test.de', password:'xxx'}, {
  //   charge: {method:'POST', params:{charge:true}}
  // });
})

.factory('TodoAPI', function(/*$http*/) {
  return {
    // TODO
    updateTodo: function(todo) {

    }
  }
});
