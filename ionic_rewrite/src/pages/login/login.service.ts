import {Injectable} from '@angular/core';

import {
  Http,
  // Response
} from '@angular/http';

import 'rxjs/add/operator/toPromise';

// import 'rxjs/add/operator/map'; // add map function to observable

@Injectable()
export class LoginService {
  constructor(private http: Http) {}

  doSignup(/*email: string, password: string*/) {
    const url = `http://192.168.178.23:4000/api/v1/signup`;

    return this.http
      .post(url, {
        display_name: 'Michale',
        email: 'mail@mwager.de',
        pw: 'guerilla'
      })
      .toPromise()
      .then(res => res.json().data)
      .catch( error => {
        console.error(error)
      });
  }

  doLogin(email: string, password: string) {
    const url = `http://192.168.178.23:4000/api/v1/login`; // `https://atonego-mwager.rhcloud.com/api/v1/login`

    return this.http
      .post(url, {
        email: email,
        password: password
      })
      .toPromise()
      .then(res => {
        console.log(res, res.json())

        // TODO: how to handle global state in angular2/typescript...?
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
