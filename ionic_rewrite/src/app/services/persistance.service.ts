import { Injectable } from '@angular/core';
import {
  Http,
  Headers,
  RequestOptions
} from '@angular/http';
import 'rxjs/add/operator/toPromise';

import { StorageService } from './storage.service';

import { AppConfig } from '../../shared/app_config';

declare var Connection: any;

/**
 * See specs
 */
@Injectable()
export class PersistanceService {

  constructor(
    private http: Http,
    private storageService: StorageService
  ) {
  }

  // TODO: POST/GET!?
  saveUser(user) {
    return this.storageService.saveUser(user);
  }
  loadUser() {
    return this.storageService.loadUser();
  }
  dropDatabase() {
    return this.storageService.dropDatabase();
  }
  fetchTodolists() {
    return this.storageService.fetchTodolists();
  }

  updateUser(user) {
    let url = AppConfig.API_BASE_URL + 'users/' + user._id;

    let userPatch: any = {
      display_name: user.display_name,
      email: user.email,
      lang: user.lang,
      notify_settings: {
        email: user.notify_settings.email,
        push: true
      }
    }

    if(user.password) {
      userPatch.password = user.password;
    }

    return this.http.patch(url, userPatch)
    .toPromise();
  }

  /**
   * TODO: better offline first:
   *
   * -> have one "persistanceService" which knows http
   * AND storage and keeps it "OFFLINE FIRST"
   *
   * // offline support
    // wir speichern erstmal lokal
    // beim sync werden dann erstmal die lokalen gepostet
    // anschließend ein fetch gemacht
   */
  public createOrEditTodo(todo: any): Promise<any> {
    let url = AppConfig.API_BASE_URL + 'todos';

    let httpMethod = todo._id ? 'put' : 'post';

    if (httpMethod === 'put') {
      url += '/' + todo._id;
    }

    // TODO: offline support nicht vergessen! (sync.......)
    // this.storageService.saveUser( but add todo before!)
    // .then ->
    return this.http[httpMethod](url, todo)
    .toPromise();
  }

  public deleteTodo(todo) {
    let url = AppConfig.API_BASE_URL + 'todos/' + todo._id;

    // TODO storage?
    return this.http.delete(url)
    .toPromise();
  }

  public isOnline() {
    let isConnected = navigator.onLine; // jshint ignore:line

    // cordova plugin add cordova-plugin-network-information
    if (navigator['connection'] && navigator['connection'].type) {
      let networkState = navigator['connection'].type;
      isConnected = networkState && (networkState !== Connection.NONE);
    }
    return isConnected;
  }
}
