import { NgModule, ErrorHandler} from '@angular/core';
import { FormsModule }   from '@angular/forms';
import { HttpModule }    from '@angular/http';

import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { Storage } from '@ionic/storage';

import { MyApp } from './app.component';
import { LoginPage } from '../pages/login/login'
import { StartPage } from '../pages/start/start';

import { StorageService } from './services/storage.service';
import { AuthService } from './services/auth.service';

export function provideStorage() {
  return new Storage(['sqlite', 'indexeddb', 'websql'], { name: '__atonego_db' });
};

@NgModule({
  declarations: [
    MyApp,
    LoginPage,
    StartPage
  ],
  imports: [
    IonicModule.forRoot(MyApp),
    FormsModule,
    HttpModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    LoginPage,
    StartPage
  ],
  providers: [
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    {provide: Storage, useFactory: provideStorage},
    AuthService,
    StorageService
 ]
})
export class AppModule {}
