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
    localforage.setItem(STORAGE_KEY, LISTS);
  }

  // find a list by id in the LISTS array (TODO performance/data structures?)
  function findList(id) {
    var listFound;
    LISTS.some(function(l) {
      if(l.id === id) {
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
      localforage.getItem(STORAGE_KEY, function(lists) {
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
        localforage.getItem(STORAGE_KEY, function(lists) {
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
}]);
