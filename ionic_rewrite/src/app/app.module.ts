import { NgModule } from '@angular/core';
import { FormsModule }   from '@angular/forms';
import { HttpModule }    from '@angular/http';

import { IonicApp, IonicModule } from 'ionic-angular';
import { MyApp } from './app.component';
// import { AboutPage } from '../pages/about/about';
// import { ContactPage } from '../pages/contact/contact';
// import { HomePage } from '../pages/home/home';
// import { TabsPage } from '../pages/tabs/tabs';
import {LoginPage} from '../pages/login/login'



@NgModule({
  declarations: [
    MyApp,
    LoginPage

    // AboutPage,
    // ContactPage,
    // HomePage,
    // TabsPage
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
    // AboutPage,
    // ContactPage,
    // HomePage,
    // TabsPage
  ],
  providers: []
})
export class AppModule {}
