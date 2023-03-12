const Validator = new require("jsonschema").Validator;
const validator = new Validator();
const { updateHash } = require("./functions");

const DICTINFOSchema = {
  type: "object",
  properties: {
    audioDict: {
      type: "string",
    },
    audioDictEn: {
      type: "string",
    },
    kannjiDict: {
      type: "string",
    },
    dicts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
            minLength: 1,
          },
          id: {
            type: "string",
          },
          alias: {
            type: "string",
          },
          gaijiMap: {
            type: "string",
          },
        },
        required: ["name"],
      },
    },
    multiShortcuts: {
      type: "array",
      items: {
        type: "array",
        items: {
          type: "string",
        },
        minLength: 2,
        maxLength: 3,
      },
    },
  },
  required: ["dicts"],
};

const config = {
  SITENAME: "EBWeb",
  CACHE_AGE: 86400,
  SHORT_CACHE_AGE: 120,
  GAPI_CLIENTID: "",
  GAPI_SECRET: "",
  GAPI_SCRIPT: "",
  GOOGLE_SEARCH_API_KEY: "",
  GOOGLE_SEARCH_API_ENGINE: "",
  REDIRECT_NON_CANONICAL_URL: 1,
  JS_DOCUMENT_URL: "",
  USERCONFIG_DOCUMENT_URL: "",
  DEFAULTDICT: "",
  PROXY: 1,
  DATE: "",
  SITEID: "",
  OLD_STORAGE_KEY: "",
  SHORTNAME: "",
  KEYWORDS: "",
  DESCRIPTION: "",
  IBM_CLOUD_APIKEY: "",
  IBM_TRANSLATOR_API_URL: "",
  ROOTPATH: "/",
  PUBLIC_URL: "",
  REALROOT: "/",
  HOME_HTML: "",
  FOOTER_TEXT: "",
  HOME_FOOTER_TEXT: "",
  API_ENDPOINT: "",
  EBCLIENT_BIN: "",
  EBCLIENT_DICT_PATH: "",
  IP: "0.0.0.0",
  PORT: 3000,
  MAX_DEFAULT: 100,
  MAX_CAP: 100,
  MAX_CAP2: 50,
  DICTINFO: "",
};

const INTETER_CONFIG_KEYS = [
  "REDIRECT_NON_CANONICAL_URL",
  "PROXY",
  "PORT",
  "MAX_DEFAULT",
  "MAX_CAP",
  "MAX_CAP2",
];

try {
  Object.assign(config, require("./config"));
} catch (e) {}

Object.keys(config).forEach((key) => {
  if (process.env[key]) {
    config[key] = process.env[key];
  }
});

INTETER_CONFIG_KEYS.forEach((key) => (config[key] = parseInt(config[key])));

if (typeof config.DICTINFO == "string") {
  try {
    config.DICTINFO = JSON.parse(config.DICTINFO);
  } catch (e) {} // 为什么 catch 后面非要跟个括号尾巴呢， 设计语法的人脑残。silent is golden!
}
if (!validator.validate(config.DICTINFO, DICTINFOSchema).valid) {
  console.log(
    "config.DICTINFO validation failed",
    validator.validate(config.DICTINFO, DICTINFOSchema).errors
  );
  throw new Error("invalid config.DICTINFO");
}
if (!config.SITEID) {
  config.SITEID = config.PUBLIC_URL + config.ROOTPATH;
}

module.exports = updateHash(config);
