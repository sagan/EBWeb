// importScripts(
//   "https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js"
// );
// workbox.setConfig({
//   debug: true
// });
// const { skipWaiting, clientsClaim } = workbox.core;
// const { precacheAndRoute } = workbox.precaching;
// const { registerRoute } = workbox.routing;
// const { NetworkOnly, CacheFirst, StaleWhileRevalidate } = workbox.strategies;
// const { ExpirationPlugin } = workbox.expiration;

import { skipWaiting, clientsClaim } from "workbox-core";
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import {
  NetworkOnly,
  CacheFirst,
  StaleWhileRevalidate,
} from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import localforage from "localforage";
import { dbSync, dbGetUserConfigInfo } from "../client/db";
import { REGEX_ENGLISH_FULL } from "../client/language_functions";
import { REG_FILEURL } from "../client/constants";

skipWaiting();
clientsClaim();

const DATA_VERSION = __DATA_VERSION__;
const ROOTPATH = __ROOTPATH__;
const SITEID = __SITEID__;
const DEFAULTDICT = __DEFAULTDICT__;
const ROOTVERSION = __ROOTVERSION__;
const COMMIT_HASH = __COMMIT_HASH__;

const REG_DICT_BINARY_FILEURL = /\/binary\/.*\.(jpg|png|bmp|wav|mp3)$/;
const REG_APIURL = /\bapi=[a-zA-Z0-9_]/;
const REG_API4URL = /\bapi=4\b/;
const REG_NOCACHE = /\b__nocache__\b/;
const REG_NOSSR = /\b__nossr__\b/;
const REG_MAX = /\bmax=\d+(&|$)/;

localforage.config({
  name: `${SITEID}_localforage`,
});

const TYPES = {
  0: "prefix",
  1: "suffix",
  2: "exact",
};

const mainCacheHandler = new StaleWhileRevalidate({
  cacheName: `${SITEID}_query-cache`,
  plugins: [
    new ExpirationPlugin({
      maxAgeSeconds: 10 * 24 * 60 * 60,
      maxEntries: 500,
    }),
  ],
});

const resourcesCacheHandler = new StaleWhileRevalidate({
  cacheName: `${SITEID}_resources-cache`,
  plugins: [
    new ExpirationPlugin({
      maxEntries: 500,
    }),
  ],
});

const staticResourcesCacheHandler = new CacheFirst({
  cacheName: `${SITEID}_staticresources-cache`,
  plugins: [
    new ExpirationPlugin({
      maxEntries: 1000,
    }),
  ],
});

registerRoute(({ url, event }) => {
  return !!url.search.match(REG_NOCACHE) || !!url.search.match(REG_API4URL);
}, new NetworkOnly());

precacheAndRoute(
  self.__WB_MANIFEST.concat([
    {
      revision: ROOTVERSION + "-" + COMMIT_HASH + "-" + DATA_VERSION,
      url: ROOTPATH,
    },
  ]),
  {
    // ignoreUrlParametersMatching: [/^(q|dict|type|romaji)$/]
  }
);

registerRoute(({ url, event }) => {
  if (
    url.origin != location.origin ||
    url.pathname.match(REG_DICT_BINARY_FILEURL)
  ) {
    return true;
  }
}, staticResourcesCacheHandler);

registerRoute(({ url, event }) => {
  if (url.pathname.match(REG_FILEURL)) {
    return true;
  }
}, resourcesCacheHandler);

registerRoute(
  ({ url, event }) => {
    return url.pathname == ROOTPATH + "default/";
  },
  async ({ url, event }) => {
    let userConfig = {};
    try {
      userConfig = (await dbGetUserConfigInfo()).userConfig;
    } catch (e) {}
    let { defaultDict, defaultDictEN, defaultType, defaultRomaji } = userConfig;
    let urlParams = new URLSearchParams(url.search);
    let redirectUrl = ROOTPATH;
    if (defaultType) {
      urlParams.set("type", defaultType);
    }
    if (defaultRomaji === 0) {
      urlParams.set("romaji", 0);
    }
    let q = urlParams.get("q");
    if (q) {
      // workaround for Chrome web share target feature,
      // which insists a '"abc" https://www.google.com/' format string in text arg.
      let match = q.match(/^"([^"]+)"\s+https?:\/\/\S+$/);
      if (match) {
        q = match[1];
      }
    }
    if (defaultDict || DEFAULTDICT) {
      redirectUrl +=
        encodeURIComponent(
          defaultDictEN && q && REGEX_ENGLISH_FULL.test(q)
            ? defaultDictEN
            : defaultDict || DEFAULTDICT
        ) + "/";
      if (q) {
        let type = TYPES[urlParams.get("type") || defaultType || 0];
        redirectUrl += type + "/" + encodeURIComponent(q);
        urlParams.delete("q");
        urlParams.delete("type");
        urlParams.set("__nossr__", 1);
      }
    }
    let search = urlParams.toString();
    // console.log("userConfig", userConfig, search);
    return Response.redirect(
      redirectUrl + (search ? "?" + search : "") + url.hash
    );
  }
);

registerRoute(
  ({ url, event }) => {
    return !url.pathname.match(REG_FILEURL) && !url.search.match(REG_APIURL);
  },
  async ({ url, event, request }) => {
    if (url.search.match(REG_NOSSR)) {
      let res = await caches.match(ROOTPATH);
      if (res) {
        return res;
      }
    }
    return mainCacheHandler
      .handle({ event, request })
      .catch(() => caches.match(ROOTPATH));
  }
);

registerRoute(
  ({ url, event }) => {
    return !url.pathname.match(REG_FILEURL) && url.search.match(REG_APIURL);
  },
  async ({ url, event, request }) => {
    if (url.search.match(REG_MAX)) {
      let urlNoMax = new URL(url.href);
      urlNoMax.search = urlNoMax.search.replace(REG_MAX, "");
      let matchNoMax = await caches.match(urlNoMax);
      if (matchNoMax) {
        return matchNoMax;
      }
    }
    return mainCacheHandler.handle({ url, event, request });
  }
);

function sync(event) {
  if (event.tag == "cloudsync") {
    console.log("sw sync", event.name);
    event.waitUntil(dbSync(ROOTPATH + "?api=4&type=3"));
  }
}
self.addEventListener("sync", sync);
self.addEventListener("periodicsync", sync);
