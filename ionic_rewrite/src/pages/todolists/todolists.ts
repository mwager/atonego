import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import { StorageService } from '../../app/services/storage.service';
import { AuthService } from '../../app/services/auth.service';

import { TodolistPage } from '../todolist/todolist';

@Component({
  selector: 'page-todolists',
  templateUrl: 'todolists.html'
})
export class TodolistsPage {
  public todolists;

  constructor(
    private navController: NavController,
    private storageService: StorageService,
    private authService: AuthService
  ) {
    this.storageService.fetchTodolists()
    .then((todolists) => {
      console.log("todolists", todolists);
      this.todolists = todolists;
    });
  }

  public logout() {
    this.authService.logout();
  }

  public navigateToList(todolist) {
    this.navController.push(TodolistPage, {
      todolist: todolist
    });
  }
}
