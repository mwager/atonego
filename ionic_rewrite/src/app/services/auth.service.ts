import { Injectable } from '@angular/core';
import {
  Http
} from '@angular/http';

import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/toPromise';

import { PersistanceService } from './persistance.service';
import { AppConfig } from '../../shared/app_config';
import { CustomHttp } from '../../shared/custom-http';

declare var unescape: any;
declare var btoa: any;
declare var encodeURIComponent: any;

let base64Encode = (val) => {
  return btoa(unescape(encodeURIComponent( val )));
};

@Injectable()
export class AuthService {
  public onLoginSuccess = new Subject();
  public onLogout = new Subject();

  constructor(
    private http: Http,
    private persistanceService: PersistanceService
  ) {}

  public checkIfUserIsAuthenticated(): Promise<any> {
    return this.persistanceService.loadUser()
    .then((user) => {
      if(!user) {
        throw new Error('Not authenticated');
      }

      this.setGlobalHeaders(user);

      // If we have a user in storage, we try to fetch
      // an update from the server

      // TODO: offline support!
      // if we are offline, this wont work
      return this.http.get(AppConfig.API_BASE_URL + 'users/' + user._id)
      .toPromise()
      .then((response) => {
        let userJSON = response.json();

        this.setGlobalHeaders(userJSON);

        this.persistanceService.saveUser(userJSON);

        return true;
      })
      .catch((errorResponse) => {
        // we may offline and we have a user in storage,
        // so let users use the app
        // TODO: make this more stable
        return Promise.resolve(true);
      });
    });
  }

  public login(email: string, password: string): Promise<any> {
    const url = AppConfig.API_BASE_URL + 'login';

    return this.http
    .post(url, {
      email: email,
      password: password
    })
    .toPromise()
    .then((response) => {
      let userJSON = response.json();

      this.setGlobalHeaders(userJSON);

      this.persistanceService.saveUser(response.json());
      this.onLoginSuccess.next();
    });
  }

  public logout(): Promise<any> {
    return this.persistanceService.dropDatabase()
    .then(() => {
      this.onLogout.next();
    });
  }

  public signup(displayName: string, email: string, password: string) {
    const url = AppConfig.API_BASE_URL + 'signup';

    return this.http
    .post(url, {
      display_name: displayName,
      email: email,
      pw: password
    })
    .toPromise()
    .then((response) => {
      let userJSON = response.json();

      this.setGlobalHeaders(userJSON);

      this.persistanceService.saveUser(userJSON);
      this.onLoginSuccess.next();
    });
  }

  private setGlobalHeaders(userJSON) {
    let username = 'AtOneGo';

    let authStr  = 'Basic ' +
      base64Encode(username + ':' + userJSON.API_TOKEN);

    CustomHttp.addGlobalRequestHeader({
      name: 'Authorization',
      value: authStr
    });
    CustomHttp.addGlobalRequestHeader({
      name: 'Content-Language',
      value: 'en'
    });
  }
}
