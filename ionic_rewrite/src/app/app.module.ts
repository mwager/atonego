import { NgModule, ErrorHandler } from '@angular/core';
import { FormsModule }   from '@angular/forms';
import { HttpModule }    from '@angular/http';

import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';

import { LoginPage } from '../pages/login/login'

@NgModule({
  declarations: [
    MyApp,
    LoginPage
  ],

  imports: [
    IonicModule.forRoot(MyApp),
    FormsModule,
    HttpModule
  ],

  bootstrap: [IonicApp],

  entryComponents: [
    MyApp,
    LoginPage
  ],

  providers: [
  {
    provide: ErrorHandler,
    useClass: IonicErrorHandler
  }
]
})
export class AppModule {}
