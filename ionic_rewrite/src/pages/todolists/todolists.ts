import { Component } from '@angular/core';

import { StorageService } from '../../app/services/storage.service';

@Component({
  selector: 'page-todolists',
  templateUrl: 'todolists.html'
})
export class TodolistsPage {
  public todolists;

  constructor(
    private storageService: StorageService
  ) {
    this.storageService.fetchTodolists()
    .then((todolists) => {
      console.log("todolists", todolists);
      this.todolists = todolists;
    });
  }

  public navigateToList(todolist) {
    console.log(todolist)
  }
}
