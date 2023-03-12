const defaultUserConfig = {
  ankiConnectAddr: "http://localhost:8765",
  ankiConnectApiKey: "",
  ankiConnectDeck: "Soradict",
  ankiConnectGlobalAddr: "",
  ankiConnectHostname: "localhost",
  ankiConnectPort: 8765,
  ankiConnectStatus: 0,
  colorScheme: 0,
  contentWidth: 980,
  debug: 0,
  debugSync: 0,
  debugSyncApi: 0,
  defaultDict: "",
  defaultDictEN: "",
  defaultRomaji: 1,
  defaultType: 0,
  deviceId: "",
  dnt: 0,
  fixFocus: "",
  forcePCMode: 0,
  furiganaMode: 0,
  historyLp: 0,
  historyPagination: 500,
  livepreviewDict: "",
  livepreviewEnable: 0,
  livepreviewModifierKey: "Shift",
  livepreviewModifierKeyType: 0,
  multiDictsAlwaysUse: 0,
  nocj: 0,
  nosw: 0,
  notebookLp: 0,
  notebookPagination: 1000,
  notebookTagsLimit: 200,
  notebookTitleMode: 0,
  parserFuriganaMode: 0,
  parserLpMode: 0,
  parserTab: 0,
  parserTranslatorTarget: "en",
  pcModeMinWidth: 1024,
  sitename: "",
  suggestionsLimit: 2,
  suggestionsProvider: "wiktionary",
  syncMinInterval: 600 * 1000,
};

// get effective config
function _c(name, value) {
  if (typeof value == "object" && value) {
    return (
      (typeof window !== "undefined"
        ? window.__USERCONFIG_LOCAL__[name]
        : undefined) ??
      value[name] ??
      defaultUserConfig[name]
    );
  }
  return (
    (typeof window !== "undefined"
      ? window.__USERCONFIG_LOCAL__[name] ?? window.__USERCONFIG__[name]
      : undefined) ??
    defaultUserConfig[name] ??
    value
  );
}

function _d(name, value) {
  if (typeof value == "object" && value) {
    return value[name] ?? defaultUserConfig[name];
  }
  return (
    (typeof window !== "undefined" ? window.__USERCONFIG__[name] : undefined) ??
    defaultUserConfig[name] ??
    value
  );
}

function _u(name, value) {
  if (typeof value == "object" && value) {
    return value[name];
  }
  return (
    (typeof window !== "undefined" ? window.__USERCONFIG__[name] : undefined) ??
    value
  );
}

const paginationOptions = [10, 20, 50, 100, 200, 500, 1000];
const tagsLimitOptions = [5, 10, 20, 50, 200];

const obsoleteUserConfigKeys = ["alwaysUseDefaultSearchSettings"];

const notSyncUserConfigKeys = [
  "colorScheme",
  "ankiConnectStatus",
  "ankiConnectAddr",
  "deviceId",
  "parserFuriganaMode",
  "parserLpMode",
  "parserTab",
  "parserTranslatorTarget",
  "multiDictsAlwaysUse",
  "notebookTitleMode",
  "notebookLp",
  "notebookLpRequireModifierKey",
  "notebookPagination",
  "notebookTagsLimit",
  "historyLp",
  "historyLpRequireModifierKey",
  "historyPagination",
  "debug",
  "debugSync",
  "debugSyncApi",
];
// const configs = [
//   {
//     id: "sitename",
//     type: "text",
//     name: "サイトのタイトル",
//     desc: "ページの左上のサイトタイトルを自分好きなものに変更する。",
//     placeholder: ({ config }) => config.SITENAME,
//   },
//   {
//     id: "defaultDict",
//     type: "text",
//     name: "デフォルト辞典",
//     desc: "ページの左上のサイトタイトルを自分好きなものに変更する。",
//     placeholder: ({ config }) => config.SITENAME,
//   },
// ];

function configDataNeedSync(config) {
  if (!config) {
    return true;
  }
  let need = false;
  for (let key of Object.keys(config)) {
    if (notSyncUserConfigKeys.indexOf(key) == -1) {
      need = true;
      break;
    }
  }
  return need;
}

function parseUserConfigJson(str, defaultValue = {}) {
  if (!str) {
    return defaultValue;
  }
  let userConfig;
  try {
    userConfig = JSON.parse(str);
  } catch (e) {}
  return userConfig || defaultValue;
}

module.exports = {
  _c,
  _d,
  _u,
  configDataNeedSync,
  defaultUserConfig,
  tagsLimitOptions,
  paginationOptions,
  obsoleteUserConfigKeys,
  notSyncUserConfigKeys,
  parseUserConfigJson,
};
