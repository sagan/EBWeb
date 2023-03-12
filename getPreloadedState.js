const { getDicts, query } = require("./api");
const { normalizeQ } = require("./client/functions");

const {
  DICTINFO: { dicts, kannjiDict, multiShortcuts },
  SITENAME,
  SITEID,
  GAPI_CLIENTID,
  JS_DOCUMENT_URL,
  USERCONFIG_DOCUMENT_URL,
  DATE,
  OLD_STORAGE_KEY,
  KEYWORDS,
  DESCRIPTION,
  ROOTPATH,
  PUBLIC_URL,
  FOOTER_TEXT,
  HOME_FOOTER_TEXT,
  YAHOO_APPID,
  HOME_HTML,
  $$hash,
} = require("./config.loader");
const { version: VERSION } = require("./package");
const config = {
  SITENAME,
  SITEID,
  GAPI_CLIENTID,
  JS_DOCUMENT_URL,
  USERCONFIG_DOCUMENT_URL,
  DATE,
  OLD_STORAGE_KEY,
  KEYWORDS,
  DESCRIPTION,
  DICTINFO: { dicts, kannjiDict, multiShortcuts },
  VERSION,
  ROOTPATH,
  FOOTER_TEXT,
  HOME_FOOTER_TEXT,
  PUBLIC_URL,
  FURIGANA_ENABLE: YAHOO_APPID ? 1 : 0,
  HOME_HTML,
  $$hash,
}; // client visible public config

async function getPreloadedState(params, serverParams) {
  let dicts = await getDicts();
  let { local, q, dict, type, max, romaji, page, offset, marker } = params;
  let words,
    nextPageMarker = "";

  if (!dict) {
    dict = dicts[0] || "";
  } else if (dict == "_") {
    dict = (dicts[0] || "") + "_" + (dicts[1] || "");
  }

  if (q || page != null) {
    let result = await query({
      q,
      dict,
      type,
      max,
      marker,
      romaji,
      page,
      offset,
    });
    if (Array.isArray(result)) {
      words = result;
    } else {
      ({ words, nextPageMarker } = result);
    }
  } else if (dict.match(/[+_]/)) {
    words = Array(dict.split(/[+_]/).filter((a) => a).length).fill([]);
  } else {
    words = [];
  }
  return {
    q,
    local,
    searchQ: q,
    searchActualQ: normalizeQ(q, romaji),
    searchDict: dict,
    searchRomaji: romaji,
    searchType: type,
    playingSoundWordIndex: -1,
    playing: 0,
    dicts,
    words,
    nextPageMarker,
    config,
    dict,
    romaji,
    type,
    page,
    offset,
    analyzeQ: "",
    analyzeStatus: 0,
    analyzeResult: null,
    analyzeShowMore: 0,
    netqueryQ: "",
    netquerySourceIndex: 0,
    netqueryStatus: 0,
    netqueryPin: 0,
    netqueryError: null,
    netqueryResult: {},
  };
}

module.exports = getPreloadedState;
