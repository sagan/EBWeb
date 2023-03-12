require("./patch");

const config = require("./config.loader");
const fs = require("fs-extra");
const fetch = require("isomorphic-fetch");
const Koa = require("koa");
const serve = require("koa-static");
const mount = require("koa-mount");
const send = require("koa-send");
const bodyParser = require("koa-bodyparser");
const proxy = require("koa-proxies");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const app = new Koa();
const { getEbclientCp, getDicts, query } = require("./api");
const {
  translate,
  kanaKannji,
  fixJapanese,
  initJapaneseAnalyzer,
  kuroshiroConvert,
  furiganaWithAnalyzeText,
  furiganaAnalyzeTextOnly,
  analyzeJapaneseText,
  correctJapaneseText,
} = require("./api/japaneseAnalyzer");
const { googleAuth } = require("./api/cloud");
const {
  parseSitePath,
  normalizeQ,
  getCanonicalUrlSearch,
} = require("./client/functions");
const getPreloadedState = require("./getPreloadedState");
const {
  default: IndexComponent,
  getStore,
  VERSION,
  COMMIT_HASH,
} = require("./dist/bundle_server");
const assets = require("./dist/assets.json");

const MANIFEST = require("./dist/assets/manifest.json");
Object.assign(MANIFEST, {
  name: config.SITENAME,
  short_name: config.SHORTNAME || config.SITENAME,
  scope: config.ROOTPATH,
  start_url: config.ROOTPATH + "default/",
});
MANIFEST.share_target.action = config.ROOTPATH + "default/";

const OPENSEARCHXML = fs
  .readFileSync(__dirname + "/opensearch.xml", "utf8")
  .replace(/__SITENAME__/g, config.SITENAME)
  .replace(/__DESCRIPTION__/g, config.DESCRIPTION)
  .replace(/__PUBLIC_URL__/g, config.PUBLIC_URL)
  .replace(/__ROOTPATH__/g, config.ROOTPATH);

const api2Handles = {
  0: kuroshiroConvert,
  1: analyzeJapaneseText,
  2: correctJapaneseText,
  3: translate,
  4: furiganaWithAnalyzeText,
  5: furiganaAnalyzeTextOnly,
  6: kanaKannji,
  7: fixJapanese,
};

const DEFAULT_PARAMS = {
  q: "",
  dict: "",
  marker: "",
  type: 0,
  romaji: 1,
  page: null,
  offset: null,
};

const NO_CACHE_HEADERS = {
  "Cache-control": "no-store",
  Pragma: "no-cache",
  Expires: "0",
};

const PROXIES = [
  { id: "jisho_api", url: "https://jisho.org/api/v1/search/words" },
];
if (config.PROXIES) {
  PROXIES.push(...config.PROXIES);
}

app.proxy = !!config.PROXY;
PROXIES.forEach((p) => {
  var url = new URL(p.url);
  var proxypath = `${config.REALROOT}proxy/${p.id}`;
  app.use(
    proxy(proxypath, {
      target: url.origin,
      rewrite: (path) => url.pathname + path.slice(proxypath.length),
      changeOrigin: true,
      // logs: true,
    })
  );
});
app.use(
  bodyParser({ enableTypes: ["json", "form", "text"], textLimit: "8mb" })
); // ctx.request.body;
app.use(async (ctx, next) => {
  if (
    (ctx.method === "HEAD" || ctx.method === "GET") &&
    ctx.path == config.REALROOT + "service-worker.js"
  ) {
    // overwrite service-worker.js cache-control header
    return await send(ctx, ctx.path.slice(config.REALROOT.length - 1), {
      root: __dirname + "/dist",
      maxage: 0,
    });
  }
  if (ctx.path == config.REALROOT + "assets/manifest.json") {
    if (ctx.query.dict) {
      return (ctx.body = Object.assign({}, MANIFEST, {
        start_url: config.ROOTPATH + encodeURIComponent(ctx.query.dict) + "/",
      }));
    }
    return (ctx.body = MANIFEST);
  }
  await next();
});
app.use(
  mount(
    config.REALROOT + "mod/",
    serve(__dirname + "/dist/mod", { maxAge: config.SHORT_CACHE_AGE * 1000 })
  )
);
app.use(
  mount(
    config.REALROOT,
    serve(__dirname + "/dist", { maxAge: config.CACHE_AGE * 1000 })
  )
);

app.use(async (ctx, next) => {
  if (ctx.path == config.REALROOT + "opensearch.xml") {
    ctx.type = "xml";
    return (ctx.body = OPENSEARCHXML);
  }

  let {
    q,
    dict,
    marker,
    type,
    max,
    romaji,
    page,
    offset,
    endpage,
    endoffset,
    binary,
    width,
    height,
    ...otherParams
  } = ctx.query;

  if (ctx.path.startsWith(config.REALROOT)) {
    ctx.relativePath = ctx.path.slice(config.REALROOT.length);
    ctx.params = Object.assign(
      {
        q: q || "",
        dict: dict || "",
        marker: marker || "",
        type: type != null ? parseInt(type) || 0 : 0,
        page: page != null && page !== "" ? parseInt(page) || 0 : null,
        offset: offset != null && offset !== "" ? parseInt(offset) || 0 : null,
        binary,
        width,
        height,
        endpage,
        endoffset,
      },
      ctx.query.__nossr__ === undefined ? parseSitePath(ctx.relativePath) : {}
    );
    ctx.params.romaji =
      romaji != null
        ? parseInt(romaji) || 0
        : ctx.query.api ||
          (ctx.params.q &&
            normalizeQ(ctx.params.q, 0) != normalizeQ(ctx.params.q, 1))
        ? 0
        : 1;
    if (max == null) {
      max = config.MAX_DEFAULT;
    }
    ctx.params.max = ctx.params.dict.match(/[^+_][+_]+[^+_]/)
      ? Math.max(0, Math.min(parseInt(max) || 0, config.MAX_CAP2))
      : Math.max(0, Math.min(parseInt(max) || 0, config.MAX_CAP));
  } else {
    ctx.redirect((config.PUBLIC_URL || ctx.origin) + config.ROOTPATH);
    return;
  }

  if (!ctx.query.api && !ctx.params.binary) return next();

  // text to furigana :
  if (ctx.query.api == 2) {
    ctx.body = await api2Handles[ctx.params.type](
      typeof ctx.request.body == "string" ? ctx.request.body : ctx.params.q,
      otherParams
    );
    return;
  } else if (ctx.query.api == 3) {
    ctx.set(NO_CACHE_HEADERS);
    ctx.body = {
      VERSION,
      CONFIG_HASH: config.$$hash,
      COMMIT_HASH,
    };
    return;
  } else if (ctx.query.api == 4) {
    let { status, redirect, body } = await googleAuth(
      ctx.query,
      ctx.request.body
    );
    // console.log("----api4 body", status, body);
    if (redirect) {
      ctx.redirect(redirect);
    }
    if (status) {
      ctx.status = status;
    }
    ctx.body = body || "";
    return;
  } else if (ctx.query.api == 5) {
    let res = await fetch(
      `https://customsearch.googleapis.com/customsearch/v1?key=${config.GOOGLE_SEARCH_API_KEY}&cx=${config.GOOGLE_SEARCH_API_ENGINE}&${ctx.querystring}`
    );
    ctx.status = res.status;
    ctx.type = "json";
    ctx.body = res.body;
    return;
  }

  if (!ctx.params.dict && !ctx.params.q) {
    ctx.body = await getDicts();
  } else {
    let body = await query(ctx.params);
    if (
      ctx.params.binary &&
      body &&
      (Buffer.isBuffer(body) || typeof body.on === "function")
    ) {
      if (ctx.params.binary == "mono") ctx.type = "bmp";
      else if (ctx.params.binary == "gaiji") ctx.type = "png";
      else if (ctx.params.binary == "wav") ctx.type = "audio/wav";
      // chrome do not support audio/wave well
      else ctx.type = ctx.params.binary;
    }
    if (body === undefined) {
      ctx.status = 404;
    } else {
      ctx.body = body;
    }
  }
});

app.use(async (ctx, next) => {
  if (!ctx.path.startsWith(config.REALROOT)) {
    return (ctx.status = 404);
  }
  ctx.type = "html";
  ctx.set("Referrer-Policy", "same-origin");

  let preloadedState = await getPreloadedState(ctx.params);
  let { store } = getStore(preloadedState);
  if (
    config.REDIRECT_NON_CANONICAL_URL &&
    ctx.hostname != "localhost" &&
    ctx.query.__nossr__ === undefined &&
    ctx.query.__nocache__ === undefined
  ) {
    let canonicalUrl =
      (config.PUBLIC_URL || ctx.origin) +
      config.ROOTPATH +
      getCanonicalUrlSearch(store.getState(), config.DEFAULTDICT);
    if (
      canonicalUrl !=
      ctx.origin + config.ROOTPATH + ctx.relativePath + ctx.search
    ) {
      // console.log("canonicalUrl", canonicalUrl, ctx.href);
      ctx.status = 301;
      ctx.redirect(canonicalUrl);
      return;
    }
  }
  //console.log("Initial state: ", store.getState());
  ctx.body =
    "<!DOCTYPE html>" +
    ReactDOMServer.renderToStaticMarkup(
      React.createElement(IndexComponent, {
        store,
        preloadedState,
        config,
        assets,
        manifest: MANIFEST,
        script: (await fs.exists(
          __dirname + "/dist/mod/mod.js",
          fs.constants.R_OK
        ))
          ? config.ROOTPATH + "mod/mod.js"
          : null,
      })
    );
  if (preloadedState.words.length == 0 && preloadedState.page != null) {
    ctx.status = 404;
  }
});

(async () => {
  if (config.EBCLIENT_BIN) {
    await getEbclientCp();
  }
  if (config.YAHOO_APPID) {
    // for use Yahoo japanese morphological analyzer WebAPI
    await initJapaneseAnalyzer({ yahooAppId: config.YAHOO_APPID });
  }
  app.listen(config.PORT, config.IP);
})();
