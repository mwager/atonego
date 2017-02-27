import { inject, TestBed } from '@angular/core/testing';
import { TestUtils } from '../../test-setup'
import { LoginService } from './login.service'


describe('Login Service', () => {

  let loginService: LoginService;

  beforeEach( () => {
    TestUtils.mockBackend();

    TestBed.configureTestingModule({
      providers: [
        {provide: LoginService, useClass: LoginService} // same as just "LoginService"
      ]
    });
  });

  beforeEach(inject([LoginService], (service: LoginService) => {
    loginService = service;
  }));

  describe('#doSignup', () => {

    it('should return a promise', () => {
      let promise = loginService.doLogin('test@example.com', 'passw0rd');
      console.log("OOOOOOOO--->" , promise instanceof Promise)
      expect(promise instanceof Promise).toBeTruthy();
    });
  });
});
