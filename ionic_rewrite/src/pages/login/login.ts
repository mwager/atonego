import { Component, Inject } from '@angular/core';
import { LoadingController, ToastController } from 'ionic-angular';

import { AuthService } from '../../app/services/auth.service';

@Component({
  selector: 'page-login',
  templateUrl: 'login.html'
})
export class LoginPage {
  user: any = {};

  constructor(
    private authService: AuthService,
    private loadingController: LoadingController,
    private toastCtrl: ToastController
  ) {}

  public doLogin() {
    event.preventDefault();

    let loader = this.loadingController.create({
      content: 'Please wait...'
    });

    loader.present();

    this.authService.login(this.user.email, this.user.password)
    .then(() => {
      loader.dismiss();
    })
    .catch((/*errorResponse*/) => {
      loader.dismiss();

      // console.error('error', errorResponse);

      this.toastCtrl.create({
        message: 'Something is is wrong with your email or password...',
        position: 'top',
        showCloseButton: true,
      }).present();
    });
  }

  public doSignup() {
    event.preventDefault();
    this.authService.signup(/* . hardcoded... ..*/);
  }
}
