import { Component } from '@angular/core';
import { NavParams } from 'ionic-angular';

import { StorageService } from '../../app/services/storage.service';
import { HttpBackendService } from '../../app/services/http-backend.service';

@Component({
  selector: 'page-todolist',
  templateUrl: 'todolist.html'
})
export class TodolistPage {
  public todolist: any = {todos: []};
  public todo: any = {};

  constructor(
    private navParams: NavParams,
    private httpBackendService: HttpBackendService
  ) {
    this.todolist = this.navParams.get('todolist');
  }

  // TODO:
  // 1. backend/storage.addTodo
  // 2. this.todolist = fetchTodolist(this.todolist._id)

  // offline support
  // wir speichern erstmal lokal
  // beim sync werden dann erstmal die lokalen gepostet
  // anschließend ein fetch gemacht
  public createTodo() {
    this.todo.list_id = this.todolist._id

    console.log("POSTING", this.todo)

    this.httpBackendService.createTodo(this.todo)
    .then(() => {
      this.todo = {};
    })
    .catch(() => {

    });
  }
}
