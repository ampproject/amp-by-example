importScripts('/bower_components/sw-toolbox/sw-toolbox.js');

toolbox.options.debug = true;
toolbox.router.default = toolbox.fastest;

const filesToCache = [
    '/',
    'https://fonts.googleapis.com/css?family=Roboto:regular,bold,italic,thin,light,bolditalic,black,medium&lang=en'
];

toolbox.precache(filesToCache);
