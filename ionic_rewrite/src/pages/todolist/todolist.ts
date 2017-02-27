import { Component } from '@angular/core';
import { NavParams } from 'ionic-angular';

import { StorageService } from '../../app/services/storage.service';

@Component({
  selector: 'page-todolist',
  templateUrl: 'todolist.html'
})
export class TodolistPage {
  public todolist = {todos: []};

  constructor(
    private navParams: NavParams,
    private storageService: StorageService
  ) {
    this.todolist = this.navParams.get('todolist');
  }
}
