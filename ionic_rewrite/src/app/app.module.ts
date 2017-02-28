import { NgModule, ErrorHandler} from '@angular/core';
import { FormsModule }   from '@angular/forms';
import { HttpModule }    from '@angular/http';

import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { Storage } from '@ionic/storage';

import { MyApp } from './app.component';

import { StartPage } from '../pages/start/start';
import { LoginPage } from '../pages/login/login';
import { SignupPage } from '../pages/signup/signup';
import { TodolistsPage } from '../pages/todolists/todolists';
import { TodolistPage } from '../pages/todolist/todolist';

import { StorageService } from './services/storage.service';
import { AuthService } from './services/auth.service';

export function provideStorage() {
  return new Storage(['sqlite', 'indexeddb', 'websql'], { name: '__atonego_database' });
};

@NgModule({
  declarations: [
    MyApp,
    StartPage,
    LoginPage,
    SignupPage,
    TodolistsPage,
    TodolistPage
  ],
  imports: [
    IonicModule.forRoot(MyApp),
    FormsModule,
    HttpModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    StartPage,
    LoginPage,
    SignupPage,
    TodolistsPage,
    TodolistPage
  ],
  providers: [
    MyApp,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    {provide: Storage, useFactory: provideStorage},
    AuthService,
    StorageService
 ]
})
export class AppModule {}
