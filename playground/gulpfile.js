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
const vulcanize = require('gulp-vulcanize');
const gls = require('gulp-live-server');
const uglify = require('gulp-uglify');
const pump = require('pump');
const cleanCSS = require('gulp-clean-css');
const fs = require('fs');
const gutil = require('gulp-util');

const paths = {
  dist: {
    root: 'dist',
    img: 'dist/img',
    cache: '.cache'
  },
  src: 'src',
  sw: 'src/sw.js',
  img: 'src/img/**/*.{svg,png,jpg}',
  codemirror: 'node_modules/codemirror',
};

gulp.task('build:codemirror:css', function (cb) {
  if (fs.existsSync(paths.dist.cache + '/codemirror/lib/codemirror.js')) {
    gutil.log('codemirror js already minified');
    return gulp.src('.').pipe(gutil.noop());
  }
  pump([
    gulp.src(paths.codemirror + '/**/*.js', {base: paths.codemirror}),
    uglify(),
    gulp.dest(paths.dist.cache + '/codemirror')
  ],
    cb
  );
});

gulp.task('build:codemirror:js', function (cb) {
  if (fs.existsSync(paths.dist.cache + '/codemirror/lib/codemirror.css')) {
    gutil.log('codemirror css already minified');
    return gulp.src('.').pipe(gutil.noop());
  }
  pump([
    gulp.src(paths.codemirror + '/**/*.css', {base: paths.codemirror}),
    cleanCSS(),
    gulp.dest(paths.dist.cache + '/codemirror')
  ],
    cb
  );
});

gulp.task('build:vulcanize', ['build:codemirror:js', 'build:codemirror:css'], function () {
  return gulp.src(paths.src + '/index.html')
    .pipe(vulcanize({
      abspath: '',
      excludes: [],
      inlineScripts: true,
      inlineCss: true,
      stripExcludes: false
    }))
    .pipe(gulp.dest(paths.dist.root));
});

gulp.task('build:img', 'copy images', function() {
  return gulp.src(paths.img)
    .pipe(gulp.dest(paths.dist.img));
});

gulp.task('build:sw', 'copy sw.js', function() {
  return gulp.src(paths.sw)
    .pipe(gulp.dest(paths.dist.root));
});

gulp.task('build', 'Build the playground', [
  'build:sw',
  'build:img',
  'build:vulcanize'
]);

gulp.task('serve', 'starts a local webserver (--port specifies bound port)',
  function() {
    const port = 8000;
    const server = gls.static('.', port);
    server.start();
  });

gulp.task('default', 'Run a webserver', [
  'serve'
]);
