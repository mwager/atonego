'use strict';

/**
 * The app module - contains:
 * - all require calls
 * - global definitions
 * - angular root module definition with app-init code and route definitions
 */

// global log helper
window.log = function() {
  if(!window.console) {
    return;
  }
  console.log.apply(console, arguments)
};

/*global localforage: true, angular:true*/
// require all needed scripts here?
require('../lib/ionic/js/ionic.bundle.js');
require('../lib/angular-resource/angular-resource.js');
// var _ = require('../lib/underscore/underscore.js');
// TODO: https://github.com/mozilla/localForage/pull/203
// LF is globally included in index.html yet...
// var localForage = require('../lib/localforage/src/localforage.js');

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'atonego' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'atonego.controllers' is found in controllers.js
// NOTE: we need to declare a global app var before requireing the services & controllers!
window.app = angular.module('atonego', ['ionic', 'ngResource', 'atonego.controllers'])

// NOW require
require('./services.js');
require('./controllers.js');

// hmm TODO...
app.common = require('./common.js');


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
      // window.StatusBar.show();
    }
  });
});

// --- global ajax config ---
app.config(['$httpProvider', function($httpProvider) {
  $httpProvider.defaults.headers.common['Content-Language'] = app.lang || 'en';
  $httpProvider.defaults.headers.common['Content-Type'] = 'application/json';

  // if(app.API_TOKEN) {
  //   log('>>>>>> token: ' + app.API_TOKEN)

  //   // "token based" authentication
  //   var authStr  = 'Basic ' + base64Encode('AtOneGo' + ':' + app.API_TOKEN);
  //   $httpProvider.defaults.headers.common.Authorization = authStr;
  // }

  // enable CORS
  $httpProvider.defaults.useXDomain = true;
  delete $httpProvider.defaults.headers.common['X-Requested-With'];
}]);

// define the app-routes
app.config(function($stateProvider, $urlRouterProvider, $httpProvider) {

  $stateProvider

    .state('app', {
      url: '/app',
      abstract: true,
      templateUrl: 'templates/menu.html',
      controller: 'MenuCtrl'
    })

    .state('app.settings', {
      url: '/settings',
      views: {
        'menuContent' :{
          templateUrl: 'templates/settings.html'
        }
      }
    })

    // Hmm?
    // .state('app.start', {
    //   url: '/start',
    //   views: {
    //     'menuContent' :{
    //       templateUrl: 'templates/start.html'
    //     }
    //   }
    // })
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

    // route displays all todos of a list
    .state('app.single', {
      url: '/todolists/:listID',
      views: {
        'menuContent' :{
          templateUrl: 'templates/todolist.html',
          controller: 'TodolistCtrl'
        }
      }
    })
    // route displays all the properties of a list to edit
    .state('app.list', {
      url: '/todolists/:listID/edit',
      views: {
        'menuContent' :{
          templateUrl: 'templates/todolist-edit.html',
          controller: 'TodolistEditCtrl'
        }
      }
    })

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/help');
});


// XXX
app.handleError = function() {
  if(window.console && console.error) {
    console.error(arguments);
  }
};
