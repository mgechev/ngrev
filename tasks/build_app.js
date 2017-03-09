'use strict';

var gulp = require('gulp');
var less = require('gulp-less');
var watch = require('gulp-watch');
var batch = require('gulp-batch');
var ts = require('gulp-typescript');
var plumber = require('gulp-plumber');
var jetpack = require('fs-jetpack');
var bundle = require('./bundle');
var utils = require('./utils');
var runsequence = require('run-sequence');
// var ts = require('typescript');

var projectDir = jetpack;
var srcDir = jetpack.cwd('./src');
var distDir = jetpack.cwd('./dist');
var destDir = jetpack.cwd('./app');

gulp.task('bundle', function () {
    return Promise.all([
        bundle(distDir.path('background.js'), destDir.path('background.js')),
        bundle(distDir.path('app.js'), destDir.path('app.js')),
    ]);
});

var tsProject = ts.createProject('tsconfig.json');

gulp.task('ts', function() {
    var tsResult = gulp.src('src/**/*.ts')
        .pipe(tsProject());
 
    return tsResult.js.pipe(gulp.dest('dist'));
});

gulp.task('less', function () {
    return gulp.src(srcDir.path('stylesheets/main.less'))
        .pipe(plumber())
        .pipe(less())
        .pipe(gulp.dest(destDir.path('stylesheets')));
});

gulp.task('environment', function () {
    var configFile = 'config/env_' + utils.getEnvName() + '.json';
    projectDir.copy(configFile, destDir.path('env.json'), { overwrite: true });
});

gulp.task('watch', function () {
    var beepOnError = function (done) {
        return function (err) {
            if (err) {
                utils.beepSound();
            }
            done(err);
        };
    };

    watch('src/**/*.ts', batch(function (events, done) {
        runsequence('ts', 'bundle', done);
    }));
    watch('src/**/*.less', batch(function (events, done) {
        gulp.start('less', beepOnError(done));
    }));
});

gulp.task('build', runsequence('ts', 'bundle', 'less', 'environment'));
