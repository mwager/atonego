import {Injectable} from '@angular/core';

import {
  Http,
  // Response
  Headers
} from '@angular/http';

import 'rxjs/add/operator/toPromise';

@Injectable()
export class LoginService {
  constructor(private http: Http) {}

  doSignup(/*email: string, password: string*/) {
    const url = `http://192.168.178.23:4000/api/v1/signup`;
    let headers = new Headers();
    headers.append('Content-Type', 'application/json');

    return this.http
      .post(url, {
        display_name: 'Michale',
        email: 'mail@mwager.de',
        pw: 'guerilla'
      }, { headers })
      .toPromise()
      .then(res => res.json().data)
      .catch( error => {
        console.error(error)
      });
  }

  doLogin(email: string, password: string) {
    const url = `http://127.0.0.1:4000/api/v1/login`; // `https://atonego-mwager.rhcloud.com/api/v1/login`

    return this.http
      .post(url, {
        email: email,
        password: password
      })
      .toPromise()
      .then(res => {
        console.log(res, res.json())

        // TODO: how to handle global state in angular2/typescript...?
        // hehehehehheheheeeeeee
        // use a static service?
        window['__app_config__'].authData = res.json()
       })
      .catch( error => {
        console.error(error)
      });
  }

  // getPizza() {
  //   return this.http.get('assets/pizza.json')
  //     .map((res: Response) => res.json());
  // }
}
