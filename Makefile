# ------------------------------------------------------------------------------
# AtOneGo Makefile
#
# Optimize sources via grunt, building and running via phonegap,
# deploying the api sources, running tests, etc
# ------------------------------------------------------------------------------

### COLOR STUFF
NO_COLOR			=\x1b[0m
OK_COLOR			=\x1b[32;01m
ERROR_COLOR			=\x1b[31;01m
WARN_COLOR			=\x1b[33;01m
# OK_STRING			=$(OK_COLOR)[OK]$(NO_COLOR)

### GLOBAL STUFF
SRC                 = app
DST                 = dist
TEST                = test
IOS_SRC             = mobile/ios/www/
ANDROID_SRC         = mobile/android/assets/www/
WEBAPP_SRC          = api/server/website/app/
ABSOLUTE_WEB_PATH   = http:\/\/127.0.0.1\/atonego\/app\/

API_SRC             = api
API_DST             = api_deployment
CORDOVA_IOS         = <script src="scripts\/vendor\/cordova.ios.js"><\/script>
CORDOVA_ANDROID     = <script src="scripts\/vendor\/cordova.android.js"><\/script>

RANDOM_STR          = $(shell /bin/bash -c "echo $$RANDOM")

# the push plugin javascript code from https://github.com/phonegap-build/PushPlugin
PUSHPLUGIN_JS       = <script src="scripts\/vendor\/PushNotification.js"><\/script>

# FINAL_VERSION = $(shell git describe --tags --long)-$(shell git log --oneline | wc -l | tr -d ' ')
FINAL_VERSION       = $(shell git describe --abbrev=0)


clean :
	@echo
	@echo "$(OK_COLOR)AtOneGo $(FINAL_VERSION) - cleaning up...$(NO_COLOR)"

	rm -rf temp
	rm -rf dist
	rm -rf mobile/ios/build/*
	rm -rf $(IOS_SRC)*
	rm -rf $(ANDROID_SRC)*

	rm -rf mobile/ios/www/*
	rm -rf mobile/android/assets/www/*

	# clean android builds (java classes and stuff)
	rm -rf mobile/android/bin/*

	# mobile/ios/cordova/clean


# jsonlint:
# prüfe die language json/js files auf syntax errors ? -> "npm test" checkt die!


# Dieser Task kopiert neben den App-Quellen auch die Test-Quellen
# in die jeweiligen Plattform-Verzeichnisse. Dadurch kann man die Testsuite
# auf echten Geräten ausführen (-:
# NOTE: Nach diesem Task muss die entsprechende "config.xml" pro Plattform
# noch angepasst werden: anstatt index.html muss "test/index.html"
# geladen werden
test_build : clean
    # 1. copy /app und /test to mobile "www"
	cp -rf $(SRC) $(IOS_SRC)
	cp -rf $(TEST) $(IOS_SRC)

	cp -rf $(SRC) $(ANDROID_SRC)
	cp -rf $(TEST) $(ANDROID_SRC)

	# include project specific cordova js stuff in testsuites!
	sed -i '' 's/<!-- cordova replace -->/$(CORDOVA_ANDROID)/' $(ANDROID_SRC)test/index.html
	sed -i '' 's/<!-- cordova replace -->/$(CORDOVA_IOS)/'     $(IOS_SRC)test/index.html

	sed -i '' 's/<!-- pushplugin replace -->/$(PUSHPLUGIN_JS)/' $(ANDROID_SRC)test/index.html
	sed -i '' 's/<!-- pushplugin replace -->/$(PUSHPLUGIN_JS)/' $(IOS_SRC)test/index.html

	# => NUN config.xml anpassen !!! und dann "make ios" | "make android"


### jsbuild: DO NOT BREAK THIS WHILE RUNNING!
### the js build using grunt/rjs
jsbuild : clean
	@echo
	@echo "$(OK_COLOR)AtOneGo $(FINAL_VERSION) - optimizing codebase...$(NO_COLOR)"
	@echo "$(ERROR_COLOR)* * * * * * * * * DO NOT BREAK THIS COMMAND WHILE RUNNING! * * * * * * * * * $(NO_COLOR)"

    ### sync version with git tags
	sed -i '' 's/___XXX___/$(FINAL_VERSION)/' $(SRC)/scripts/version.js

    ### Building with yeoman...
	### create production config.js !
	cp $(SRC)/scripts/config.js $(SRC)/scripts/config.dev.js
	cp $(SRC)/scripts/config.production.js $(SRC)/scripts/config.js

	# yeoman build:minify --force
	# yeoman build --force
	# yeoman build:text --force
	# ODER GRUNT:
	grunt

	### restore version
	sed -i '' 's/$(FINAL_VERSION)/___XXX___/' $(SRC)/scripts/version.js

	### restore dev config
	mv $(SRC)/scripts/config.dev.js $(SRC)/scripts/config.js

	### manually copy the fonts to dist
	cp -rf $(SRC)/fonts $(DST)/fonts

    ### remove unneeded files?
    # UPDATE: not necessary with yeoman 1.0 beta (dist is clean)
	# rm -rf $(DST)/.htaccess
	# ...

	@echo
	@echo "$(OK_COLOR)>>>>> Build file size statistics:$(NO_COLOR)"
	@echo
	du -sh $(DST)
	du -sh $(DST)/fonts
	du -sh $(DST)/images
	du -sh $(DST)/scripts
	du -sh $(DST)/styles/main.css
	du -sh $(DST)/scripts/aog.js
	du -sh $(DST)/index.html

	# (js)-beautify the aog.js
	# js-beautify -f $(DST)/scripts/aog.js -o $(DST)/scripts/aog.js

### wenn man die app auf nem device ohne requirejs build laufen lassen will
### muss "jsbuild_debug" die dependency des "build" tasks sein!
jsbuild_debug : clean
	@echo
	@echo "$(WARN_COLOR)====================================================$(NO_COLOR)"
	@echo "$(WARN_COLOR)WARNING: just copying the raw app sources to 'dist'!$(NO_COLOR)"
	@echo "$(WARN_COLOR)====================================================$(NO_COLOR)"

	mkdir $(DST)
	cp -rf $(SRC)/* $(DST)


### copy optimized src to phonegap android/ios directories
build : jsbuild
	@echo
	@echo "$(OK_COLOR)AtOneGo $(FINAL_VERSION) - copy the build product to phonegap platform destinations$(NO_COLOR)"
	@echo
	cp -rf $(DST)/* $(IOS_SRC)
	cp -rf $(DST)/* $(ANDROID_SRC)

	### NOTE: production ODER staging hier!
	sed -i '' 's/development/production/' $(IOS_SRC)index.html
	sed -i '' 's/development/production/' $(ANDROID_SRC)index.html

	### include cordova js based on device type
	sed -i '' 's/<!-- __CORDOVA_REPLACE__ -->/$(CORDOVA_ANDROID)/' $(ANDROID_SRC)index.html
	sed -i '' 's/<!-- __CORDOVA_REPLACE__ -->/$(CORDOVA_IOS)/'     $(IOS_SRC)index.html

	sed -i '' 's/<!-- pushplugin replace -->/$(PUSHPLUGIN_JS)/' $(ANDROID_SRC)index.html
	sed -i '' 's/<!-- pushplugin replace -->/$(PUSHPLUGIN_JS)/' $(IOS_SRC)index.html

	mkdir -p $(IOS_SRC)scripts/vendor
	mkdir -p $(ANDROID_SRC)scripts/vendor
	cp $(SRC)/scripts/vendor/* $(IOS_SRC)scripts/vendor
	cp $(SRC)/scripts/vendor/* $(ANDROID_SRC)scripts/vendor

    # sicher ist sicher...
	rm -rf $(ANDROID_SRC)manifest.appcache
	rm -rf $(IOS_SRC)manifest.appcache

	rm -rf     $(IOS_SRC)webapp.html
	rm -rf $(ANDROID_SRC)webapp.html

	# remove bower components
	# rm -rf     $(IOS_SRC)components/
	# rm -rf $(ANDROID_SRC)components/


# ==============================================================================


### IOS TASKS ###
ios :
	@echo
	@echo "$(OK_COLOR)AtOneGo $(FINAL_VERSION) - building with cordova for ios directly...$(NO_COLOR)"
	./mobile/ios/cordova/build && ./mobile/ios/cordova/run

ios_build : build
	@echo
	@echo "$(OK_COLOR)AtOneGo $(FINAL_VERSION) - building with cordova for ios...$(NO_COLOR)"
	./mobile/ios/cordova/build
	tput bel
	./mobile/ios/cordova/run

ios_device : build
	@echo
	@echo "$(OK_COLOR)AtOneGo $(FINAL_VERSION) - building with cordova for ios directly. not running. use xcode to start on device after build...$(NO_COLOR)"
	./mobile/ios/cordova/build
	tput bel

# damn ... maybe sometimes...
# ios_device_direct :
#	/Volumes/Data/HOME/INFO/HACKING/TESTING/fruitstrap/fruitstrap -d -b mobile/ios/build/atonego.app


### ANDROID TASKS ###

android :
	@echo
	@echo "$(OK_COLOR)AtOneGo $(FINAL_VERSION) - building with cordova for android directly...$(NO_COLOR)"
	./mobile/android/cordova/build
	### ./mobile/android/cordova/run

android_build : build
	@echo
	@echo "$(OK_COLOR)AtOneGo $(FINAL_VERSION) - building with cordova for android...$(NO_COLOR)"
	./mobile/android/cordova/build
	tput bel
	### ./mobile/android/cordova/run

android_run :
	@echo
	@echo "$(OK_COLOR)AtOneGo $(FINAL_VERSION) - running on android - be careful - check first 'adb devices' for connected device $(NO_COLOR)"
	./mobile/android/cordova/run


### WEBAPP TASKS ###
# build the app for the web only (-;
webapp : jsbuild
	@echo
	@echo "$(OK_COLOR)AtOneGo $(FINAL_VERSION) - building the webapp... ?v=$(RANDOM_STR) $(NO_COLOR)"

	cp -rf $(DST)/* $(WEBAPP_SRC)

	### NOTE: production ODER staging hier!
	sed -i '' 's/development/production/' $(WEBAPP_SRC)webapp.html
	mv $(WEBAPP_SRC)webapp.html $(WEBAPP_SRC)index.html

	# some cache busting:
	# we replace the css/js includes with smt like: ?v=RAND0M_STRING
	sed -i '' 's/styles\/main.css/styles\/main.css?v=${RANDOM_STR}/' $(WEBAPP_SRC)index.html
	sed -i '' 's/XXXXXXXX/${RANDOM_STR}/' $(WEBAPP_SRC)index.html

	tput bel


### API DEPLOYMENT ###
# Deploy the api sources to the openshift server via git. (openshift.com/get-started)
# The folder "api_deployment" is just for copy & push.
# we develop in and run the node server locally from "api"
# Need to build the webapp first!
api_deploy : webapp
	cp -rf $(API_SRC)/*  $(API_DST)
	### NO! cp -rf $(API_SRC)/.* $(API_DST)
	cp -rf $(API_SRC)/.openshift $(API_DST)

	### cd ./api_deployment && git status

	### check status und ggf manuell deploy/push ?
	cd ./api_deployment && git status && git add -A && git commit -a -m "auto commit" && git push origin master

	### website build
	bash $(API_SRC)/server/build/run.sh

	tput bel

# run all tests
all_tests :
	@echo
	@echo "$(OK_COLOR)AtOneGo $(FINAL_VERSION) - running all tests. Please start the node server first. $(NO_COLOR)"

	# KABOOM
	npm test && ./casperjs/bin/casperjs test test/functional && ./node_modules/testem/testem.js ci

### run the bench-playground on the sim or device
bench :
	cp app/scripts/vendor/cordova.ios.js mobile/ios/www
	cp docs/bench/index.html mobile/ios/www
	make ios
