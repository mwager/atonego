import {} from 'jasmine';

import {
  async,
  inject,
  TestBed
} from '@angular/core/testing';

import {
  Http,
  RequestOptions,
  Request,
  Response,
  ResponseOptions,
  Headers,
  BaseRequestOptions
} from '@angular/http';

import { MockBackend } from '@angular/http/testing';
import 'rxjs/add/operator/toPromise';

import { TestUtils } from '../test-setup';

import { CustomHttp, CUSTOM_HTTP_MOCK_PROVIDER } from './custom-http';

describe('CustomHttp', () => {
  let customHttp;
  let mockBackend: MockBackend;

  let headers;
  let requestOptions;
  let body;

  beforeEach(() => {
    headers = new Headers({
      'Content-Type': 'text/plain'
    });
    requestOptions = new RequestOptions({ headers: headers });
    body = {some: 'param'};

    TestBed.configureTestingModule({
      providers: [
        MockBackend,
        CUSTOM_HTTP_MOCK_PROVIDER, // IMPORTANT!
        BaseRequestOptions
      ]
    });
  });

  beforeEach(inject([MockBackend, Http], (
    _mockBackend: MockBackend,
    _http: Http // -> will now be an instance of our class!
  ) => {
    mockBackend = _mockBackend;
    customHttp = _http;
  }));

  describe('Given global request headers was set', () => {

    let expectDefaults = () => {
      expect(customHttp.request).toHaveBeenCalledTimes(1);
      let args = customHttp.request['calls'].mostRecent().args;
      expect(args[0] instanceof Request).toBe(true);
      expect(args[0].url).toBe('http://example.com');
      expect(args[0].headers.toJSON()['Content-Type']).toEqual(['text/plain']);
      expect(args[0].headers.toJSON().headername1).toEqual(['headervalue1']);
      expect(args[0].headers.toJSON().headername2).toEqual(['headervalue2']);
    };

    beforeEach(() => {
      CustomHttp.addGlobalRequestHeader({
        name: 'headername1',
        value: 'headervalue1'
      });
      CustomHttp.addGlobalRequestHeader({
        name: 'headername2',
        value: 'headervalue2'
      });

      spyOn(customHttp, 'request').and.callThrough();
      TestUtils.prepareSuccessfullHttpResponse(mockBackend);
    });

    afterEach(() => {
      CustomHttp.removeGlobalRequestHeader('headername1');
      CustomHttp.removeGlobalRequestHeader('headername2');
    });


    it('should append them to the request given a GET request', async(() => {
      customHttp.get('http://example.com', requestOptions)
      .toPromise()
      .then(() => {
        expectDefaults();
      });
    }));

    it('should append them to the request given a POST request', async(() => {
      customHttp.post('http://example.com', body, requestOptions)
      .toPromise()
      .then(() => {
        expectDefaults();
        let args = customHttp.request['calls'].mostRecent().args;
        expect(JSON.parse(args[0].getBody())).toEqual(body);
      });
    }));

    it('should append them to the request given a PUT request', async(() => {
      customHttp.put('http://example.com', body, requestOptions)
      .toPromise()
      .then(() => {
        expectDefaults();
        let args = customHttp.request['calls'].mostRecent().args;
        expect(JSON.parse(args[0].getBody())).toEqual(body);
      });
    }));

    it('should append them to the request given a DELETE request', async(() => {
      customHttp.delete('http://example.com', requestOptions)
      .toPromise()
      .then(() => {
        expectDefaults();
      });
    }));
  });


  describe('Given a global error response handler was set', () => {

    let globalResponseErrorHandler;
    let errorHandlerSpy;

    let addGlobalResponseErrorHandler = (method: string, doneCallback) => {
      globalResponseErrorHandler = (requestConfig, errorResponse) => {
        expect(requestConfig.method).toBe(method);
        expect(requestConfig.url).toBe('http://example.com');

        expect(errorResponse.status).toBe(401);
        expect(errorResponse.json().error).toBe(true);

        if (method === 'post' || method === 'put' || method === 'patch') {
          expect(requestConfig.body).toEqual(body);
        }

        doneCallback();
      };
      CustomHttp.addGlobalResponseErrorHandler(globalResponseErrorHandler);

      errorHandlerSpy = jasmine.createSpy('error handler spy');
      TestUtils.prepareErrorHttpResponse(mockBackend, {error: true}, 401);
    };

    afterEach(() => {
      CustomHttp.removeGlobalResponseErrorHandler(globalResponseErrorHandler);
    });


    it('should call the custom handler with the correct params given a GET request', async(() => {
      addGlobalResponseErrorHandler('get', errorHandlerSpy);
      customHttp.get('http://example.com', requestOptions)
      .toPromise()
      .then(() => {
        expect(errorHandlerSpy).toHaveBeenCalledTimes(1);
      })
      .catch(() => {});
    }));

    it('should call the custom handler with the correct params given a POST request', async(() => {
      addGlobalResponseErrorHandler('post', errorHandlerSpy);
      customHttp.post('http://example.com', body, requestOptions)
      .toPromise()
      .then(() => {
        expect(errorHandlerSpy).toHaveBeenCalledTimes(1);
      })
      .catch(() => {});
    }));

    it('should call the custom handler with the correct params given a PUT request', async(() => {
      addGlobalResponseErrorHandler('put', errorHandlerSpy);
      customHttp.put('http://example.com', body, requestOptions)
      .toPromise()
      .then(() => {
        expect(errorHandlerSpy).toHaveBeenCalledTimes(1);
      })
      .catch(() => {});
    }));

    it('should call the custom handler with the correct params given a PATCH request', async(() => {
      addGlobalResponseErrorHandler('patch', errorHandlerSpy);
      customHttp.patch('http://example.com', body, requestOptions)
      .toPromise()
      .then(() => {
        expect(errorHandlerSpy).toHaveBeenCalledTimes(1);
      })
      .catch(() => {});
    }));

    it('should call the custom handler with the correct params given a DELETE request', async(() => {
      addGlobalResponseErrorHandler('delete', errorHandlerSpy);
      customHttp.delete('http://example.com', requestOptions)
      .toPromise()
      .then(() => {
        expect(errorHandlerSpy).toHaveBeenCalledTimes(1);
      })
      .catch(() => {});
    }));
  });
});
