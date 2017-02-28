import { Component, Inject } from '@angular/core';
import { NavController, LoadingController, ToastController } from 'ionic-angular';

import { AuthService } from '../../app/services/auth.service';

import { TodolistsPage } from '../todolists/todolists';

@Component({
  selector: 'page-signup',
  templateUrl: 'signup.html'
})
export class SignupPage {
  user: any = {};

  constructor(
    private authService: AuthService,
    private navController: NavController,
    private loadingController: LoadingController,
    private toastCtrl: ToastController
  ) {}

  public doSignup() {
    event.preventDefault();

    let loader = this.loadingController.create({
      content: 'Please wait...'
    });

    loader.present();

    this.authService.signup(
      this.user.displayName,
      this.user.email,
      this.user.password
    )
    .then(() => {
      loader.dismiss();
    })
    .catch(() => {
      loader.dismiss();

      this.toastCtrl.create({
        message: 'Something is is wrong with your email or password...',
        position: 'top',
        showCloseButton: true
      })
      .present();
    });
  }
}
