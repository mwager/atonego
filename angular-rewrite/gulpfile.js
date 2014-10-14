/**
 * AtOneGo gulpfile
 */
var gulp       = require('gulp');
var gutil      = require('gulp-util');
var bower      = require('bower');
var concat     = require('gulp-concat');
var sass       = require('gulp-sass');
var minifyCss  = require('gulp-minify-css');
var rename     = require('gulp-rename');
var sh         = require('shelljs');
var browserify = require('gulp-browserify');
var exec       = require('gulp-exec');

var paths = {
  sass: ['./scss/**/*.scss'],
  js: ['./www/js/**/*.js']
};

gulp.task('default', ['sass']);

gulp.task('sass', function(done) {
  gulp.src('./scss/ionic.app.scss')
    .pipe(sass())
    .on('error', function() {
      console.error('>>>>> SASS ERROR', arguments);
    })
    .pipe(gulp.dest('./www/css/'))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('./www/css/'))
    .on('end', done);
});

// browserify task
gulp.task('scripts', function() {
  // Single entry point to browserify
  gulp.src('./www/js/app.js')
    .pipe(browserify({
      insertGlobals : true,
      debug : !gulp.env.production
    }))
    .on('error', function() {
      console.error('>>>>> JAVASCRIPT ERROR', arguments);
    })
    .pipe(gulp.dest('./www/build'))
});

gulp.task('watch', function() {
  gulp.watch(paths.sass, ['sass']);
  gulp.watch(paths.js, ['scripts']);
});

gulp.task('install', ['git-check'], function() {
  return bower.commands.install()
    .on('log', function(data) {
      gutil.log('bower', gutil.colors.cyan(data.id), data.message);
    });
});

// dev helper (run this while developing)
// old: gulp scripts && gulp sass && gulp watch && tput bel
gulp.task('dev', ['scripts', 'sass'], function() {
  setTimeout(function() {
    console.log('starting watch...');
    gulp.run('watch');
  }, 10);

  console.log('starting ionic...');
  gulp.src('./**/**')
    // .pipe(exec('git checkout <%= file.path %> <%= options.customTemplatingThing %>',
    .pipe(exec('ionic serve',
    {
      continueOnError:  true, // default = false, true means don't emit error event
      pipeStdout:       false, // default = false, true means stdout is written to file.contents
      // customTemplatingThing:    "test" // content passed to gutil.template()
    }))
    .pipe(exec.reporter({
      err: true, // default = true, false means don't write err
      stderr: true, // default = true, false means don't write stderr
      stdout: true // default = true, false means don't write stdout
    }));
});


gulp.task('git-check', function(done) {
  if (!sh.which('git')) {
    console.log(
      '  ' + gutil.colors.red('Git is not installed.'),
      '\n  Git, the version control system, is required to download Ionic.',
      '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
      '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
    );
    process.exit(1);
  }
  done();
});
