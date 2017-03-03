import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import { StorageService } from '../../app/services/storage.service';
import { AuthService } from '../../app/services/auth.service';

@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html'
})
export class SettingsPage {

  constructor(
    private navController: NavController,
    private storageService: StorageService,
    private authService: AuthService
  ) {

  }

  public logout() {
    this.authService.logout();
  }
}
