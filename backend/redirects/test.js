const fetch = require('node-fetch');
const {join} = require('path');
const URL = require('url').URL;


const HOST = 'http://localhost:8080';

const sitemap = require(join(__dirname, '../../dist/sitemap.json'));

runTests().then(() => {
  console.log('Failed redirects: ', errorCount);
  console.log(errors.join('\n'));
});

async function runTests() {
  for (let format of sitemap) {
    for (let category of format.categories) {
      for (let sample of category.examples) {
        await test(sample.url);
      }
    }
  }
}

let errorCount = 0;

const errors = [];

async function test(path) {
  const url = new URL(path, HOST).toString();
  let response = await fetch(url, {
    method: 'HEAD',
    redirect: 'manual',
  });
  if (response.status === 301) {
    console.log(path, '[REDIRECTING]');
  } else {
    console.log(path, '[MISSING REDIRECT]', response.status);
    errors.push(path + ' [MISSING REDIRECT]');
    errorCount++;
    return;
  }
  response = await fetch(url, {
    method: 'HEAD',
  });
  if (response.ok) {
    console.log(path, '[OK]');
  } else {
    console.log(path, ' [INVALID REDIRECT TARGET]', response.status);
    errors.push(path + ' [INVALID REDIRECT TARGET]');
    errorCount++;
  }
}


