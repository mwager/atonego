import { Injectable } from '@angular/core';
import {
  Http,
  Headers
} from '@angular/http';

import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/toPromise';

import { StorageService } from './storage.service';

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
    const url = `https://atonego-mwager.rhcloud.com/api/v1/login`;

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

  signup(/*email: string, password: string*/) {
    const url = `http://192.168.178.23:4000/api/v1/signup`;
    let headers = new Headers();
    headers.append('Content-Type', 'application/json');

    return this.http
      .post(url, {
        display_name: 'Michale',
        email: 'mail@mwager.de',
        pw: ''
      }, { headers })
      .toPromise()
      .then(res => res.json().data)
      .catch( error => {
        console.error(error)
      });
  }
}
