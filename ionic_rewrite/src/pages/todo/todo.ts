import { Component, OnDestroy } from '@angular/core';
import { NavParams, NavController } from 'ionic-angular';

import { PersistanceService } from '../../app/services/persistance.service';

@Component({
  selector: 'page-todo',
  templateUrl: 'todo.html'
})
export class TodoPage implements OnDestroy {
  public todo: any = {};

  constructor(
    private navParams: NavParams,
    private navController: NavController,
    private persistanceService: PersistanceService
  ) {
    this.todo = this.navParams.get('todo');
  }

  ngOnDestroy() {
    console.log("ngOnDestroy", this.todo)

    // TODO: enough?
    if (this.todo) {
      this.persistanceService.createOrEditTodo(this.todo);
    }
  }

  delete() {
    this.persistanceService.deleteTodo(this.todo);

    // pop leads to ngOnDestroy, so:
    this.todo = null;

    this.navController.pop();
  }
}
