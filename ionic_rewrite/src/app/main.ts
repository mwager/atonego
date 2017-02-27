import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app.module';

declare var console: any;

window['log'] = function() {
  if(console && typeof console.log === 'function') {
    console.log.apply(console, arguments);
  }
};
window['err'] = function() {
  if(console && typeof console.error === 'function') {
    console.error.apply(console, arguments);
  }
};

platformBrowserDynamic().bootstrapModule(AppModule);
