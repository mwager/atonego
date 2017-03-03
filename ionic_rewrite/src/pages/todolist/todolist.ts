import { Component } from '@angular/core';
import { NavParams, NavController, ToastController } from 'ionic-angular';

import { StorageService } from '../../app/services/storage.service';
import { PersistanceService } from '../../app/services/persistance.service';

import { TodoPage } from '../todo/todo';

@Component({
  selector: 'page-todolist',
  templateUrl: 'todolist.html'
})
export class TodolistPage {
  public todolist: any = {todos: []};
  public todo: any = {};

  constructor(
    private navController: NavController,
    private navParams: NavParams,
    private toastCtrl: ToastController,
    private persistanceService: PersistanceService
  ) {
    this.todolist = this.navParams.get('todolist');

    // Angular > 2 does not include filter/sort pipes:
    // see https://angular.io/docs/ts/latest/guide/pipes.html#!#no-filter-pipe
    // "The Angular team and many experienced Angular
    // developers strongly recommend moving filtering
    // and sorting logic into the component itself."
    // TODO: better + specs (POC!)
    this.todolist.todos.sort((a, b) => {
      return b.updated_at - a.updated_at;
    });
  }

  public createTodo() {
    this.todo.list_id = this.todolist._id;
    this.todo.completed = false;

    this.persistanceService.createOrEditTodo(this.todo)
    .then((response) => {
      let createdTodo = response.json();

      // push as first element:
      this.todolist.todos.unshift(createdTodo);

      this.todo = {};
    })
    .catch((errorResponse) => {
      this.todo = {};

      console.error('Error: ', errorResponse);

      this.toastCtrl.create({
        message: 'Error saving todo',
        position: 'top',
        showCloseButton: true
      }).present();
    });
  }

  public navigateToTodo(todo: any) {
    this.navController.push(TodoPage, {
      todo: todo
    });
  }
  public navigateToTodolistSettings() {
    console.log("TODO...", this.todolist)
  }
}
