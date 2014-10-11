'use strict';

/**
 * The app module - contains:
 * - all require calls
 * - global definitions
 * - angular root module definition with app-init code and route definitions
 */

/*global localforage: true, angular:true*/
// require all needed scripts here?
require('../lib/ionic/js/ionic.bundle.js');
// require('../lib/underscore/underscore.js');

// TODO: https://github.com/mozilla/localForage/pull/203
// LF is globally included in index.html yet...
// var localForage = require('../lib/localforage/src/localforage.js');

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'atonego' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'atonego.controllers' is found in controllers.js
// NOTE: we need to declare a global app var before requireing the services & controllers!
window.app = angular.module('atonego', ['ionic', 'atonego.controllers'])

// NOW require
require('./services.js');
require('./controllers.js');



// global log helper
window.log = function() {
  if(!window.console) {
    return;
  }
  console.log.apply(console, arguments)
};

// Ionic Starter App
// app global init code
app.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      window.cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      // org.apache.cordova.statusbar required
      window.StatusBar.styleDefault();
    }
  });
});

// define the app-routes
app.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

    .state('app', {
      url: '/app',
      abstract: true,
      templateUrl: 'templates/menu.html',
      controller: 'MenuCtrl'
    })

    .state('app.search', {
      url: '/search',
      views: {
        'menuContent' :{
          templateUrl: 'templates/search.html'
        }
      }
    })

    .state('app.help', {
      url: '/help',
      views: {
        'menuContent' :{
          templateUrl: 'templates/help.html'
        }
      }
    })

   /* .state('app.todolists', {
      url: '/todolists',
      views: {
        'menuContent' :{
          templateUrl: 'templates/todolists.html',
          controller: 'TodolistsCtrl'
        }
      }
    })*/

    .state('app.single', {
      url: '/todolists/:listID',
      views: {
        'menuContent' :{
          templateUrl: 'templates/todolist.html',
          controller: 'TodolistCtrl'
        }
      }
    });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/help');
});
