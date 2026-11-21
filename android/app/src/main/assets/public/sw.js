/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-afac4cd2'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "f6ba95ac3297f7771d4a636bf7afb721"
  }, {
    "url": "pwa-512x512.png",
    "revision": "95ba5461938a3f71fe6996ccac53851d"
  }, {
    "url": "pwa-192x192.png",
    "revision": "7167a99f5908fd954957a08ba86414a6"
  }, {
    "url": "index.html",
    "revision": "e6cc8877fc6e2f5b9c9c63b3ce540148"
  }, {
    "url": "icon.svg",
    "revision": "a776d222edafa4c4d2ecc0042147e283"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "7b746af25719add1893051d0e3950d5f"
  }, {
    "url": "src/assets/images/medicine_tablet_1795297710615.jpg",
    "revision": "88fc630a124c84c6b6ab26992311b3ed"
  }, {
    "url": "src/assets/images/medicine_syrup_1795297716662.jpg",
    "revision": "ca4f7069c5c46a6cacbe8bfed3e6a895"
  }, {
    "url": "src/assets/images/medicine_other_1795297711710.jpg",
    "revision": "251c243bb8f79bfa89d1cffd65230cfd"
  }, {
    "url": "src/assets/images/medicine_injection_1795297712535.jpg",
    "revision": "5107b4801a0539da6e9ed0b96d76d896"
  }, {
    "url": "src/assets/images/medicine_capsule_1795297710614.jpg",
    "revision": "3b69703ad55965e5211227137f229f1c"
  }, {
    "url": "assets/index-CxfDCA0-.css",
    "revision": null
  }, {
    "url": "assets/index-C3YXkxPb.js",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "7b746af25719add1893051d0e3950d5f"
  }, {
    "url": "icon.svg",
    "revision": "a776d222edafa4c4d2ecc0042147e283"
  }, {
    "url": "pwa-192x192.png",
    "revision": "7167a99f5908fd954957a08ba86414a6"
  }, {
    "url": "pwa-512x512.png",
    "revision": "95ba5461938a3f71fe6996ccac53851d"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "f6ba95ac3297f7771d4a636bf7afb721"
  }, {
    "url": "manifest.webmanifest",
    "revision": "a5e0bea3e33842a6de0974241f0f9c2b"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
