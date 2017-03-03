import { Injectable } from '@angular/core';

import {
  Request,
  Http,
  Response,
  RequestOptionsArgs,
  RequestOptions,
  BaseRequestOptions,
  XHRBackend,
  RequestMethod
} from '@angular/http';

import { MockBackend } from '@angular/http/testing';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';

/**
 * Class extends angular2 http in order to intercept http requests
 *
 * We need two things:
 *   1. setting global request headers
 *   2. defining global error response handlers
 *
 * Thanks to:
 *   http://stackoverflow.com/questions/34934009/handling-401s-globally-with-angular-2
 */
@Injectable()
export class CustomHttp extends Http {

  static globalRequestHeaders: any = {};
  static globalResponseErrorHandlers: Array<any> = [];

  public static addGlobalRequestHeader(header: any) {
    this.globalRequestHeaders[header.name] = header.value;
  }

  public static removeGlobalRequestHeader(headerName: string) {
    delete this.globalRequestHeaders[headerName];
  }

  public static addGlobalResponseErrorHandler(handler: any) {
    this.globalResponseErrorHandlers.push(handler);
  }

  public static removeGlobalResponseErrorHandler(handler: any) {
    let index = this.globalResponseErrorHandlers.indexOf(handler);
    if (index > -1) {
      this.globalResponseErrorHandlers.splice(index, 1);
    }
  }

  constructor(backend: XHRBackend | MockBackend, defaultOptions: RequestOptions) {
    super(backend, defaultOptions);
  }

  /**
   * We only need to overwrite request method as angular http will call
   * this on each request type
   *
   * Call chain:
   *
   * 1. call from outside: CustomHttp.get(url, options)
   * 2. angular http.get now calls this method (with options now undefined and url instanceof request)
   * 3. we are calling super.request here
   */
  request(url: string | Request, options?: RequestOptionsArgs): Observable<Response> {
    if (!(url instanceof Request)) {
      throw new Error('Calling CustomHttp.request directly is not allowed');
    }

    console.debug(">>> request", url, CustomHttp.globalRequestHeaders)

    let request: Request = url;

    // append globally set request headers
    for (let headerName in CustomHttp.globalRequestHeaders) {
      if (CustomHttp.globalRequestHeaders.hasOwnProperty(headerName)) {
        let headerValue = CustomHttp.globalRequestHeaders[headerName];
        request.headers.append(headerName, headerValue);
      }
    }

    return super.request(request)
    .catch((errorResponse: Response) => {
      let requestMethod = this.getRequestMethodFromRequest(request);

      let requestConfig: any = {
        url: request.url,
        method: requestMethod,
        options: options
      };

      if (requestMethod === 'post' || requestMethod === 'put' || requestMethod === 'patch') {
        requestConfig.body = JSON.parse(request.getBody());
      }

      CustomHttp.globalResponseErrorHandlers.forEach((handler) => {
        handler(requestConfig, errorResponse);
      });

      return Observable.throw(errorResponse);
    });
  }

  private getRequestMethodFromRequest(request: Request): string {
    switch (request.method) {
      case RequestMethod.Get:
        return 'get';

      case RequestMethod.Post:
        return 'post';

      case RequestMethod.Put:
        return 'put';

      case RequestMethod.Patch:
        return 'patch';

      case RequestMethod.Delete:
        return 'delete';

      default:
        throw new Error('Unsupported request method: ' + request.method);
    }
  }
}


export const CUSTOM_HTTP_PROVIDER = {
  provide: Http,
  useFactory: (backend: XHRBackend, options: BaseRequestOptions) => {
    return new CustomHttp(backend, options);
  },
  deps: [XHRBackend, BaseRequestOptions]
};

export const CUSTOM_HTTP_MOCK_PROVIDER = {
  provide: Http,
  useFactory: (backend: MockBackend, options: BaseRequestOptions) => {
    return new CustomHttp(backend, options);
  },
  deps: [MockBackend, BaseRequestOptions]
};
