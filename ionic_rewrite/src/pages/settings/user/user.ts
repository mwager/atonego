import { Component, OnDestroy } from '@angular/core';

import { PersistanceService } from '../../../app/services/persistance.service';

@Component({
  selector: 'page-user',
  templateUrl: 'user.html'
})
export class UserPage implements OnDestroy {

  public user: any = {notify_settings: {email: false}};

  constructor(
    private persistanceService: PersistanceService
  ) {
    persistanceService.loadUser()
    .then((user) => {
      this.user = user;
    });
  }

  ngOnDestroy() {
    console.log("ngOnDestroy", this.user)

    this.persistanceService.updateUser(this.user);
  }
}
