import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import { PersistanceService } from '../../app/services/persistance.service';

import { TodolistPage } from '../todolist/todolist';
import { SettingsPage } from '../settings/settings';

@Component({
  selector: 'page-todolists',
  templateUrl: 'todolists.html'
})
export class TodolistsPage {
  public todolists;

  constructor(
    private navController: NavController,
    private persistanceService: PersistanceService
  ) {
    this.persistanceService.fetchTodolists()
    .then((todolists) => {
      this.todolists = todolists;
    });
  }

  public navigateToList(todolist) {
    this.navController.push(TodolistPage, {
      todolist: todolist
    });
  }

  public navigateToSetings() {
     this.navController.push(SettingsPage);
  }
}
