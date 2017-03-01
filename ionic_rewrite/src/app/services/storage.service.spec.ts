import { TestBed, async, inject } from '@angular/core/testing';

import { StorageService } from './storage.service';
import { Storage } from '@ionic/storage';

describe('Storage Service', () => {
  let storageService: StorageService;
  let ionicStorage: Storage;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        StorageService,
        Storage
      ]
    });
  });

  beforeEach(inject([StorageService, Storage], (
    _storageService: StorageService,
    _ionicStorage: Storage
  ) => {
    storageService = _storageService;
    ionicStorage = _ionicStorage;
  }));

  beforeEach(async(() => {
    storageService.dropDatabase();
  }));


  describe('#saveUser', () => {

    it('should', () => {

    });
  });

  describe('#loadUser', () => {

    it('should', () => {

    });
  });

  describe('#fetchTodolists', () => {

    it('should', () => {

    });
  });

  describe('#dropDatabase', () => {

    it('should drop the whole database', async(() => {
      spyOn(ionicStorage, 'clear').and.returnValue('foo');

      expect(storageService.dropDatabase()).toBe('foo');
      expect(ionicStorage.clear).toHaveBeenCalled();
    }));
  });

});
