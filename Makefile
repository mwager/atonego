# ------------------------------------------------------------------------------
# AtOneGo Makefile
#
# Optimize sources via grunt, copying src or optimized src to phonegap's
# "www" folder, building and running via phonegap's cli tools,
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
CORDOVA_SRC         = mobile/www/
WEBAPP_SRC          = api/server/website/app/
ABSOLUTE_WEB_PATH   = http:\/\/127.0.0.1\/atonego\/app\/

API_SRC             = api
API_DST             = api_deployment
CORDOVA_INCLUDE     = <script src="cordova.js"><\/script>

RANDOM_STR          = $(shell /bin/bash -c "echo $$RANDOM")

# the push plugin javascript code from https://github.com/phonegap-build/PushPlugin
PUSHPLUGIN_JS       = <script src="scripts\/vendor\/PushNotification.js"><\/script>

# FINAL_VERSION = $(shell git describe --tags --long)-$(shell git log --oneline | wc -l | tr -d ' ')
FINAL_VERSION       = $(shell git describe --abbrev=0)


clean :
	@echo
	@echo "$(OK_COLOR)AtOneGo $(FINAL_VERSION) - cleaning up...$(NO_COLOR)"

	rm -rf dist

	# do not delete www/config.xml
	rm -rf $(CORDOVA_SRC)index.html
	rm -rf $(CORDOVA_SRC)images
	rm -rf $(CORDOVA_SRC)fonts
	rm -rf $(CORDOVA_SRC)scripts
	rm -rf $(CORDOVA_SRC)styles


# Dieser Task kopiert neben den App-Quellen auch die Test-Quellen
# in die jeweiligen Plattform-Verzeichnisse. Dadurch kann man die Testsuite
# auf echten Geräten ausführen (-:
# NOTE: Nach diesem Task muss die entsprechende "config.xml" pro Plattform
# noch angepasst werden: anstatt index.html muss "test/index.html"
# geladen werden
test_build : clean
    # 1. copy /app und /test to mobile "www"
	cp -rf $(SRC) $(CORDOVA_SRC)
	cp -rf $(TEST) $(CORDOVA_SRC)

	# include project specific cordova js stuff in testsuites!
	### include cordova js
	sed -i '' 's/<!-- __CORDOVA_REPLACE__ -->/$(CORDOVA_INCLUDE)/' $(CORDOVA_SRC)index.html
	sed -i '' 's/<!-- pushplugin replace -->/$(PUSHPLUGIN_JS)/' $(CORDOVA_SRC)index.html

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
	@echo "$(ERROR_COLOR)====================================================$(NO_COLOR)"
	@echo "$(ERROR_COLOR)WARNING: just copying the raw app sources to 'dist'!$(NO_COLOR)"
	@echo "$(ERROR_COLOR)====================================================$(NO_COLOR)"

	mkdir $(DST)
	cp -rf $(SRC)/* $(DST)


### copy optimized src to phonegap android/ios directories
build : jsbuild
	@echo
	@echo "$(OK_COLOR)AtOneGo $(FINAL_VERSION) - copy the build product to phonegap platform destinations$(NO_COLOR)"
	@echo

	# the folder /dist should now exist, just copy to phonegap's www folder
	cp -rf $(DST)/* $(CORDOVA_SRC)

	### NOTE: production ODER staging hier!
	sed -i '' 's/development/production/' $(CORDOVA_SRC)index.html


	### include cordova js
	sed -i '' 's/<!-- __CORDOVA_REPLACE__ -->/$(CORDOVA_INCLUDE)/' $(CORDOVA_SRC)index.html
	sed -i '' 's/<!-- pushplugin replace -->/$(PUSHPLUGIN_JS)/' $(CORDOVA_SRC)index.html

	# need to copy the vendor stuff manually after the grunt build has finished
	mkdir -p $(CORDOVA_SRC)scripts/vendor
	cp $(SRC)/scripts/vendor/* $(CORDOVA_SRC)scripts/vendor

	rm -rf $(CORDOVA_SRC)webapp.html


# ==============================================================================


### IOS TASKS ###
ios :
	@echo
	@echo "$(OK_COLOR)AtOneGo $(FINAL_VERSION) - building with cordova for ios directly...$(NO_COLOR)"
	cd mobile && cordova -d build ios  # && cordova -d run ios

ios_build : build
	@echo
	@echo "$(OK_COLOR)AtOneGo $(FINAL_VERSION) - building with cordova for ios...$(NO_COLOR)"
	cd mobile && cordova -d  build ios && cordova -d run ios

ios_device : build
	@echo
	@echo "$(OK_COLOR)AtOneGo $(FINAL_VERSION) - building with cordova for ios directly. not running. use xcode to start on device after build...$(NO_COLOR)"
	cd mobile && cordova -d build ios
	tput bel


### ANDROID TASKS ###

android :
	@echo
	@echo "$(OK_COLOR)AtOneGo $(FINAL_VERSION) - building with cordova for android directly...$(NO_COLOR)"
	cd mobile && cordova -d build android


android_build : build
	@echo
	@echo "$(OK_COLOR)AtOneGo $(FINAL_VERSION) - building with cordova for android...$(NO_COLOR)"
	cd mobile && cordova -d build android
	tput bel

android_run :
	@echo
	@echo "$(OK_COLOR)AtOneGo $(FINAL_VERSION) - running on android - be careful - check 'adb devices' for connected device first! $(NO_COLOR)"
	cd mobile && cordova -d run android


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

	### TODO nicht VOR DEM COMMIT!?
	### website build
	bash $(API_SRC)/server/build/run.sh

	tput bel

api_restart :
	# rhc app restart -a atonego
	rhc app force-stop atonego
	rhc app start atonego

# Run all tests
all_tests :
	@echo
	@echo "$(OK_COLOR)AtOneGo $(FINAL_VERSION) - running all tests. Please start the node server first. $(NO_COLOR)"

	# KABOOM
	npm test && ./casperjs/bin/casperjs test test/functional && ./node_modules/testem/testem.js ci

# On travis, we only run the node- and testem-tests.
# The casper testsuite can only be run locally (yet)
travis_tests :
	@echo
	@echo "$(OK_COLOR)AtOneGo $(FINAL_VERSION) - running tests on travis: node and testem. $(NO_COLOR)"

	npm test && ./node_modules/testem/testem.js ci

	# XXX this is a bit tricky because the api is already running,
	# but the app sources must also be served by some web server
	# on travis from /app/*
	# ------------------------------------------------------------
	# ./casperjs/bin/casperjs test test/functional

### Run the bench-playground on the sim or device
bench :
	cp app/scripts/vendor/cordova.ios.js mobile/ios/www
	cp docs/bench/index.html mobile/ios/www
	make ios
