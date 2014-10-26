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

  // configure localforage
  localforage.config({
    name: 'AtOneGo App'
  });

  var persistAllLists = function() {
    // persist all lists at once
    localforage.setItem(STORAGE_KEY, LISTS, function(err) {
      log('persisted ALL lists', LISTS, err);
    });
  }

  // find a list by id in the LISTS array (TODO performance/data structures?)
  function findList(id) {
    var listFound;
    LISTS.some(function(l) {
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
    clearAll: function() {
      localforage.clear();
    },

    // TODO merge?
    setLists: function(lists) {
      LISTS = lists;
      persistAllLists();
    },

    addList: function(list) {
      list.dirty = true;
      list.todos = [];

      LISTS.push(list);

      persistAllLists();
    },

    updateList: function(list) {
      updateList(list);

      persistAllLists();
    },

    getLists: function(done) {
      log('fetching lists...');
      localforage.getItem(STORAGE_KEY, function(data, lists) {
        log('fetched lists:', lists);
        LISTS = lists || [];
        done(null, LISTS);
      });
    },

    getListByID: function(id, done) {
      var list = findList(id);
      if(list) {
        return done(null, list);
      }
      else {
        localforage.getItem(STORAGE_KEY, function(data, lists) {
          LISTS = lists || [];
          list = findList(id);

          done(null, list);
        });
      }
    },

    deleteCompletedTodosOfList: function(list) {
      var l = findList(list.id);
      if(!l) {
        return;
      }
      var todos = [];
      l.todos.forEach(function(t) {
        if(!t.completed) {
          todos.push(t);
        }
      });
      l.todos = todos;
      updateList(l);
      persistAllLists();
    },

    deleteListByID: function(id) {
      removeList(id);
      persistAllLists();
    }
  }
}])

.factory('Auth', function($http, $resource) {
  // TODO see main.js - global $http conf!
  // var username = 'AtOneGo';
  // var authStr  = 'Basic ' + common.base64Encode(username + ':' + app.API_TOKEN);
  // xhr.setRequestHeader('Authorization', authStr);
  // xhr.setRequestHeader('Content-Language', app.lang || 'en');

  return {
    // TODO cleanup
    doLogin: function(e, p, cb) {
      var url = 'https://atonego-mwager.rhcloud.com/api/v1/login';
      // log(url, $http)

      return $http({
        url:url,
        method:'POST',
        headers: {
        // 'Authorization': 'Basic dGVzdDp0ZXN0',
          // 'Content-Type': 'application/x-www-form-urlencoded'
          'Content-Type': 'application/json'
        },
        cache: false,
        data: {
          email:   e,
          password:p
        }
      }).success(function(data, status) {
        // log('success', arguments)
        cb(null, data);
      }).error(function(err, status) {
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

.factory('TodoAPI', function($http) {
  return {
    // TODO
    updateTodo: function(todo) {

    }
  }
});
