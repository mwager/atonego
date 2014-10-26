'use strict';
var _ = require('../lib/underscore/underscore.js');

// TODO utils||own file
// Generate four random hex digits.
function S4() {
  return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
}
// Generate a pseudo-GUID by concatenating random hexadecimal.
function guid() {
  return (S4()+S4()+'-'+S4()+'-'+S4()+'-'+S4()+'-'+S4()+S4()+S4());
}



/**
 * Start the module
 */
angular.module('atonego.controllers', [])

/**
 * Controller for the side-menu
 */
.controller('MenuCtrl', function($scope, $ionicModal, $state, $timeout, Backend) {
  // Form data for the login modal
  $scope.loginData = {};

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Load the lists from storage..
  // Todolists.getLists(function(err, lists) {
  //   $scope.todolists = lists;
  // });
  // Load the lists from server..
  localforage.getItem('user', function(err, user) {
    if(err || !user) {
      return log('no initial data found', err, user);
    }

    $scope.todolists = user.todolists;

    Backend.setAuthenticated(user);

    Backend.fetchUser(user._id, function(err, user) {
      if(err) {
        return log('fetch user error: ', err);
      }

      // if(user.todolists.length > 0) {
      //   $state.go('app.single', {listID: user.todolists[0]._id})
      // }

      Backend.setAuthenticated(user);
      $scope.todolists = user.todolists;
    });
  })


  // --- scope methods ---
  $scope.clearAll = function() {
    $scope.todolists = [];
    // Todolists.clearAll();
    window.location.href = '#app/help';
  }

  $scope.deleteList = function() {
    // TODO!?!?!? how to?
    // $timeout(function() {
    //   delete $scope.lists[id];
    // })

    // Todolists.deleteListByID(this.list.id);

    // show the menu? go to startpage?
    // TODO angular.navigate() ?
    window.location.href = '#app';
  }

  $scope.addList = function(e) {
    if(e.keyCode === 13) {
      // if(!this.list) {
      //   // console.error('NO LIST!')
      //   return
      // }
      var id = guid();
      this.list.id = id;

      // add the list to the local store
      // Todolists.addList(this.list);

      log('$scope.todolists', $scope.todolists)

      // .. and re-render the list of todos
      // hmmm somehow this already happens if we change the LISTS array in the factory
      // $scope.todolists[id] = this.list;

      // ...and navigate to the list view (TODO)
      //window.location.href = '#app/todolists/' + id;

      this.list = null;
    }
  }

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.hide();
  };

  // Open the login modal
  $scope.login = function() {
    $scope.modal.show();
  };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    console.log('Doing login...', $scope.loginData);

    Backend.doLogin($scope.loginData.username, $scope.loginData.password, function(err, data) {
      if(!err) {
        // $timeout(function() {}, 1000);
        $scope.closeLogin();

        // hier kommt der user mit all seinen todolisten und deren todos
        // save user and todolists
        var lists = [];
        _.each(data.todolists, function (list) {
          lists.push(list);
        });
        // set scope
        $scope.todolists = lists;

        log('OK authenticated!!!')
        Backend.setAuthenticated(data);
      }
    });
  };
})

/* using menu ctrl for managing the todolists in the menu
.controller('TodolistsCtrl', function($scope) {
  console.log($scope)
  $scope.todolists = [
    { title: 'Einkauf', id: 1 },
    { title: 'Musik', id: 2 }
  ];
})*/

// controller for the todos of ONE list
.controller('TodolistCtrl', function($scope, $ionicModal, $state, $stateParams, $timeout, Todolists, Backend) {
  // init:
  $scope.loadingMsg = 'loading todos...'

  Todolists.getListByID($stateParams.listID, function(err, list) {
    if(!list) {
      return $state.go('app.help'); // TODO!?
    }

    // re-fetch todos from server
    Backend.fetchTodosOfList($stateParams.listID, function(err, todos) {
      // nice, this updates the ui (-:
      $scope.list.todos = todos;
    });

    // must wrap into $apply() so angular knows to update the DOM after the
    // list was fetched
    // @see http://jimhoskins.com/2012/12/17/angularjs-and-apply.html
    // $scope.$apply(function () {
    // so, use $timeout(fn) to automatically wrap ya code into $apply() to prevent errors
    // calling $apply() within an $apply()
    $timeout(function() {
      $scope.loadingMsg = ''
      $scope.list = list || {title: '!??! list ' + $stateParams.listID + ' not found', todos: []}
    });
  });

  $scope.addTodo = function(e) {
    if(e.keyCode !== 13) {
      return;
    }

    // add the todo to the list
    $scope.list.todos.push(this.todo);

    // create the lits on the server
    this.todo.list_id = $stateParams.listID;
    Backend.createTodo(this.todo, function(/*err, done*/) {

    });

    this.todo = null;
  }

  // Triggered in the login modal to close it
  $scope.closeModal = function() {
    if($scope.modal) {
      $scope.modal.hide();
      setTimeout(function() {
        $scope.modal.remove();
        $scope.todo = null;
      }, 10);
    }
  };

  $scope.openTodoModal = function(todo) {
    // pass data "to the modal" via scope
    $scope.todo = todo;

    // Create the detail modal that we will use later
    $ionicModal.fromTemplateUrl('templates/todo-details.html', {
      scope: $scope
    }).then(function(modal) {
      modal.show();
      $scope.modal = modal;
    });
  };

  // on change the checkbox we need to persist!
  $scope.todoChange = function(todo) {
    Backend.updateTodo(todo, function(/*err, done*/) {

    });

    // note that the $scope.list.todos.. will be changed automatically!
    log('updating todo ', todo.completed, $scope.list.todos)
    // so just: update the lists in the store
    // Todolists.updateList($scope.list);
  };

  $scope.deleteCompleted = function() {
    // TODO $scope.list: remove completed !??!
    Backend.deleteCompletedTodos($scope.list, function() {

    });
  };
})

// edit a list (title and participants..)
.controller('TodolistEditCtrl', function($scope, $stateParams, $timeout, Todolists) {
  $scope.list = {title: 'loading..'}; // TODO

  Todolists.getListByID($stateParams.listID, function(err, list) {
    log('GOT LIST TO EDIT: ' , list)

    // must wrap into $apply() so angular knows to update the DOM after the list was fetched
    // @see http://jimhoskins.com/2012/12/17/angularjs-and-apply.html
    // $scope.$apply(function () {
    // so, use $timeout(fn) to automatically wrap ya code into $apply() to prevent errors
    // calling $apply() within an $apply()
    $timeout(function() {
      $scope.list = list;
    });
  });
})
