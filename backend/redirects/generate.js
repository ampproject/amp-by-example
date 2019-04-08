const URL = require('url').URL;
const glob = require('glob').sync;
const {join, resolve} = require('path');
const {writeFileSync} = require('fs');
const sm = require('sitemap');

const STATIC_SAMPLES = ['hreflang', 'linker', 'internationalization'];
const IGNORE = new Set([
'/login.html',
'/googlea533f0f54d9c716a.html',
'/amp4mail/gallery.html',
'/humans.txt']);
const MANUAL = new Map([
  ['/sw.js', 'https://amp.dev/serviceworker.js'],
  ['sitemap.json', 'https://amp.dev/documentation/examples/api/list'],
  ['/sw.html', 'https://amp.dev/serviceworker.html'],
  ['/glTF/DamagedHelmet.glb', 'https://amp.dev/static/samples/glTF/DamagedHelmet.glb'],
 ['/webpush/amp-web-push-helper-frame.html', 'https://amp.dev/documentation/examples/components/amp-web-push/amp-web-push-helper-frame.html'],
 ['/webpush/amp-web-push-permission-dialog.html',  'https://amp.dev/documentation/examples/components/amp-web-push/amp-web-push-permission-dialog.html'],
]);

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
    if (IGNORE.has(source)) {
      console.log('ignoring', source);
      continue;
    }
    let target;
    const manualRule = MANUAL.get(source);
    if (manualRule) {
      target = manualRule;
      console.log('manual', source, target);
    } else {
      if (STATIC_SAMPLES.find((s) => source.startsWith('/' + s))) {
        destDir = 'https://amp.dev/static/samples';
      }
      target = destDir + source;
    }

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
const urls = [];

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
    urls.push(source);
    result.push({
      source,
      target,
    });
  }
}


urls.map(url => {
  return {
    url: url
  };
});


const sitemap = sm.createSitemap({
  hostname: 'https://ampbyexample.com',
  cacheTime: 600000, // 600 sec (10 min) cache purge period
  urls,
});

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
writeFileSync(__dirname +  '/sitemap.xml', sitemap.toString(), 'utf-8');
