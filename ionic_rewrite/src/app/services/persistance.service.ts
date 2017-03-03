import { Injectable } from '@angular/core';
import {
  Http,
  Headers,
  RequestOptions
} from '@angular/http';

import { StorageService } from './storage.service';

import { AppConfig } from '../../shared/app_config';


/**
 * See specs
 */
@Injectable()
export class PersistanceService {

  constructor(
    private http: Http,
    private storageService: StorageService
  ) {
  }

  /**
   * TODO: better offline first:
   *
   * -> have one "persistanceService" which knows http
   * AND storage and keeps it "OFFLINE FIRST"
   *
   * // offline support
    // wir speichern erstmal lokal
    // beim sync werden dann erstmal die lokalen gepostet
    // anschließend ein fetch gemacht
   */

  public createOrEditTodo(todo: any): Promise<any> {
    let url = AppConfig.API_BASE_URL + 'todos';

    let httpMethod = todo._id ? 'put' : 'post';

    if (httpMethod === 'put') {
      url += '/' + todo._id;
    }

    // TODO: offline support nicht vergessen! (sync.......)
    // this.storageService.saveUser( but add todo before!)
    // .then ->
    return this.http[httpMethod](url, todo)
    .toPromise();
  }
}
