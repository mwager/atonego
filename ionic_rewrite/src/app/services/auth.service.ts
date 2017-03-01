import { Injectable } from '@angular/core';
import {
  Http
} from '@angular/http';

import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/toPromise';

import { StorageService } from './storage.service';
import { AppConfig } from '../../shared/app_config';


@Injectable()
export class AuthService {
  public onLoginSuccess = new Subject();
  public onLogout = new Subject();

  constructor(
    private http: Http,
    private storageService: StorageService
  ) {}

  public checkIfUserIsAuthenticated(): Promise<any> {
    return this.storageService.loadUser()
    .then((user) => {
      if(user) {
        return true;
      }
      throw new Error('Not authenticated');
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
      this.storageService.saveUser(response.json());
      this.onLoginSuccess.next();
    });
  }

  public logout(): Promise<any> {
    return this.storageService.dropDatabase()
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
      this.storageService.saveUser(response.json());
      this.onLoginSuccess.next();
    });
  }
}
