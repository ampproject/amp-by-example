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
const uglify = require('gulp-uglify');
const pump = require('pump');
const cleanCSS = require('gulp-clean-css');
const fs = require('fs');
const gutil = require('gulp-util');
const polymerBuild = require('polymer-build');
const polymerJson = require('./polymer.json');
const polymerProject = new polymerBuild.PolymerProject(polymerJson);
const mergeStream = require('merge-stream');
//var gulpServiceWorker = require('gulp-serviceworker');
const generateServiceWorker = polymerBuild.generateServiceWorker;


const paths = {
  dist: {
    dir: 'dist'
  },
  src: 'src'
};

gulp.task('build:polymer', 'Build the polymer app', function() {
  const polymer = 'polymer/**/*'
  let sourcesStream = polymerProject.sources()
  let dependenciesStream = polymerProject.dependencies()
  let buildStream = mergeStream(sourcesStream, dependenciesStream)
  return buildStream.pipe(gulp.dest(paths.dist.dir));
});

// gulp.task('generate-service-worker', ['build'], function() {
//   return gulp.src(['dist/*'])
//     .pipe(gulpServiceWorker({
//       rootDir: 'dist/',
//     }));
// });



gulp.task('build', 'Build the polymer app', [
  'build:polymer'
]);

function build() {
  gutil.log('Build!');
  return polymerBuild.generateServiceWorker({
      project: polymerProject,
      buildRoot: 'dist/',
      swPrecacheConfig: {
        // See https://github.com/GoogleChrome/sw-precache#options-parameter for all supported options
        navigateFallback: '/index.html',
      }
    })
    .then(() => {
      gutil.log('Build complete!');
    }).catch(e => gutil.log(e));
}


gulp.task('sw', 'generate sw', function(cb) {
  try {
    build().then(() => cb());
  } catch (e) {
    gutil.log(e);
  }
});

gulp.task('serve', 'starts a local webserver (--port specifies bound port)',
  function() {
    const port = 8000;
    const server = gls.static('.', port);
    server.start();
  });

gulp.task('default', 'Run a webserver', [
  'serve'
]);
