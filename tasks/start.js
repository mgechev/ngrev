'use strict';

var childProcess = require('child_process');
var electron = require('electron');
var gulp = require('gulp');

gulp.task('start', gulp.parallel('build', 'watch', function() {
  childProcess
    .spawn(electron, ['.'], {
      stdio: 'inherit'
    })
    .on('close', function() {
      // User closed the app. Kill the host process.
      process.exit();
    });
}));
