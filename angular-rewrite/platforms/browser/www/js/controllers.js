'use strict';
var _ = require('../lib/underscore/underscore.js');

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
.controller('MenuCtrl', function($scope, $ionicModal, $timeout, Todolists) {
  // Form data for the login modal
  $scope.loginData = {};

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Load the lists from storage..
  Todolists.getLists(function(err, lists) {
    $scope.todolists = lists;
  });

  // --- scope methods ---
  $scope.clearAll = function() {
    $scope.todolists = [];
    Todolists.clearAll();
    window.location.href = '#app/help';
  }

  $scope.deleteList = function() {
    // TODO!?!?!? how to?
    // $timeout(function() {
    //   delete $scope.lists[id];
    // })

    Todolists.deleteListByID(this.list.id);

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
      Todolists.addList(this.list);

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
    console.log('Doing login', $scope.loginData);

    // Simulate a login delay. Remove this and replace with your login
    // code if using a login system
    $timeout(function() {
      $scope.closeLogin();
    }, 1000);
  };
})

/*.controller('TodolistsCtrl', function($scope) {
  console.log($scope)
  $scope.todolists = [
    { title: 'Einkauf', id: 1 },
    { title: 'Musik', id: 2 }
  ];
})*/

.controller('TodolistCtrl', function($scope, $ionicModal, $stateParams, $timeout, Todolists) {
  // init:
  $scope.loadingMsg = 'loading todos...'

  Todolists.getListByID($stateParams.listID, function(err, list) {
    log('GOT LIST: ' , list)

    // must wrap into $apply() so angular knows to update the DOM after the list was fetched
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

    var id = guid();
    this.todo.id = id;
    this.todo.completed = false;

    log('LIST IS: ', $scope.list)

    // add the todo to the list
    $scope.list.todos.push(this.todo);

    // update the lists in the store
    Todolists.updateList($scope.list);

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
    // note that the $scope.list.todos.. will be changed automatically!
    log('updating todo ', todo.completed, $scope.list.todos)
    // so just: update the lists in the store
    Todolists.updateList($scope.list);
  };

  $scope.deleteCompleted = function() {
    log("OK", $scope.list.todos)
    Todolists.deleteCompletedTodosOfList($scope.list);
  };
})