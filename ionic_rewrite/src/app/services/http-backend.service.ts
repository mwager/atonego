import { Injectable } from '@angular/core';
import {
  Http,
  Headers,
  RequestOptions
} from '@angular/http';

import { StorageService } from './storage.service';

import { AppConfig } from '../../shared/app_config';

/**
 * Class implements methods needed to execute
 * http requests against the backend
 */
@Injectable()
export class HttpBackendService {

  constructor(
    private http: Http,
    private storageService: StorageService
  ) {
  }

  public createTodo(todo: any): Promise<any> {
    const url = AppConfig.API_BASE_URL + 'todos';

    // TODO: offline support nicht vergessen! (sync.......)

    /**
     * TODO:
     * entweder bei jedem request hier den header setzen oder http überschreiben
     */
    let headers = new Headers({
      Authorization: 'Basic QXRPbmVHbzpiODBhNDI0NzMxMzIzNTIzNDZkMWMzMDkwY2ExMWEzMTIwYjI5YzE5NDdjZTFjMDM2ZGNjNDBkMjI1MjM3NGJmYzhkOWJjNTcwOTQ4NWUxYzBjZmYyZDI1NGNiYmQ3MzJiNmMwOTFlNGQ2Yzk4ZWI3ZWIyYzQ3MzA3MDBmNzEyNzdjZGZmYjI0MjY2ZGFjYjIwODE4YzdmYmEzNThiYzU2'
    });
    let options = new RequestOptions({ headers: headers });
    return this.http.post(url, todo, options)
    .toPromise();
  }
}
