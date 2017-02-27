import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar, Splashscreen } from 'ionic-native';

import { StorageService } from './services/storage.service';
import { AuthService } from './services/auth.service';

import { StartPage } from '../pages/start/start';
import { LoginPage } from '../pages/login/login';
import { TodolistsPage } from '../pages/todolists/todolists';

@Component({
  template: `<ion-nav [root]="rootPage"></ion-nav>`
})
export class MyApp {
  rootPage;

  constructor(
    private authService: AuthService,
    private storageService: StorageService,
    platform: Platform
  ) {
    this.initializeServices();

    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      StatusBar.styleDefault();
      Splashscreen.hide();
    });
  }

  private initializeServices() {
    this.authService.onLoginSuccess.subscribe(() => {
      this.rootPage = TodolistsPage;
    });

    this.authService.checkIfUserIsAuthenticated()
    .then(() => {
      this.rootPage = TodolistsPage;
    })
    .catch(() => {
      this.rootPage = StartPage;
    });
  }
}
