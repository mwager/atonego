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
        {
          provide: Storage,
          useFactory: () => {
            return new Storage(['localstorage']);
          }
        }
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
    let user;

    beforeEach(async(() => {
      spyOn(ionicStorage, 'set')
      .and.returnValue(Promise.resolve())

      user = {
        _id: 'user-id',
        API_TOKEN: 'API_TOKEN',
        todolists: [
          {_id: 'id1', title: 'hi', todos: []}
        ]
      };
      storageService.saveUser(user);
    }));

    it('should remember the api token', () => {
      expect(storageService.API_TOKEN).toBe(user.API_TOKEN);
    });

    it('should remember the todolists', () => {
      expect(storageService.todolists['list-id1'])
        .toEqual(user.todolists[0]);
    });

    it('should store the todolists seperated', () => {
      expect(ionicStorage.set)
        .toHaveBeenCalledWith('list-id1', user.todolists[0]);
    });

    it('should store the user', () => {
      expect(ionicStorage.set)
        .toHaveBeenCalledWith('USER', user);
    });
  });

  describe('#loadUser', () => {

    it('should load the user from storage', () => {

    });
  });

  describe('#fetchTodolists', () => {

    it('should fetch all todolists from storage', () => {

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
