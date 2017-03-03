import { Component, OnDestroy } from '@angular/core';
import { NavParams } from 'ionic-angular';

import { PersistanceService } from '../../app/services/persistance.service';

@Component({
  selector: 'page-todo',
  templateUrl: 'todo.html'
})
export class TodoPage implements OnDestroy {
  public todo: any = {};

  constructor(
    private navParams: NavParams,
    private persistanceService: PersistanceService
  ) {
    this.todo = this.navParams.get('todo');
  }

  ngOnDestroy() {
    console.log("ngOnDestroy", this.todo)

    // TODO: enough?
    this.persistanceService.createOrEditTodo(this.todo);
  }
}
