# AtOneGo

_make webapp && make ios && make android - an experiment with JavaScript/NodeJS and Phonegap_

[![Build Status](https://travis-ci.org/mwager/atonego.png?branch=master)](https://travis-ci.org/mwager/atonego)

![AtOneGo](https://atonego-mwager.rhcloud.com/app/images/logo.png)

This is the repo of the app [AtOneGo](http://at-one-go.com)

* [View in iTunes store](https://itunes.apple.com/us/app/atonego/id668972250)
* [View in Google Play store](https://play.google.com/store/apps/details?id=de.mwager.atonego)
* [Try the WebApp](https://atonego-mwager.rhcloud.com/app)

This file contains the documentation for developers.

Author: Michael Wager <mail@mwager.de>


## TechStack - Overview ##

### App

Native App via Phonegap for iOS and Android. (WebApp served via Node.js)

* Zepto 1.0
* Require.js
* Lodash/Backbone.js 1.0.0
* SocketIO (0.9.x, __not used anymore__)
* mobiscroll (date & time scroller)
* Parts from Html5Boilerplate v4.X
* Grunt
* Inspired by the [TodoMVC project](http://todomvc.com) and [Yeoman](http://yeoman.io)
* Phonegap (v3.x)

### API and Website via Node.js ([at-one-go.com](http://at-one-go.com))

* Express framework (v3)
* Mongoose (v3)
* see `api/package.json`
* Hosting at [OpenShift](http://openshift.com) (free plan)

### Testing

* Mocha: bdd client- and serverside
* PhantomJS/CasperJS: headless webkit testing
* testem

### Cordova/Phonegap ###

#### Plugins: ####

Installiere alle Plugins:

NOTE: To update cordova plugins we need to remove and re-add !

    cordova plugin add org.apache.cordova.console && \
    cordova plugin add org.apache.cordova.device  && \
    cordova plugin add org.apache.cordova.dialogs && \
    cordova plugin add org.apache.cordova.network-information && \
    cordova plugin add org.apache.cordova.splashscreen && \
    cordova plugin add org.apache.cordova.statusbar && \
    cordova plugin add org.apache.cordova.vibration && \
    cordova plugin add org.apache.cordova.globalization && \
    cordova plugin add https://github.com/phonegap-build/PushPlugin.git

Remove all:

    cordova plugin rm org.apache.cordova.console && \
    cordova plugin rm org.apache.cordova.device  && \
    cordova plugin rm org.apache.cordova.dialogs && \
    cordova plugin rm org.apache.cordova.network-information && \
    cordova plugin rm org.apache.cordova.splashscreen && \
    cordova plugin rm org.apache.cordova.statusbar && \
    cordova plugin rm org.apache.cordova.vibration && \
    cordova plugin rm org.apache.cordova.globalization && \
    cordova plugin rm com.phonegap.plugins.PushPlugin && \
    rm -rf plugins/ios.json && rm plugins/android.json


## Relevant directories & files ##

* __`/app`                    - app sources (yeoman requirejs/backbone boilerplate)__
* __`/api`                    - node.js sources (REST API, SocketIO, DB, Tests, etc)__
* `/api_deployment`           - The openshift repo (we just copy the sources from `api` to this directory and push it up to openshift)
* `/api/server/website`       - Static files of the website at-one-go.com
* `/api/server/website/app`   - The WebApp will be served from here (optimized sources from `/dist` will be copied to this directory via `make webapp`)
* __`/api/server/test`        - All backend tests__
* __`/test`                   - All frontend tests__
* `/dist`                     - Created via Grunt. The optimized sources will be used in the phonegap app and the webapp
* `/mobile/`                  - Phonegap project directory (v3.x)
* `/docs`                     - All software documentation

### Files
* `Makefile`                  - The Makefile for everything
* `/app/index.html`           - The base html file for the phonegap app (goes to `/mobile/ios/www/` or `/mobile/android/assets/www/` via Makefile)
* `/app/webapp.html`          - The base html file for the web app (goes to `api/server/website/app/` via Makefile)

#### Important client side JavaScript files
* `/app/scripts/config.js`            - The RequireJS config file for development (see also `/app/scripts/config.production.js`)
* `/app/scripts/main.js`              - The main bootstrapper, all initial event handling (domready/deviceready, global click/touch handlers, global ajax config...)
* `/app/scripts/router.js`            - The AppRouter, all client side navigation is done via history api (pushstate is on phonegap apps not needed). All routes of the app are defined here, and the router takes care of the rendering of root-views (screens)



## Local installation ##

#### 1. The App

    $ cd path/to/your/projects
    $ git clone repo-url.git atonego
    $ cd atonego
    # install local build system using grunt [optional]
    $ npm install
    # NOTE: The folder `atonego` should be served via a locally installed webserver like apache
    $ open http://127.0.0.1/atonego # should serve index.html now

__Via phonegap__

$ make ios_build_dev && clear && t mobile/ios/cordova/console.log

Checkout the `Makefile` for more information.



#### 2. The API

A RESTful API for the app is written in JavaScript using Node.js, the website at-one-go.com and the webapp will be served through Node.js too.

NOTE: The production config file `api/server/config/environments/production.json` is not under version control.

    $ cd api
    $ npm install       # install dependencies only once
    $ mongod &          # start mongodb if not already running
    $ node server.js    # start the node app in development mode

Now checkout something like:

* [http://127.0.0.1/atonego/app](http://127.0.0.1/atonego/app)
* [http://127.0.0.1:4000/api](http://127.0.0.1:4000/api)
* [http://127.0.0.1:4000](http://127.0.0.1:4000/api)



## Code quality && -style ##

### Static code analysis via JSHint (back end && front end)

    # in the project root run:
    $ jshint . # see .jshintrc and .jshintignore

__Before committing, jshint MUST return zero:__

    $ jshint .      # see .jshintrc and .jshintignore
    $ echo $?       # output 0 ?

    # enable jshint git "pre-commit" hook
    touch .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
    echo "jshint ." > .git/hooks/pre-commit

### Codestyle

Inspired from [here](https://github.com/tastejs/todomvc/blob/gh-pages/codestyle.md)

* Space indentation (4)
* Single-quotes
* Semicolons
* Strict mode
* No trailing whitespace
* Variables at the top of the scope (where possible)
* Multiple variable statements
* Space after keywords and between arguments and operators
* JSHint valid (see rules in the project root)

Example: (client side using requirejs)

```js
define(function(require) {
    'use strict';

    var a = require('a'),
        b = require('b');

    function Foo() {}

    Foo.prototype = {
        bar: function() {
            return 'baz';
        }
    };

    return Foo;
});
```

### Markers
We mark problems and todos in the code comments via the marker `XXX` since using the well known marker `TODO` in a todo app seems not to be a good idea.




## Tests ##

### Overview
All following commands should run without errors: (all from the project root)

    $ cd api && npm test
    $ testem ci
    $ casperjs test test/functional

    # there is a command for all of them:
    $ make all_tests

### API

All server side unit & functional tests (bdd style) in: `/api/server/test`.

    $ cd api
    $ npm test  # mongod running? (possibly in another shell)

### CLIENT

Tests in `/test`.

[Quick View of the Testsuite](http://127.0.0.1/atonego/test)

Clientside UNIT Tests via `Mocha` and `testem`.

CodeCoverage `/app/scripts` via `Blanket.js`, see Tests in the Browser via `testem`.

    $ cd project_root
    $ testem      # default mode - Browsers can run the testsuite at http://localhost:7357
    $ testem ci   # ci mode      - run the suite in all available browsers

_Execute the tests in a simulator or on a device:_

    $ make test_build # copies `/app` und `/test` in mobile's `www` directories
    # after that, the file config.xml (ios/android) has to be edited:

    <content src="test/index_browser.html" />

    Then just run:
    $ make ios # build the phonegap app with the current content of `mobile/ios/www`
    $ make android # same for `mobile/android/assets/www`...

    # shortcuts (config.xml!)
    $ make test_build && make ios
    $ make test_build && make android


### Functional tests

Tests in `/test/functional` via (casperjs.org)[http://casperjs.org].

    # NOTE: Node and MongoDB must be running locally
    $ casperjs test test/functional


### Continuous Integration - Travis

[![Build Status](https://travis-ci.org/mwager/atonego.png?branch=master)](https://travis-ci.org/mwager/atonego)

See `.travis.yml` and [the travis page](https://travis-ci.org/mwager/atonego).


### Testing/Debugging via weinre

Checkout [weinre](http://people.apache.org/~pmuellr/weinre/docs/latest/)

    # Install & Run:
    $ [sudo] npm install -g weinre
    $ weinre --boundHost 192.168.1.233 --httpPort 8081 --verbose --debug --deathTimeout 60 --readTimeout 60
    >>> 2013-03-28T11:27:10.401Z weinre: starting server at ...

Then include smt like this in `app/index.html` right after `<body>`:

    <script type="text/javascript">
    window.onerror = function(e) {
        alert(e);
    }
    </script>
    <script src="http://192.168.1.233:8081/target/target-script.js#anonymous"></script>


and open [this](http://192.168.1.233:8081/client/#anonymous) page with a browser.





## The API, error handling & multilingualism ##

### Authorization & Authentication

We use HTTP Basic auth over SSL everywhere. On login (or signup), a secret API TOKEN gets generated from the user's ID and a random string. This token will be encrypted via AES and sent over to the client. As RESTful APIs should be stateless, each following request must include this token in the `password` field of the `Authorization`-Header to authenticate against the service.

Example:

    Authorization: "Basic base64encode('$username:$API_TOKEN')"

NOTE:

We cannot use custom certs and stuff on the openshift free plan so we cannot determine via node if the incoming request is secure (ssl) or not.

* Helpful Link: [Best Practices for Designing a Pragmatic RESTful API](http://www.vinaysahni.com/best-practices-for-a-pragmatic-restful-api#hateoas)
* [stackoverflow: Best Practices for securing a REST API](http://stackoverflow.com/questions/7551/best-practices-for-securing-a-rest-api-web-service)

### Texts

The App __and__ the API/website were developed with support for multilingualism. The following directories include __all__ Texts:

* /app/scripts/libs/locales  -> Texts of the App
* /api/server/locales        -> Texts of the Website & API

### Error Handling

Models are always returning the Error as the __first__ parameter in the callback (Node.js-Style, `null` on success), the second parameter can be used as return value, e.g. `callback(null, user)`).

#### Example

    // in a model-method e.g. todolist.fetchList()
    if (!list) {
        utils.handleError('damnit some error message'); // optional logging
        return callback({key: 'listNotFound'});
    }
    return callback(err);

    // later: (e.g. in controllers)
    if(err && err.key) {
        // Error already logged (Log-files)
        // Usage of key via `__(key)`
        var text = __(err.key);
        // `text` is now smt like "List not found" or
        // "Liste nicht gefunden" (e.g. based on current request)
        return displayErrToUserSomehow(text);
    }





## Deployment ##

Be sure to check out the `Makefile` for more infos.

### Deployment of the App via Phonegap

Via PhoneGap for iOS [and Android]. There is a `Makefile` for automating tasks
like optimizing the sources or compiling the native Apps via Phonegap.

We generate __one__ optimized JavaScript file (`aog.js`) via the requirejs optimizer, which will look something [like this](https://atonego-mwager.rhcloud.com/app/scripts/aog.js).

    $ make clean        # clean build directories
    $ make ios_device   # optimize sources, copy to ios `www` and build
    $ make ios          # build for ios via phonegap cli tools
    $ make android      # build for android via phonegap cli tools
    # NOTE: Shortcuts for running and logging: (phonegap catches "console.log()" calls)
    # We want a clean log file: (running in simulator)
    # 1. iOS
    $ echo "" > mobile/ios/cordova/console.log && make ios_build && clear && t mobile/ios/cordova/console.log
    # 2- Android
    # be sure to connect a real device before running the following one, else the android simulator could screw up your system (-;
    $ make android_build && make android_run && clear && adb logcat | grep "Cordova"

### App Store Submission (iOS)

* [checkout this tutorial first](http://www.adobe.com/devnet/dreamweaver/articles/phonegap-mobile-app-pt7.html#addconfappdist)
* [apple docs 1](http://developer.apple.com/library/ios/#documentation/ToolsLanguages/Conceptual/YourFirstAppStoreSubmission/AboutYourFirstAppStoreSubmission/AboutYourFirstAppStoreSubmission.html)
* [creating app record in iTunes connect](http://developer.apple.com/library/ios/#documentation/ToolsLanguages/Conceptual/YourFirstAppStoreSubmission/CreateYourAppRecordiniTunesConnect/CreateYourAppRecordiniTunesConnect.html)

Then just switch "Run" and "Archive" configs to "Distribution" under "edit scheme..." in xcode.

### Google Play Store Submission ###

* [see this tutorial](http://www.adobe.com/devnet/dreamweaver/articles/phonegap-mobile-app-pt4.html)

### App Versioning ###

We use git tags for versioning. However, the file `mobile/www/config.xml` [and `api/package.json` and `AndroidManifest.xml`] should be manually updated on releases.

### Deployment of the API

The API has its own repository at openshift. (URL: [atonego-mwager.rhcloud.com](https://atonego-mwager.rhcloud.com)) We are using a "Node.js-Catridge", default Node-Version is 0.6.x (May 2013), but of course we want a newer version of Node.js, so we also set up this:

[https://github.com/ramr/nodejs-custom-version-openshift](https://github.com/ramr/nodejs-custom-version-openshift)

##### Deploy the Node App to production

NOTE: this requires additional files (see `/.gitignore`).

    # 1. This command will optimize the sources using grunt and copy the generated stuff from `/dist/` to `/api/server/website/app/`:
    $ make webapp

    # 2. This command copies the sources from `api/*` over to `api_deployment/`
    # and pushes the stuff from there up to the openshift server.
    $ make api_deploy

    # restart from cli:
    $ make api_restart

#### Openshift's CLI Tool "rhc"

    # install: (needs ruby)
    $ gem install rhc

    > rhc app start|stop|restart -a {appName}
    > rhc cartridge start|stop|restart -a {appName} -c mysql-5.1

    When you do a git push, the app and cartridges do get restarted.  It is best if you can find any indication of why it stopped via your log files.  Feel free to post those if you need any further assistance.

    You can access your logs via ssh:
    > ssh $UUID@$appURL (use "rhc domain show" to find your app's UUID/appURL
    > cd ~/mysql-5.1/log (log dir for mysql)
    > cd ~/$OPENSHIFT_APP_NAME/logs (log dir for your app)

    # RESTART DATABASE ONLY:
    $ rhc cartridge start -a atonego -c rockmongo-1.1

    # RESTART APP ONLY:
    $ rhc app start -a atonego

Fix quota errors at openshift: (https://www.openshift.com/kb/kb-e1089-disk-quota-exceeded-now-what)

    $ ssh ...
    $ du -h * | sort -rh | head -50
    $ rm -rf mongodb-2.2/log/mongodb.log*
    $ rm -rf rockmongo-1.1/logs/*
    $ echo "" > nodejs/logs/node.log

    # and remove the mongodb journal files:
    $ rm -rf  mongodb/data/journal/*

Locally:

    rhc app tidy atonego


openshift

#### Cronjob:

On the Production-Server at openshift, there runs a minutely cronjob, checking all todos with notifications, so Email-, PUSH- and SocketIO-messages can be sent to notify users.

See `api/.openshift/cron/minutely/atonego.sh`

The cronjob has its own logfile:

    $ ssh ...to openshift....
    $ tail -f app-root/repo/server/logs/production_cronjob.log


### PhoneGap Notes

#### Reading
* [workflow](http://www.tricedesigns.com/2013/01/18/my-workflow-for-developing-phonegap-applications/)
* [why apple rejects apps](http://www.adobe.com/devnet/phonegap/articles/apple-application-rejections-and-phonegap-advice.html)
* [performance1](http://floatlearning.com/2011/03/developing-better-phonegap-apps/)
* [Youtube video creating IPA file](http://www.youtube.com/watch?v=wAdV16nRLp8)

#### Getting Started
The mobile projects were created like this:

* [Phonegap - getting started for iOS](http://docs.phonegap.com/en/2.4.0/guide_getting-started_ios_index.md.html#Getting%20Started%20with%20iOS)
* [Phonegap - getting started for Android](http://docs.phonegap.com/en/2.4.0/guide_getting-started_android_index.md.html#Getting%20Started%20with%20Android)

1. downloaded: PhoneGap2.x (current 2.9.x `cat mobile/ios/CordovaLib/VERSION`)
2. created ios and android projects

        $ mkdir mobile && cd mobile
        $ alias create="/path/to/phonegap-2.7.0/lib/ios/bin/create"
        $ create ios     de.mwager.atonego AtOneGo
        $ alias create="/path/to/phonegap-2.7.0/lib/android/bin/create"
        $ create android de.mwager.atonego AtOneGo


#### Phonegap-Updates - Workflow: (#update, #upgrade, #phonegap)
* download latest from phonegap.com
* checkout guides per platform
* copy all stuff manually
* iOS: [check this](http://docs.phonegap.com/en/2.7.0/guide_upgrading_ios_index.md.html)

#### Some links:
* [Apple Docs - DistributionOnly](https://developer.apple.com/library/ios/#documentation/Xcode/Conceptual/ios_development_workflow/10-Configuring_Development_and_Distribution_Assets/identities_and_devices.html#//apple_ref/doc/uid/TP40007959-CH4-SW1)

#### PUSH Notifications

NOTE: see "Cronjobs" und also the demo script: `api_deployment/server/ssl/push_demo.js`

    # run demo script via
    ### DEBUG=apn node ./api_deployment/server/ssl/push_demo.js
    DEBUG=apn node ./api/server/push_demo.js

Some links:

* [Phonegap PUSHPlugin at Github](https://github.com/phonegap-build/PushPlugin)
* [PhonegapPlugins Docs](https://build.phonegap.com/docs/plugins)
* [see this PUSH Tutorial](http://www.raywenderlich.com/3443/apple-push-notification-services-tutorial-part-12)


##### Creating a development push certificate

In the Apple dev member center:

1. create `development` provisioning profile for app id `de.mwager.atonego`, download and install
2. create `development` push certificate within the app id `de.mwager.atonego`
3. download this certificate, open with keychain access, export private key (`.p12` file)
4. checkout [this PUSH Tutorial](http://www.raywenderlich.com/3443/apple-push-notification-services-tutorial-part-12) to create the certificates for the server

Testing the certificate:

__Note__: use `gateway.sandbox.push.apple.com` in development (same port)

    $ openssl s_client -connect gateway.push.apple.com:2195 -cert api/server/ssl/ck.pem -key api/server/ssl/ck.pem
    # Output should be smt like:
    Enter pass phrase for api/server/ssl/ck_dev.pem:
    ******
    CONNECTED(00000003)
    ...
    Server certificate
    -----BEGIN CERTIFICATE-----
    ....


##### Node.js and PUSH Notifications
* [create ssl files](http://www.fasty.de/2011/04/how-to-apple-push-notification-inkl-php-skript/)
* see `api/server/ssl/push_demo.js` -> sends a push message to hardcoded device token

##### The phonegap's PushPlugin #####

See the [GitHub Page](https://github.com/phonegap-build/PushPlugin).

Installed via `plugman`:

    $ cd mobile
    $ plugman --platform android --project ./platforms/android --plugin https://github.com/phonegap-build/PushPlugin.git
    $ plugman --platform ios --project ./platforms/ios --plugin https://github.com/phonegap-build/PushPlugin.git


## Problems, Solutions, Workarounds, Known Bugs ##

### Performance

1. [check this](http://developer.apple.com/library/ios/#documentation/DeveloperTools/Conceptual/InstrumentsUserGuide/MemoryManagementforYouriOSApp/MemoryManagementforYouriOSApp.html)
2. [and that](http://coding.smashingmagazine.com/2012/11/05/writing-fast-memory-efficient-javascript/)

### Underscores in filenames

_Avoid underscores in files and folders because Phonegap may fail to load the
contained files in Android. This is a known issue._


### Edits

#### Zepto, Backbone
In a mobile environment like phonegap, memory management will be much more important than in the web. Variables in the global namespace are not cleaned up by the js engine's garbage collector, so keeping our variables as local as possible is a must.
To avoid polluting the global namespace as much as possible, Zepto, Backbone and some other files in `/app/scripts/libs` were edited, see "atonego".

Libs which are still global:

* `window._`  -> `/app/scripts/libs/lodash.js`
* `window.io` -> `/app/scripts/libs/socket.io.js` [not used anymore]

##### Zepto errors

Zepto's touch module was edited to prevent lots of strange errors like:

    TypeError: 'undefined' is not an object file:///var/mobile/Applications/XXXXXXXXXX/atonego.app/www/scripts/libs/zepto.js on line 1651

Search `/app/scripts/lib/zepto.js` for "atonego".


#### iOS does not allow HTTP Requests against self-signed/invalid certs...

On iOS devices, there were problemes with the api endpoint at `https://atonego-mwager.rhcloud.com/api`. The following workaround __is necessary__!

The file `/mobile/ios/atonego/Classes/AppDelegate.m` was edited: (at the bottom)

    @implementation NSURLRequest(DataController)
    + (BOOL)allowsAnyHTTPSCertificateForHost:(NSString *)host
    {
        return YES;
    }
    @end


#### ratchet.css && junior.js
The files `/app/styles/ratchet.css` and `/app/scripts/libs/junior_fork.js` were edited to match our requirements.

Thanks to:

* [ratchet project](http://maker.github.io/ratchet/)
* Some inspiration for rendering Backbone views with nice animations: [junior.js project](http://justspamjustin.github.io/junior)


### Disabled attributes & the `tap` event

The "disabled state" ("&lt;button ... disabled .../>") will not be captured. So on every "tap" we must check if the element has an disabled attribute or class.

### Ghostclicks

This is one of the most annoying problems I have ever had. Checkout `main.js` and `router.js` for some workarounds.

* [Google dev blog: Creating Fast Buttons for Mobile Web Applications](https://developers.google.com/mobile/articles/fast_buttons)

### Socket IO

__UPDATE:__ We do not use socket io anymore as its kind of senseless having an open connection in a todo-app. PUSH notifications should be enough. If you want to use websockets via phonegap on iOS, better do not use socketio version 0.9.

The app always crashed on resume after a (little) longer run. I was about to give up, then I found [this](https://issues.apache.org/jira/browse/CB-2301)

SocketIO's "auto reconnect" somehow crashed the app on the iOS test devices (seg fault!). As a workaround I disconnect the websocket connection on Phonegap's `pause`-event, and manually re-connect (using same socket/connection again) on the `resume`-event.

See also:

* https://github.com/LearnBoost/socket.io-client/pull/426

### Testflight Notes:

* Create the *.IPA file via XCode: check "iOS device", then: Product > Archive

### Install the app on a real iOS device via xCode

* Create provisioning profile, download, copy profile via organizer to device , (dblclick installs in xcode first)
* XCode: update codesigning identity according to the downloaded provisioning profile (project AND target)

### The cronjob

A minutely cronjob runs on the server, checking all todos which are due now, so we can notify users. However, I could not figure out a _good_ solution to re-use my existing (running) node app for this. The current workaround is to listen for a POST to a specific URL, and POSTing to that URL via `curl` from the cronjob with some pseudo credentials set to "make sure" that the request came from the shell script, not from outside )-:

Search `/api/worker.js` -> "cron"


## Console testing ##
Open the app in chrome or safari ([dev](http://127.0.0.1/atonego/app) or [live](https://atonego-mwager.rhcloud.com/app)), then open the dev console and put in some of the following commands to play with the app:

    # as there is (almost) nothing global, we must require stuff first, use this as template:
    > var $ = require('zepto'), app = require('app'), common = require('common');

    # then try some of these (-:
    > app.VERSION
    > app.isMobile
    > app.changeLang('de') // or app.changeLang('en') if currently in german
    > app.router.go('help')
    > window.history.back()
    > var list = app.todolists.get('object id of list from url or app.todolists');
    > list.toJSON()
    // URL: #todolists
    list.set('title', 'hello world')
    > app.fetchUser() // watch network tab

    var list = app.todolists.get('get id hash from url');
    list.set('title', '');




## Todos ##

See `docs/TODOs.md`
