import { inject, TestBed } from '@angular/core/testing';
import { Http, BaseRequestOptions } from '@angular/http';
import { MockBackend } from '@angular/http/testing';
import { LoginService } from './login.service'


describe('Login Service', () => {

  let loginService: LoginService;

  beforeEach( () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: BaseRequestOptions, useClass: BaseRequestOptions},
        {provide: MockBackend, useClass: MockBackend},
        {
          provide: Http,
          useFactory: (backend: MockBackend, defaultOptions: BaseRequestOptions) => {
            return new Http(backend, defaultOptions);
          }, deps: [MockBackend, BaseRequestOptions]
        },
        {provide: LoginService, useClass: LoginService}
      ]
    });
  });

  beforeEach(inject([LoginService], (service: LoginService) => {
    loginService = service;
  }));

  describe('#doSignup', () => {

    it('should return a promise', () => {
      let promise = loginService.doLogin('test@example.com', 'passw0rd');
      expect(promise instanceof Promise).toBeTruthy();
    });
  });
});
