import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import { AuthService } from '../../app/services/auth.service';
import { HelpPage } from '../../pages/help/help';
import { UserPage } from './user/user';

@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html'
})
export class SettingsPage {

  constructor(
    private navController: NavController,
    private authService: AuthService
  ) {

  }

  public navToUser() {
    this.navController.push(UserPage);
  }

  public navToHelp() {
    this.navController.push(HelpPage);
  }

  public logout() {
    this.authService.logout();
  }
}
