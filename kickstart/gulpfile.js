/**
 * Copyright 2016 The AMP HTML Authors. All Rights Reserved.
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

const gulp = require('gulp-help')(require('gulp'));
const del = require('del');
const mustache = require('gulp-mustache');
const posthtml = require('gulp-posthtml');
const postcss = require('gulp-postcss');
const runSequence = require('run-sequence');

function getData() {
  return JSON.parse(require('fs').readFileSync('data.json'));
}

const config = {
  src: {
    templates: '{templates,components}/**/*.html',
    css: '{css,components}/**/*.css',
    data: 'data.json',
    img: 'img/**',
  },
  dest: {
    default: 'dist',
    templates: 'dist',
    css: 'dist',
    img: 'dist/img/',
  },
};

gulp.task('build', 'build', function(cb) {
  runSequence('clean', 'img', 'postcss', 'posthtml', cb);
});

gulp.task('clean', function() {
  return del(['dist']);
});

gulp.task('img', function() {
  return gulp.src(config.src.img).pipe(gulp.dest(config.dest.img));
});

gulp.task('watch', 'watch stuff', ['build'], function() {
  return gulp.watch([config.src.templates, config.src.css, config.src.data],
      ['build']);
});

gulp.task('default', ['build']);

gulp.task('posthtml', 'build kickstart files', function() {
  const plugins = [
    require('posthtml-inline-assets')({
      from: config.dest.templates,
      inline: {
        script: { check: function() { return false; } },
      }
    }),
    require('posthtml-include')(),
  ];
  const options = {};
  return gulp.src(config.src.templates)
    .pipe(mustache(getData()))
    .pipe(posthtml(plugins, options))
    .pipe(gulp.dest(config.dest.templates))
});

gulp.task('postcss', 'build postcss files', function() {
  const plugins = [
    require('postcss-import')(),
    require('autoprefixer')(),
    require('postcss-calc')(),
    require('postcss-color-function')(),
    require('postcss-custom-properties')(),
    require('postcss-discard-comments')(),
    require('postcss-custom-media')(),
    require('cssnano')(),
  ];
  const replace = require('gulp-replace');
  const options = {};
  return gulp.src(config.src.css)
    .pipe(postcss(plugins, options))
    .pipe(replace('!important', ''))
    .pipe(gulp.dest(config.dest.css))
});

function serve() {
  var app = require('express')();
  var webserver = require('gulp-webserver');

  var host = 'localhost';
  var port = process.env.PORT || 8000;
  var server = gulp.src(process.cwd())
      .pipe(webserver({
        port,
        host,
        directoryListing: true,
        livereload: true,
        https: false,
        middleware: [app],
      }));

  return server;
}

gulp.task('serve', serve);
