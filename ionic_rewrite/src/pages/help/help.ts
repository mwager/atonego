import { Component } from '@angular/core';

import { AppConfig } from '../../shared/app_config';


@Component({
  selector: 'page-help',
  templateUrl: 'help.html'
})
export class HelpPage {

  public version = AppConfig.version;
  public ua = navigator.userAgent;

  constructor() {}
}
