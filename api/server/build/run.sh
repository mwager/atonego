
# Simple website build script for conc and minifying css/js via yui compressor
# Must be executed from doc root ! (Makefile...)

SRC="./api/server/website"

echo "1. build css"
rm -rf $SRC/css/tmp.css && touch $SRC/css/tmp.css

cat $SRC/css/normalize.css              >  $SRC/css/tmp.css
printf "\n"                             >> $SRC/css/tmp.css
cat $SRC/css/bootstrap.css              >> $SRC/css/tmp.css
printf "\n"                             >> $SRC/css/tmp.css
cat $SRC/css/bootstrap-responsive.css   >> $SRC/css/tmp.css
printf "\n"                             >> $SRC/css/tmp.css
cat $SRC/css/main.css                   >> $SRC/css/tmp.css
printf "\n"                             >> $SRC/css/tmp.css

# no minify...
# java -jar ./api/server/build/tools/yuicompressor-2.4.5.jar --charset="UTF-8" $SRC/css/tmp.css -o $SRC/css/build.css
mv $SRC/css/tmp.css $SRC/css/build.css

echo "2. create tmp.js for concat task"
rm -rf $SRC/js/tmp.js &&     touch $SRC/js/tmp.js

cat $SRC/js/vendor/jquery.js           >  $SRC/js/tmp.js
cat $SRC/js/vendor/bootstrap.js        >> $SRC/js/tmp.js
cat $SRC/js/vendor/underscore-min.js   >> $SRC/js/tmp.js
cat $SRC/js/main.js                    >> $SRC/js/tmp.js

echo "3. build js"
java -jar ./api/server/build/tools/yuicompressor-2.4.5.jar --preserve-semi --charset="UTF-8" $SRC/js/tmp.js -o $SRC/js/build.js

echo "4. remove tmp files"
rm -rf $SRC/css/tmp.css
rm -rf $SRC/js/tmp.js

echo "OK -> NOW SET ENV = PRODUCTION !";
