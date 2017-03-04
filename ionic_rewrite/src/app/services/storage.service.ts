import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';

/**
 * Class implements storage methods for persisting and reading user data,
 * their todolists and todos.
 */
const USER_KEY = 'USER';

@Injectable()
export class StorageService {
  private isReadyPromise;
  public API_TOKEN;

  public user;

  constructor(private storage: Storage) {
    // TODO: really necessary?
    this.isReadyPromise = this.storage.ready();
  }

  public saveUser(userObject: any): Promise<any> {
    this.API_TOKEN = userObject.API_TOKEN;
    this.user = userObject;

    return this.isReadyPromise.then(() => {
      return this.storage.set(USER_KEY, userObject);
    });
  }

  public loadUser(): Promise<any> {
    return this.isReadyPromise.then(() => {
      return this.storage.get(USER_KEY)
      .then((user) => {
        this.user = user;
        return user;
      });
    });
  }

  public fetchTodolists(): Promise<any> {
    return this.loadUser().then((user) => {
      return user.todolists;
    });
  }

  public dropDatabase(): Promise<any> {
    return this.storage.clear();
  }
}
