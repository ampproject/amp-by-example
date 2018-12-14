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

'use strict';

const gulp = require('gulp');
const serve = require('serve');
const file = require('gulp-file');
const rename = require('gulp-rename');
const del = require('del');
const cache = require('gulp-cached');
const jasmine = require('gulp-jasmine');
const eslint = require('gulp-eslint');
const gutil = require('gulp-util');
const gulpIf = require('gulp-if');
const gulpIgnore = require('gulp-ignore');
const favicons = require('gulp-favicons');
const argv = require('yargs').argv;
const path = require('path');
const fs = require('fs');
const change = require('gulp-change');
const grun = require('gulp-run');
const htmlmin = require('gulp-htmlmin');
const htmlhint = require('gulp-htmlhint');
const compileExample = require('./tasks/compile-example');
const sitemap = require('./tasks/compile-sitemap');
const createExample = require('./tasks/create-example');
const FileName = require('./lib/FileName');
const Metadata = require('./lib/Metadata');
const ExampleFile = require('./lib/ExampleFile');
const gulpAmpValidator = require('gulp-amphtml-validator');
const Templates = require('./lib/Templates');

const PROD = 'prod';

const paths = {
  dist: {
    dir: 'dist',
    css: 'dist/css',
    html: 'dist/**/*.html',
    samples: ['dist/**/*.html'],
    img: 'dist/img',
    video: 'dist/video',
    json: 'dist/json',
    favicons: 'dist/favicons',
    fonts: 'dist/fonts',
    wellknown: 'dist/.well-known',
  },
  nodeModules: ['sw-toolbox'],
  images: 'src/img/*.{png,jpg,gif,svg}',
  favicon: 'src/img/favicon.png',
  samples: 'src/**/*.html',
  metadata: 'src/**/*.json',
  playground: 'playground',
  boilerplate: 'boilerplate-generator',
  src: 'src',
  scripts: [
    'tasks/**/*.js',
    'gulpfile.js',
    'boilerplate-generator/*.js',
    'boilerplate-generator/lib/**/*.js',
  ],
  static: 'static/**/*.*',
  templates: {
    dir: 'templates',
    files: ['templates/**/*.css', 'templates/**/*.html'],
    html: 'templates/**/*.html',
  },
  api: {
    conf: 'api/conf.json',
    dir: 'api',
    src: 'api/src/**/*.*',
    dist: 'api/dist',
  },
  packager: {
    dist: 'packager/dist',
  },
  tmp: {
    dir: 'tmp',
  },
  videos: 'src/video/*.{mp4,webm,m3u8,ts,vtt}',
  json: 'src/json/*.json',
  css: 'templates/css/*.css',
  fonts: 'src/fonts/*.ttf',
  wellknown: '.well-known/assetlinks.json',
};

const config = {
  templates: {
    root: paths.templates.dir,
    index: 'index.html',
    example: 'example.html',
    newExample: 'new-example.html',
    preview: 'preview.html',
  },
  api: {
    host: 'https://amp-by-example-api.appspot.com',
    dist: 'api/dist',
  },
  a4a: {
    template: 'preview-a4a.html',
    defaultLayout: 'fixed',
    defaultWidth: 300,
    defaultHeight: 250,
  },
  amp4email: {
    template: 'preview-amp4email.html',
    defaultLayout: 'fixed',
    defaultWidth: 832,
  },
  host: 'https://ampbyexample.com',
};

const sampleTemplates = Templates.get(config.templates.root, /* minify */ false,
    '<% %>');


gulp.task('serve', () => {
  serve(paths.dist.dir, {
    port: argv.port || 8000,
    ignore: ['node_modules'],
  });
});

gulp.task('serve:api', () => {
  serve(paths.api.dist, {
    port: 8800,
    ignore: ['node_modules'],
  });
});

gulp.task('deploy:prod', callback => {
  config.env = PROD;
  return gulp.series('clean',
      'robots:allow',
      'build',
      'deploy:site:prod',
      'deploy:api:prod',
      'build:sxg',
      'deploy:sxg:prod')(callback);
});

gulp.task('deploy:staging', callback => {
  config.env = PROD;
  config.appId = 'amp-by-example-staging';
  config.host = 'https://' + config.appId + '.appspot.com';
  return gulp.series('clean',
      'robots:disallow',
      'build',
      'deploy:site:staging')(callback);
});

gulp.task('conf:encode', () => {
  return run('openssl aes-256-cbc -e -in ' + paths.api.conf + ' -out ' +
    paths.api.conf + '.enc -pass env:AMP_BY_EXAMPLE_DEPLOY_KEY').exec();
});

gulp.task('conf:decode', () => {
  return run('openssl aes-256-cbc -d -in ' + paths.api.conf + '.enc -out ' +
    paths.api.conf + ' -pass env:AMP_BY_EXAMPLE_DEPLOY_KEY').exec();
});

gulp.task('deploy:site:prod', () => {
  return run('goapp deploy -application  amp-by-example -version 1').exec();
});

gulp.task('deploy:api:prod', () => {
  return run(
      'cd api && goapp deploy -application  amp-by-example-api -version 1')
      .exec();
});

gulp.task('deploy:sxg:prod', () => {
  const privkey = 'packager/certs/privkey.pem.enc';
  const cert = 'packager/certs/cert.pem.enc';
  if (!fs.existsSync(privkey) || !fs.existsSync(cert)) {
    throw Error([
      `Encrypted private keys (${privkey}, ${cert})`,
      'required for SXG are missing',
    ].join(' '));
  }
  return run(
      'cd packager && gcloud app deploy -q --project amp-by-example-sxg')
      .exec();
});

gulp.task('deploy:site:staging', () => {
  return run('goapp deploy -application ' + config.appId + ' -version 1')
      .exec();
});

gulp.task('copy:images', () => {
  return gulp.src(paths.images)
      .pipe(cache('img'))
      .pipe(gulp.dest(paths.dist.img));
});

gulp.task('copy:videos', () => {
  return gulp.src(paths.videos)
      .pipe(cache('video'))
      .pipe(gulp.dest(paths.dist.video));
});

gulp.task('copy:json', () => {
  return gulp.src(paths.json)
      .pipe(cache('json'))
      .pipe(gulp.dest(paths.dist.json));
});

gulp.task('copy:css', () => {
  return gulp.src(paths.css)
      .pipe(cache('css'))
      .pipe(gulp.dest(paths.dist.css));
});

gulp.task('copy:node-modules', () => {
  const modules = paths.nodeModules.map(
      module => 'node_modules/' + module + '/**/*'
  );
  return gulp.src(modules, {
    base: 'node_modules',
  }).pipe(gulp.dest(paths.dist.dir));
});

gulp.task('copy:fonts', () => {
  return gulp.src(paths.fonts)
      .pipe(cache('fonts'))
      .pipe(gulp.dest(paths.dist.fonts));
});

gulp.task('copy:well-known', () => {
  return gulp.src(paths.wellknown)
      .pipe(cache('wellknown'))
      .pipe(gulp.dest(paths.dist.wellknown));
});

gulp.task('copy:license', () => {
  return gulp.src('LICENSE')
      .pipe(cache('license'))
      .pipe(rename(path => {
        path.extname = '.txt';
      }))
      .pipe(gulp.dest(paths.dist.dir));
});

gulp.task('copy:static', () => {
  return gulp.src(paths.static)
      .pipe(gulpIf(isHtml, change(prerenderTemplates)))
      .pipe(cache('static'))
      .pipe(gulp.dest(paths.dist.dir));
});

gulp.task('copy:api', () => {
  return gulp.src(paths.api.src)
      .pipe(cache('api'))
      .pipe(gulp.dest(paths.api.dist));
});

function isHtml(file) {
  return file.path.endsWith('.html');
}

function prerenderTemplates(string) {
  return sampleTemplates.renderString(string, config);
}

gulp.task('compile:favicons', () => {
  return gulp.src(paths.favicon)
      .pipe(cache('favicons'))
      .pipe(favicons({
        'appName': 'AMP by Example',
        'appDescription': 'Accelerated Mobile Pages in Action',
        'developerName': 'Sebastian Benz',
        'developerURL': 'http://sebastianbenz.de/',
        'background': '#ffffff',
        'path': '/favicons',
        'url': Metadata.HOST,
        'display': 'standalone',
        'orientation': 'none',
        'version': 1.0,
        'logging': false,
        'online': false,
        'html': 'favicons.html',
        'pipeHTML': true,
        'replace': true,
        'icons': {
          'opengraph': false,
          'twitter': false,
        },
      }))
      .on('error', gutil.log)
      .pipe(gulp.dest(paths.dist.favicons));
});

const shouldIgnoreSample = function(file) {
  if (!file.path.endsWith('.html')) {
    return true;
  }
  if (file.path.endsWith('/source/index.html')) {
    return true;
  }
  const metadata = file.metadata;
  if (!metadata) {
    return false;
  }
  if (!metadata.experiments && !metadata.skipValidation) {
    return false;
  }
  gutil.log(gutil.colors.yellow('IGNORED') + ' ' + file.relative);
  return true;
};

gulp.task('validate:example', () => {
  return gulp.src(paths.samples)
      .pipe(compileExample(config))
      .pipe(gulpIgnore.exclude(shouldIgnoreSample))
  // Valide the input and attach the validation result to the "amp" property
  // of the file object.
      .pipe(gulpAmpValidator.validate())
  // Print the validation results to the console.
      .pipe(gulpAmpValidator.format())
  // Exit the process with error code (1) if an AMP validation error
  // occurred.
      .pipe(gulpAmpValidator.failAfterError());
});

function shouldMinifyHtml(file) {
  if (config.env !== PROD) {
    return false;
  }
  if (!file.path.endsWith('.html')) {
    return false;
  }
  if (file.path.endsWith('/source/index.html')) {
    return false;
  }
  return true;
}

gulp.task('compile:example', () => {
  return gulp.src(paths.samples)
      .pipe(compileExample(config))
      .pipe(gulpIf(shouldMinifyHtml, htmlmin({
        collapseWhitespace: true,
        minifyCSS: true,
        caseSensitive: true,
      })))
      .pipe(gulp.dest(paths.dist.dir));
});

gulp.task('compile:sitemap', () => {
  return gulp.src(paths.samples)
      .pipe(sitemap(config))
      .pipe(gulp.dest(paths.dist.dir));
});

gulp.task('create', () => {
  const title = argv.n || argv.name;
  const fileName = FileName.fromString(title);
  if (!fileName) {
    throwInvalidArgumentError('example name missing');
  }
  let examplePath;
  const dest = argv.d || argv.dest;
  const category = argv.c || argv.category;
  if (dest) {
    examplePath = path.join(path.basename(dest), fileName);
  } else if (category) {
    examplePath = FileName.fromString(category, title);
  } else {
    throwInvalidArgumentError('example category or directory missing');
  }
  return file(examplePath, '', {
    src: true,
  })
      .pipe(createExample(paths, config))
      .pipe(gulp.dest(paths.src));
});

function throwInvalidArgumentError(message) {
  throw new gutil.PluginError({
    plugin: 'create',
    message: gutil.colors.red('\nError: ' + message + '\n\n') +
    gutil.colors.blue('create a new category:\n') +
    'gulp create -n "The Name" -c "The Category"\n\n' +
    gutil.colors.blue('add to existing category:\n') +
    'gulp create -n "The Name" -d src/directory',
  });
}

gulp.task('clean', () => {
  cache.caches = {};
  return del([paths.dist.dir, paths.packager.dist, config.api.dist]);
});

gulp.task('watch', () => {
  gulp.watch(
      [paths.samples, paths.templates.files, paths.metadata],
      gulp.series('compile:example')
  );
  gulp.watch(paths.images, gulp.series('copy:images'));
  gulp.watch(paths.json, gulp.series('copy:json'));
  gulp.watch(paths.videos, gulp.series('copy:videos'));
  gulp.watch(paths.static, gulp.series('copy:static'));
});

gulp.task('test', () => {
  return gulp.src('spec/**/*Spec.js')
      .pipe(jasmine());
});

gulp.task('test2', () => {
  return gulp.src('spec/**/*Spec.js')
      .pipe(jasmine({
        includeStackTrace: true,
      }));
});

gulp.task('lint', () => {
  const hasFixFlag = argv.fix;
  let errorsFound = false;
  return gulp.src(paths.scripts, {
    base: './',
  })
      .pipe(eslint({
        fix: hasFixFlag,
      }))
      .pipe(eslint.formatEach('stylish', msg => {
        errorsFound = true;
        gutil.log(gutil.colors.red(msg));
      }))
      .pipe(gulpIf(isFixed, gulp.dest('.')))
      .on('end', () => {
        if (errorsFound && !hasFixFlag) {
          gutil.log(gutil.colors.blue('Run `gulp lint --fix` to ' +
          'fix some of these lint warnings/errors. This is a destructive ' +
          'operation (operates on the file system) so please make sure ' +
          'you commit before running.'));
          process.exit(1);
        }
      });
});

gulp.task('lint:backend', () => {
  /* gofmt only returns non zero status on syntax error */
  return run('test -z $(gofmt -l $(find . -name \'*.go\'))').exec();
});

gulp.task('lint:html', () => {
  return gulp.src([paths.samples].join(paths.dist.samples))
      .pipe(htmlhint({
        'doctype-first': false,
        'title-require': false,
        'attr-lowercase': false,
      }))
      .pipe(htmlhint.failReporter());
});


gulp.task('default', callback => {
  config.host = 'http://localhost:8000';
  config.api.host = 'http://localhost:8800';
  return gulp.parallel(
      'serve',
      'serve:api',
      'build',
      'watch')(callback);
});

gulp.task('backend:watch', callback => {
  config.host = 'http://localhost:8080';
  config.api.host = 'http://localhost:8800';
  return gulp.parallel(
      'serve:api',
      'build',
      'watch',
      'backend:serve')(callback);
});

gulp.task('backend:serve', () => {
  return run('dev_appserver.py app.yaml').exec();
});

gulp.task('api:serve', () => {
  return run('cd api && dev_appserver.py app.yaml --admin_port=8100').exec();
});

gulp.task('validate', gulp.series(
    'test',
    'validate:example',
    'lint',
    'lint:backend',
    'lint:html',
    'test'
));

gulp.task('robots:disallow', () => {
  return generateRobotsTxt(`User-Agent: *
      Disallow: /
      `);
});

gulp.task('robots:allow', () => {
  return generateRobotsTxt(`User-Agent: *
      Disallow:
      `);
});

gulp.task('build:playground', () => {
  const playgroundDist = '../dist/' + paths.playground;
  return run(
      'cd ' + paths.playground + ' && ' +
      'npm i && ' +
      'npm run-script build && ' +
      'mkdir -p ../' + paths.dist.dir + ' && ' +
      'rm -rf ' + playgroundDist + ' && ' +
      'cp -R dist ' + playgroundDist
  ).exec();
});

gulp.task('build:boilerplate-generator', () => {
  const boilerplateDist = '../dist/boilerplate';
  return run(
      'cd ' + paths.boilerplate + ' && ' +
          'npm i && ' +
          'node build.js && ' +
          'mkdir -p ../' + paths.dist.dir + ' && ' +
          'rm -rf ' + boilerplateDist + ' && ' +
          'cp -R dist ' + boilerplateDist
  ).exec();
}
);

gulp.task('build:sxg', () => {
  return gulp.src(paths.dist.html)
      .pipe(gulpAmpValidator.validate())
      .pipe(gulpIgnore.exclude(function(file) {
        return file.ampValidationResult.status !== 'PASS';
      }))
      .pipe(gulp.dest(paths.packager.dist));
});

function generateRobotsTxt(contents) {
  return file('robots.txt', contents, {
    src: true,
  })
      .pipe(gulp.dest('dist'));
}

/* adds a title link to all sample files */
function performChange(content) {
  const exampleFile = ExampleFile.fromPath(this.file.path);
  const match = content.match(/<!---([\s\S]*)?--->/);
  if (!match) {
    return content;
  }
  gutil.log('changing', exampleFile.title);
  const frontmatter = JSON.parse(match[1]);
  const yaml = require('js-yaml');
  const yamlFrontmatter = `<!---

${yaml.safeDump(frontmatter)}
--->
${content.substring(match[0].length)}`;
  /*
  if (!/<title>/.test(content)) {
    content = content.replace(/<meta charset="utf-8">/g,
        '<meta charset="utf-8">\n  <title>' + exampleFile.title() + '</title>');
  }
  */
  return yamlFrontmatter;
}

gulp.task('change', () => {
  return gulp.src('src/**/*.html')
      .pipe(change(performChange))
      .pipe(gulp.dest('src/'));
});

gulp.task('build', gulp.parallel(
    'copy:images',
    'copy:videos',
    'copy:json',
    'copy:css',
    'copy:api',
    'copy:fonts',
    'copy:node-modules',
    'copy:license',
    'copy:static',
    'compile:favicons',
    'compile:sitemap',
    'compile:example',
    'copy:well-known',
    'build:playground',
    'build:boilerplate-generator'
));

function run(command) {
  return grun(command, {
    verbosity: 3,
  });
}

function isFixed(file) {
  return file.eslint.fixed;
}

