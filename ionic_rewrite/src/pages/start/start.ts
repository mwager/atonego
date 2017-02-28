import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import { LoginPage } from '../login/login';
import { SignupPage } from '../signup/signup';

@Component({
  selector: 'page-start',
  templateUrl: 'start.html'
})
export class StartPage {

  constructor(private navController: NavController) {
  }

  public navigateToLogin() {
    this.navController.push(LoginPage);
  }

  public navigateToSignup() {
    this.navController.push(SignupPage);
  }
}
