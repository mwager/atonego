import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app.module';

window['log'] = function() {
  console.log.apply(console, arguments);
};

platformBrowserDynamic().bootstrapModule(AppModule);
