import { Component, Inject } from '@angular/core';

import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import { LoginService } from './login.service'

@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
  providers: [LoginService]
})
export class LoginPage {
  loginForm: FormGroup;
  signupForm: FormGroup;


  constructor(
    @Inject(FormBuilder) formBuilder: FormBuilder,
    private loginService: LoginService
   ) {
    this.loginForm = formBuilder.group({
      email: ["mail@mwager.de", Validators.required],
      password: ["1", Validators.required]
    });

    this.signupForm = formBuilder.group({
      displayName: ["Michael", Validators.required],
      email: ["mail@mwager.de", Validators.required],
      password: ["1", Validators.required]
    });
  }

  doLogin(formValue) {
    event.preventDefault();
    this.loginService.doLogin(formValue.email, formValue.password);
  }

  doSignup(formValue) {
    event.preventDefault();
    this.loginService.doSignup(/* . hardcoded... ..*/);
  }

}
