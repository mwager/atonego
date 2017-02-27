import { inject, TestBed } from '@angular/core/testing';
import { TestUtils } from '../../test-setup'
import { AuthService } from './auth.service'


describe('AuthService', () => {

  let authService: AuthService;

  beforeEach( () => {
    TestUtils.mockBackend();

    TestBed.configureTestingModule({
      providers: [
        AuthService
      ]
    });
  });

  beforeEach(inject([AuthService], (service: AuthService) => {
    authService = service;
  }));

  describe('#login', () => {

    it('should TODO', () => {

    });
  });

  describe('#signup', () => {

    it('should TODO', () => {

    });
  });
});
