/* globals caches, fetch */
/* eslint-disable no-restricted-globals, no-console */
const files = [
  '/',
  '/index.html',
  '/diff.html',
  '/generateData.js',
  '/opensearch.xml',
  '/themes.js',
  '/themes.css'
];

self.addEventListener('install', event => {
  event.waitUntil(caches
    .open('v1')
    .then(cache => cache.addAll(files)));
});

self.addEventListener('fetch', e => {
  e.respondWith(caches
    .match(e.request)
    .then(response => response || fetch(e.request)));
});

/* eslint-enable no-restricted-globals, no-console */