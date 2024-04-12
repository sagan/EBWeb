module.exports = {
  SITENAME: "EBWeb",
  CACHE_AGE: 86400,
  SHORT_CACHE_AGE: 120,
  MAX_DEFAULT: 100,
  MAX_CAP: 100,
  MAX_CAP2: 50,
  DEFAULTDICT: "", // The default dict. If not set, will use the first one in dicts list as default.
  JS_DOCUMENT_URL: "https://example.com/Custom%20JS%20guide",
  USERCONFIG_DOCUMENT_URL: "https://example.com/User%20Config%20guide",
  GAPI_CLIENTID: "", // "xxxxx-xxxxx.apps.googleusercontent.com"
  GAPI_KEY: "",
  GAPI_SECRET: "",
  GAPI_SCRIPT: "", // "https://script.google.com/macros/s/xxxxxxxxxx/exec"
  GOOGLE_SEARCH_API_KEY: "",
  GOOGLE_SEARCH_API_ENGINE: "",
  SITEID: "soradict", // Used as localStorage key. Do NOT change it in production site
  DATE: "2024-04-12",
  REDIRECT_NON_CANONICAL_URL: 0,
  PROXY: 1,
  OLD_STORAGE_KEY: "persist:state",
  KEYWORDS:
    "広辞苑,大辞林,日本国語大辞典,中日辞典,日中辞典,国語辞典,国語辞書,国語,辞書,辞典,意味,類語,例文,慣用句",
  DESCRIPTION: "当サイトでは、様々の大型辞典の内容を無料で閲覧できる",
  IBM_CLOUD_APIKEY: "", // for IBM translate API
  IBM_TRANSLATOR_API_URL: "", // "https://api.jp-tok.language-translator.watson.cloud.ibm.com/instances/fffff-fffff"
  ROOTPATH: "/", // The "pathname" part of (root) public URL of the site. Must re-rebuild Docker image if changed
  REALROOT: "/", // If program running behind a reverse proxy (eg. nginx), the root path that program sees
  PUBLIC_URL: "https://example.com", // Required. The "origin" part of public URL of the site
  IP: "0.0.0.0",
  PORT: 3000,
  HOME_HTML: `<div class="opt">
  <p>ようこそ。当サイトでは、様々の辞典の検索機能を無料に提供致します。</p>
</div>`,
  FOOTER_TEXT: `&copy;<a href="https://example.com/">example.com</a>`,
  HOME_FOOTER_TEXT: ``,
  EBCLIENT_BIN: "./binary/ebclient",
  EBCLIENT_DICT_PATH: "./data-dicts",
  //GA: "", // Set to enable google analytics. E.g.: "UA-1234567890-0"
  YAHOO_APPID: "", // yahoo.co.jp appid, for use Yahoo japanese morphological analyzer WebAPI
  DICTINFO: {
    // audioDict: "NHK日本語発音アクセント辞典",
    // audioDictEn: "研究社新英和中辞典",
    // kannjiDict: "学研漢和大字典",
    dicts: [
      // {
      //   name: "広辞苑第六版",
      //   id: "広辞苑",
      //   alias: "",
      //   gaijiMap: "KOJIEN.json",
      // },
      // {
      //   name: "ＮＨＫ　日本語発音アクセント辞典",
      //   id: "NHK日本語発音アクセント辞典",
      //   alias: "発音",
      //   gaijiMap: "",
      // },
    ], // dicts MUST be configured
    multiShortcuts: [
      // [
      //   "薦",
      //   "広辞苑_小学館中日・日中辞典_三省堂類語辞典",
      //   "管理人のお薦め辞典セットを使用する",
      // ],
    ], // 一括検索・ショートカット。each: [name, dicts, tip]
  },
};
