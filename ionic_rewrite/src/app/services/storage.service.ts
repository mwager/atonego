import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';

/**
 * Class implements storage methods for persisting and reading user data,
 * their todolists and todos.
 */
@Injectable()
export class StorageService {
	private isReadyPromise;

	constructor(private storage: Storage) {
		this.isReadyPromise = this.storage.ready();
	}

	public saveUser(userObject): Promise<any> {
		return this.isReadyPromise.then(() => {
			return this.storage.set('USER', userObject);
		});
	}
}
