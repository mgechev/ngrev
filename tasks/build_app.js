'use strict';

var gulp = require('gulp');
var watch = require('gulp-watch');
var batch = require('gulp-batch');
var ts = require('gulp-typescript');
var plumber = require('gulp-plumber');
var jetpack = require('fs-jetpack');
var bundle = require('./bundle');
var utils = require('./utils');
// var ts = require('typescript');

var projectDir = jetpack;
var srcDir = jetpack.cwd('./src');
var distDir = jetpack.cwd('./dist');
var destDir = jetpack.cwd('./app');

gulp.task('bundle', function() {
  return Promise.all([
    bundle(distDir.path('background', 'parser.js'), destDir.path('parser.js')),
    bundle(distDir.path('background', 'app.js'), destDir.path('background.js')),
    bundle(distDir.path('ui', 'app.js'), destDir.path('app.js'))
  ]);
});

var tsProject = ts.createProject('tsconfig.json');

gulp.task('ts', function() {
  var tsResult = gulp.src('src/**/*.ts').pipe(tsProject());

  return tsResult.js.pipe(gulp.dest('dist'));
});

gulp.task('environment', function(done) {
  var configFile = 'config/env_' + utils.getEnvName() + '.json';
  projectDir.copy(configFile, destDir.path('env.json'), { overwrite: true });
  done();
});

gulp.task('watch', function() {
  var beepOnError = function(done) {
    return function(err) {
      if (err) {
        utils.beepSound();
      }
      done(err);
    };
  };

  watch(
    'src/**/*.ts',
    batch(function(events, done) {
      gulp.series('ts', 'bundle', done);
    })
  );
});

gulp.task('build', gulp.series('ts', 'bundle', 'environment'));
