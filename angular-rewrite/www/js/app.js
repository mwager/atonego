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
require('../lib/angular-resource/angular-resource.js');
// require('../lib/underscore/underscore.js');

// TODO: https://github.com/mozilla/localForage/pull/203
// LF is globally included in index.html yet...
//var localForage = require('../lib/localforage/dist/localforage.js');

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'atonego' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'atonego.controllers' is found in controllers.js
// NOTE: we need to declare a global app var before requireing the services & controllers!
window.app = angular.module('atonego', ['ionic', 'ngResource', 'atonego.controllers'])

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


// TODO
app.ls = new LocalStorage();



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

    // testing... (TODO)
    if(window.plugin && window.plugin.notification) {
      log("adding local notification...")
      window.plugin.notification.local.add({
        id:         "EAF55R",  // A unique id of the notifiction
        date:       new Date( new Date().getTime() + 1000*5 ), // + 5 secs    // This expects a date object
        message:    'test message',  // The message that is displayed
        title:      'test title',  // The title of the message
        // repeat:     String,  // Either 'secondly', 'minutely', 'hourly', 'daily', 'weekly', 'monthly' or 'yearly'
        badge:      2,  // Displays number badge to notification
        // sound:      String,  // A sound to be played
        // json:       String,  // Data to be passed through the notification
        // autoCancel: Boolean, // Setting this flag and the notification is automatically canceled when the user clicks it
        // ongoing:    Boolean, // Prevent clearing of notification (Android only)
      }, function callback() {
          log("OK plugin add done...........")
      } /*,scope of callback*/);
    }
  });
});

// global http config
// enable CORS
app.config(['$httpProvider', function($httpProvider) {
      $httpProvider.defaults.useXDomain = true;
      delete $httpProvider.defaults.headers.common['X-Requested-With'];
  }
]);

// define the app-routes
app.config(function($stateProvider, $urlRouterProvider) {
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
