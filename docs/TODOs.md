# TODOs #

## BEFORE RELEASE: ##

* search project for "XXX" or "XXX now"

## APP ##
* push tokens/gcm reg ids: e.g. on android, if decipher fails and user logs in again, there may be two gcm reg ids of the same device...
* we want autohide = false in config.xml but that caused the splash screen hang AFTER first submission to the app store ([maybe this helps](http://community.phonegap.com/nitobi/topics/stops_at_default_phonegap_splash_screen_on_ios_iphone_5))
* fix bugs! (invitation screen dead, datetime-picker screen dead)
* use almond in production [see](https://www.nothing.ch/en/research/using-optimised-requirejs-combination-phonegap)

## API ##
* fix missing flash messages or redirect to another page (e.g. on successfull account registration, after password changed...)
* fix travis connection problems
* use redis instead of connect-mongo

* Scaling openshift (currently no cronjobs for scalable apps, senseless on free account either?)
* Security review?
* API: apn push feedback stuff (application.js @ initAPNFeedbackPolling())

### Other Todos (maybe later) ##
* FirefoxOS App !
* Windows App ? (check scrolling and 9-patch images via sdk tools...)
* google analytics tracking? (app store clicks? webapp? ...)
* media queries (e.g. startpage -> logo could be bigger on tablets)
