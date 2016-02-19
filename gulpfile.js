/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use strict";

const gulp = require('gulp-help')(require('gulp'));
const gls = require('gulp-live-server');
const file = require('gulp-file');
const rename = require('gulp-rename');
const del = require('del');
const cache = require('gulp-cached');
const shell = require('gulp-shell');
const jasmine = require('gulp-jasmine');
const eslint = require('gulp-eslint');
const gutil = require('gulp-util');
const gulpIf = require('gulp-if');
const favicons = require("gulp-favicons")
const runSequence = require('run-sequence');

const index = require('./tasks/compile-index');
const compileExample = require('./tasks/compile-example');
const createExample = require('./tasks/create-example');
const FileName = require('./tasks/lib/FileName');

gulp.task('serve', 'starts a local webserver', function() {
  const server = gls.static('dist', 8000);
  server.start();
  gulp.watch(['dist/*.html', 'dist/img/*.{png,jpg,gif}', 'dist/video/*.{mp4,webm}'], function(file) {
    /* eslint-disable */
    server.notify.apply(server, [file]);
    /* eslint-enable */
  });
});

gulp.task('deploy', function(callback) {
  runSequence('clean',
              'build',
              'deploy-to-app-engine',
              callback);
});

gulp.task('deploy-to-app-engine', 'deploy to app engine', shell.task([
  'goapp deploy'
]));

gulp.task('copyImages', 'copy example images', function() {
  return gulp.src('src/img/*.{png,jpg,gif}')
    .pipe(cache('img'))
    .pipe(gulp.dest('dist/img'));
});

gulp.task('copyVideos', 'copy example videos', function() {
  return gulp.src('src/video/*.{mp4,webm}')
    .pipe(cache('video'))
    .pipe(gulp.dest('dist/video'));
});

gulp.task('copyLicense', 'copy license', function() {
  return gulp.src('LICENSE')
    .pipe(cache('static'))
    .pipe(rename(function(path) {
      path.extname = ".txt";
    }))
    .pipe(gulp.dest('dist'));
});

gulp.task('copyStaticFiles', 'copy static files', function() {
  return gulp.src('static/*.txt')
    .pipe(cache('static'))
    .pipe(gulp.dest('dist'));
});

gulp.task("favicons", function () {
    return gulp.src("src/img/favicon.png")
      .pipe(cache('static'))
      .pipe(favicons({
        appName: "AMP by Example",
        appDescription: "Accelerated Mobile Pages in Action",
        developerName: "Sebastian Benz",
        developerURL: "http://sebastianbenz.de/",
        background: "#fff",
        path: "favicons/",
        url: "http://amp-by-example.appspot.com/",
        display: "standalone",
        orientation: "portrait",
        version: 1.0,
        logging: false,
        online: false,
        html: "favicons.html",
        pipeHTML: true,
        replace: true
      }))
      .on("error", gutil.log)
      .pipe(gulp.dest("dist/favicons"));
});

gulp.task('compileHtml', 'compile example html files', function() {
  return gulp.src('src/*.html')
    .pipe(compileExample('./src/templates/', 'example.html'))
    .pipe(gulp.dest('dist'));
});

gulp.task('generateIndex', 'generate index.html', function() {
  return gulp.src('src/*.html')
    .pipe(index('index.html', './src/templates/', 'index.html'))
    .pipe(gulp.dest('dist'));
});

gulp.task('create', 'create a new AMP example', function() {
  const title = process.argv[4];
  return file(FileName.fromString(title) + '.html', '', {src: true})
    .pipe(createExample('./src/templates/', 'new-example.html'))
    .pipe(gulp.dest('src'));
});

gulp.task('clean', 'delete all generated resources', function() {
  cache.caches = {};
  return del(['dist']);
});

gulp.task('watch', 'watch for changes in the examples', function() {
  gulp.watch(['src/**/*.html', 'src/**/*.css'],
             ['compileHtml', 'generateIndex']);
  gulp.watch('src/img/*.{png,jpg,gif}', ['copyImages']);
});

gulp.task('test', function() {
  return gulp.src('spec/**/*Spec.js')
    .pipe(jasmine());
});

gulp.task('lint', function() {
  const hasFixFlag = (process.argv.slice(2).indexOf('--fix') >= 0);
  let errorsFound = false;
  return gulp.src(['tasks/**/*.js'], {base: './'})
    .pipe(eslint({fix: hasFixFlag}))
    .pipe(eslint.formatEach('stylish', function(msg) {
      errorsFound = true;
      gutil.log(gutil.colors.red(msg));
    }))
    .pipe(gulpIf(isFixed, gulp.dest('.')))
    .on('end', function() {
      if (errorsFound && !hasFixFlag) {
        gutil.log(gutil.colors.blue('Run `gulp lint --fix` to automatically ' +
        'fix some of these lint warnings/errors. This is a destructive ' +
        'operation (operates on the file system) so please make sure ' +
        'you commit before running.'));
        process.exit(1);
      }
    });
});

gulp.task('default',
          'Run a webserver and watch for changes',
          ['build', 'watch', 'serve']);

gulp.task('build',
          'build all resources',
          ['copyImages', 'copyVideos', 'compileHtml', 'generateIndex', 'copyLicense', 'copyStaticFiles', 'favicons']);

function isFixed(file) {
  return file.eslint.fixed;
}

