let environment = 'dev';
let apiBaseurl;
let version = '2.0.0.beta-1';

switch(environment) {
  case 'dev':
    apiBaseurl = 'http://127.0.0.1:4000/api/v1/';
    break;

  case 'prod':
    apiBaseurl = 'https://atonego-mwager.rhcloud.com/api/v1/';
    break;
}

export class AppConfig {
  static ENVIRONMENT = environment;
  static API_BASE_URL = apiBaseurl;

  static version = version;
}
