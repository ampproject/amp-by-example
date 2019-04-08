const URL = require('url').URL;
const glob = require('glob').sync;
const {join, resolve} = require('path');
const {writeFileSync} = require('fs');

function calculateTarget(string) {
  if (string.startsWith('amp.dev')) {
    string = string.substring(7);
  }
  if (string.endsWith('/index.html')) {
    string = string.replace('index.html', '');
  }
  const url = new URL(string, 'https://amp.dev');
  url.searchParams.set('referrer', 'ampbyexample.com');
  return url.toString();
}

function redirectStatic(rootDir, destDir, prefix='') {
  let staticFiles = glob('/**/*.*', {root: rootDir});
  staticFiles = staticFiles.map(f => f.substring(rootDir.length));
  for (let source of staticFiles) {
    if (source.startsWith('google') || source.startsWith('login')) {
      continue;
    }
    const target = join(destDir, source);
    source = join('/' + prefix, source);
    result.push({
      source,
      target,
    });
  }
}



const redirects = require('./source.json');
const existing = require('../redirects.json');

const result = [];

for (let [key, value] of Object.entries(existing)) {
  if (existing.hasOwnProperty(key)) {
    result.push({
      source: key,
      target: value,
    });
  }
}

for (redirect of redirects) {
  if (redirect.Target &&
    !redirect.Source.startsWith('http') &&
    !redirect.Source.includes('#') &&
    !redirect.Source.startsWith('/http')) {
    const source = redirect.Source;
    const target = calculateTarget(redirect.Target);
    result.push({
      source,
      target,
    });
  }
}

redirectStatic(
    resolve(join(__dirname, '../../static/')),
    'https://amp.dev/static/samples/files',
);

redirectStatic(
    resolve(join(__dirname, '../../src/json')),
    'https://amp.dev/static/samples/json',
    'json',
);

redirectStatic(
    resolve(join(__dirname, '../../src/video')),
    'https://amp.dev/static/samples/video',
    'video',
);

redirectStatic(
    resolve(join(__dirname, '../../src/img')),
    'https://amp.dev/static/samples/img',
    'img',
);

writeFileSync(__dirname + '/../redirects-amp.dev.json', JSON.stringify(result, null, 2), 'utf-8');
