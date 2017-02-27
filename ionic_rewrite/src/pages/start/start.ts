import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import { LoginPage } from '../login/login';

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
  	console.log("TODO");
  	// this.navController.push(SignupPage);
  }
}
