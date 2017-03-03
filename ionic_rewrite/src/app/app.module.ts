import { NgModule, ErrorHandler} from '@angular/core';
import { FormsModule }   from '@angular/forms';
import { HttpModule, BaseRequestOptions }    from '@angular/http';

import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { Storage } from '@ionic/storage';

import { MyApp } from './app.component';

import { StartPage } from '../pages/start/start';
import { SettingsPage } from '../pages/settings/settings';
import { LoginPage } from '../pages/login/login';
import { SignupPage } from '../pages/signup/signup';
import { TodolistsPage } from '../pages/todolists/todolists';
import { TodolistPage } from '../pages/todolist/todolist';
import { TodoPage } from '../pages/todo/todo';

import { StorageService } from './services/storage.service';
import { AuthService } from './services/auth.service';
import { PersistanceService } from './services/persistance.service';
import { CUSTOM_HTTP_PROVIDER } from '../shared/custom-http';

export function provideStorage() {
  return new Storage(['sqlite', 'indexeddb', 'websql'], { name: '__atonego_database' });
};

@NgModule({
  declarations: [
    MyApp,
    SettingsPage,
    StartPage,
    LoginPage,
    SignupPage,
    TodolistsPage,
    TodolistPage,
    TodoPage
  ],
  imports: [
    IonicModule.forRoot(MyApp),
    FormsModule,
    HttpModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    SettingsPage,
    StartPage,
    LoginPage,
    SignupPage,
    TodolistsPage,
    TodolistPage,
    TodoPage
  ],
  providers: [
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    {provide: Storage, useFactory: provideStorage},
    AuthService,
    StorageService,

    BaseRequestOptions,
    CUSTOM_HTTP_PROVIDER,
    PersistanceService
 ]
})
export class AppModule {}
