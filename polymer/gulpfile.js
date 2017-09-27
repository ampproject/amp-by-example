/**
 * Copyright 2017 Google Inc. All Rights Reserved.
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
const del = require('del');
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
const addServiceWorker = polymerBuild.addServiceWorker;
const gulpIf = require('gulp-if');
const htmlMinifier = require('gulp-html-minifier');

const paths = {
  dist: {
    dir: 'dist'
  },
  src: 'src'
};

function waitFor(stream) {
  return new Promise((resolve, reject) => {
    stream.on('end', resolve);
    stream.on('error', reject);
  });
}

gulp.task('build:polymer', build)

function build() {
  return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars

    // Lets create some inline code splitters in case you need them later in your build.
    let sourcesStreamSplitter = new polymerBuild.HtmlSplitter();
    let dependenciesStreamSplitter = new polymerBuild.HtmlSplitter();

    // Okay, so first thing we do is clear the build directory
    console.log(`Deleting ${paths.dist.dir} directory...`);
    del([paths.dist.dir])
      .then(() => {

        // Let's start by getting your source files. These are all the files
        // in your `src/` directory, or those that match your polymer.json
        // "sources"  property if you provided one.
        let sourcesStream = polymerProject.sources()
          .pipe(gulpIf(/\.html$/, htmlMinifier()));

        // Similarly, you can get your dependencies seperately and perform
        // any dependency-only optimizations here as well.
        let dependenciesStream = polymerProject.dependencies()

        // Okay, now let's merge your sources & dependencies together into a single build stream.
        let buildStream = mergeStream(sourcesStream,
            dependenciesStream)
          .once('data', () => {
            console.log('Analyzing build dependencies...');
          });

        // Okay, time to pipe to the build directory
        buildStream = buildStream.pipe(gulp.dest(paths.dist.dir));

        // waitFor the buildStream to complete
        return waitFor(buildStream);
      })
      .then(() => {
        // Okay, now let's generate the Service Worker
        console.log('Generating the Service Worker...');
        return polymerBuild.addServiceWorker({
          project: polymerProject,
          buildRoot: paths.dist.dir,
          swPrecacheConfig: {
            // See https://github.com/GoogleChrome/sw-precache#options-parameter for all supported options
            navigateFallback: '/index.html',
            staticFileGlobs: [
              'node_modules/@webcomponents/webcomponentsjs/*',
            ],
          }
        });
      })
      .then(() => {
        // You did it!
        console.log('Build complete!');
        resolve();
      });
  });
}

gulp.task('default', 'Run a webserver', [
  'serve'
]);
