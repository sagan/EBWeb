import { toastr } from "react-redux-toastr";
import csvStringify from "csv-stringify/lib/browser/sync";
import csvParse from "csv-parse/lib/browser/sync";
import { netquery_sources, netquery_request } from "../netquery";
import db, {
  putNote,
  putHistory,
  deleteNote,
  dbSync,
  dbAnkiSync,
  dbResetSync,
  dbImportNotes,
  dbUpdateUserConfig,
  dbGetUserConfigInfo,
  dbSetUserConfigProfile,
  dbCreateUserConfigProfile,
  dbRemoveUserConfigProfile,
  dbSyncMeta,
} from "../db.js";
const NProgress = require("nprogress"); // client only
const fetchJsonp = require("fetch-jsonp");
const popupTools = require("popup-tools");
const {
  getClickEventA,
  browserPlaySpeech,
  isMobileView,
  downloadAsFile,
} = require("../dom");
const { _c, _d, defaultUserConfig } = require("../userConfig");

import {
  formatTime,
  normalizeQ,
  romajiConvert,
  datePlusDays,
  wordId,
  ankiRequest,
  sleep,
  parseUrl,
  cancelEvent,
  wordDictId,
  wordGlobalId,
  getWordNote,
  __user_config_effect__,
  getCanonicalUrlSearch,
  eb2textclean,
  parseEbTitle,
  multiDictsString2Array,
  fetchJson,
} from "../functions";
import { REGEX_ENGLISH_FULL } from "../language_functions";
import {
  searchDictsSelector,
  getPageInfo,
  wordsEmpty,
  getMetaValues,
} from "../selectors";
import { gotoTop, fixFocus } from "../dom";

function gotoElOrTop(el, { mobileOnlyTop = false } = {}) {
  if (!mobileOnlyTop || !isMobileView()) {
    if (typeof el == "string") el = document.querySelector(el);
    if (el) {
      return el.scrollIntoView();
    }
  }
  gotoTop();
}

export function preserveFocus() {
  return (dispatch, getState) => {
    if (!document.querySelector(".ReactModal__Overlay")) {
      fixFocus('input[name="q"]', _c("fixFocus"));
    }
  };
}

export function onChangeQ(value) {
  return { type: "CHANGE_Q", value };
}

export function search_result(result) {
  return (dispatch, getState) => {
    dispatch({ type: "SEARCH_RESULT", result });
    dispatch(notebookLoadWordNotes());
  };
}

export function search_error(error) {
  return { type: "SEARCH_ERROR", error };
}

export function setSearchType(type) {
  return (dispatch, getState) => {
    type = parseInt(type);
    let { q, searchQ, page, offset } = getState();
    if (isNaN(type) || type < 0 || type > 2) return;
    dispatch({ type: "SET_SEARCH_TYPE", searchType: type });
    if (q && page == null && offset == null && q == searchQ) {
      dispatch(onSearch());
    }
  };
}

export function setRomaji(romaji) {
  romaji += 0; // convert romaji from true / false to 0 / 1
  return (dispatch, getState) => {
    let { q, searchQ, page, offset, romaji: oldRomaji } = getState();
    dispatch({ type: "SET_ROMAJI", romaji });
    if (q && page == null && offset == null && q == searchQ) {
      if (normalizeQ(q, oldRomaji) != normalizeQ(q, romaji)) {
        dispatch(onSearch());
      } else {
        dispatch(preserveFocus());
      }
    }
  };
}

export function searchStart(params) {
  return { type: "SEARCH_START", params };
}

export function selectDict(dict, e) {
  cancelEvent(e);
  return (dispatch, getState) => {
    let {
      local,
      dicts,
      dict: oldDict,
      q,
      searchQ,
      searchDict,
      words,
      searchType: type,
      searchRomaji: romaji,
      page,
      offset,
      config: { ROOTPATH, DEFAULTDICT },
    } = getState();

    let oldSearchDicts = searchDictsSelector(getState());
    let defaultDict = _c("defaultDict");
    if (dict == "_") {
      if (defaultDict && defaultDict.indexOf("_") != -1) {
        dict = defaultDict;
      } else {
        let _dicts = [...oldSearchDicts];
        if (!q) {
          _dicts.push(dicts[0], dicts[1]);
        }
        _dicts = _dicts
          .filter((el, i, a) => a.indexOf(el) == i)
          .filter((a) => a);
        _dicts.length = Math.min(_dicts.length, 2);
        dict = _dicts.join("_") + (_dicts.length == 1 ? "_" : "");
      }
    } else if (dict == "__") {
      dict = (DEFAULTDICT || dicts[0]) + "_";
    }
    // else if (dict.indexOf("_") != -1) {
    //   dict = dict.replace(/^_+/, "").replace(/_+$/, "");
    //   if (!_c("multiDictsAlwaysUse") && dict.indexOf("_") == -1) {
    //     dict += "_";
    //   }
    // }
    dispatch({ type: "SELECT_DICT", dict });
    if (local || page != null || q != searchQ) {
      return;
    }

    let isMulti = !!dict.match(/[+_]/);
    let searchDicts = dict.split(/[+_]/).filter((a) => a);
    if (searchDicts.every((dict) => oldSearchDicts.indexOf(dict) != -1)) {
      let newWords;
      if (isMulti) {
        if (oldDict.match(/[+_]/)) {
          newWords = Array(searchDicts.length).fill([]);
          searchDicts.forEach(
            (dict, i) =>
              (newWords[i] = words[oldSearchDicts.indexOf(dict)] || [])
          );
        } else {
          newWords = [words];
        }
      } else {
        let _words = words[oldSearchDicts.indexOf(dict)];
        newWords = Array.isArray(_words) ? _words : words;
      }
      dispatch({
        type: "SET",
        words: newWords,
        dict,
        searchDict: dict,
      });
      dispatch(saveState({ q, dict, type, romaji }));
      return;
    }

    if (!q) {
      dispatch({
        type: "SET",
        words: isMulti ? Array(searchDicts.length).fill([]) : [],
      });
    }

    if (oldDict != dict && (dict != searchDict || q != searchQ)) {
      if (q) {
        dispatch(onSearch());
      } else {
        dispatch(saveState({ q, dict, type, romaji }));
        dispatch({ type: "HOME_SELECT_DICT", dict });
      }
    } else {
      dispatch(preserveFocus());
    }
  };
}

export function searchRequest({
  hid,
  nid,
  scrollTop = 0,
  scrollTop2 = 0,
} = {}) {
  return async (dispatch, getState) => {
    let {
      q,
      dicts,
      dict,
      type,
      romaji,
      page,
      offset,
      hash,
      netqueryPin,
      netqueryStatus,
      drawStatus,
      drawQ,
      config: { ROOTPATH },
    } = getState();
    dispatch(preserveFocus());
    let actualQ;
    if (page != null) {
      actualQ = q = "";
    } else {
      actualQ = normalizeQ(q, romaji);
    }
    let params = { dict, offset, page, q, romaji, type };
    if (actualQ && netqueryPin == 1 && netqueryStatus) {
      dispatch(netquery(actualQ));
    }
    if (drawStatus && (actualQ.length > 1 || drawQ.indexOf(actualQ) == -1)) {
      dispatch(openDraw(actualQ));
    }
    if (!params.q && params.page == null && params.offset == null) {
      return;
    }
    dispatch(searchStart({ q, actualQ, dict, romaji, type }));

    NProgress.start();
    try {
      let result = getState().cache.find((item) => item.url == location.href);
      if (!result) {
        let apiParams = { dict, offset, page, q: actualQ, type };
        Object.keys(apiParams).forEach((key) => {
          if (apiParams[key] == null || apiParams[key] === "") {
            delete apiParams[key];
          }
        });
        result = await fetchJson(`${ROOTPATH}?api=1`, apiParams);
      }
      dispatch(replaceState({ params, hash }, ""));
      dispatch(search_result(result));
      dispatch(loadHash({ scrollTop, scrollTop2 }));
      dispatch(saveCache());
      try {
        if (!wordsEmpty(getState())) {
          let { keyword } = getPageInfo(getState());
          let now = new Date();
          let record = {
            dict,
            q: actualQ,
            page,
            offset,
            type,
            keyword,
            status: 0,
            time: +now,
          };
          if (!hid) {
            let existingHistoryRecord = await db.history
              .where("time")
              .between(+datePlusDays(now, -3), +now)
              .and((r) =>
                ["dict", "q", "page", "offset", "type"].every(
                  (param) => r[param] === record[param]
                )
              )
              .first();
            if (existingHistoryRecord) {
              hid = existingHistoryRecord.id;
            }
          }
          _c("debug") && console.log("update history", hid, record);
          putHistory(Object.assign(record, { id: hid }), {
            rootpath: ROOTPATH,
          });
        }
      } catch (e) {
        _c("debug") && console.log("error update history", e);
      }
    } catch (e) {
      dispatch(search_error(err));
    }
    NProgress.done();
  };
}

// save current url data to cache
export function saveCache() {
  return (dispatch, getState) => {
    let { words, nextPageMarker } = getState();
    if (
      words.length &&
      (!Array.isArray(words[0]) || words.some((a) => a.length))
    ) {
      dispatch({
        type: "UPDATE_CACHE",
        data: {
          url: location.href,
          words,
          nextPageMarker,
        },
      });
    }
  };
}

export function onSearch(e, { initiator = 0 } = {}) {
  cancelEvent(e);
  // when click search button on press enter on search input field
  return (dispatch, getState) => {
    let { q, dict, type, romaji } = getState();
    q = normalizeQ(q);
    if (!q) return dispatch(goHome(null, dict));
    dispatch(saveState({ local: "", q, dict, type, romaji }));
    dispatch({ type: "SEARCH_USER_INITIATE" });
    dispatch(searchRequest());
  };
}

export function onLoadMore(e) {
  // when load more result
  return async (dispatch, getState) => {
    let {
      words,
      searchActualQ: q,
      searchDict: dict,
      searchType: type,
      nextPageMarker: marker,
      config: { ROOTPATH },
    } = getState();
    let keepScrollTop =
      !Array.isArray(words[0]) &&
      e &&
      e.target &&
      e.target.classList.contains("content-bottom-load-more");
    dispatch({ type: "LOAD_MORE" });
    let params = {
      dict,
      marker,
      q,
      romaji: 0,
      type,
    };
    try {
      let result = await fetchJson(`${ROOTPATH}?api=1`, params);
      let currentLastWordEl = document.querySelector(
        ".dict-content .word:last-child"
      );
      let scrollTop =
        document.documentElement.scrollTop || document.body.scrollTop;
      let scrollTop2 = document.querySelector("#main-content").scrollTop;
      dispatch({ type: "LOAD_MORE_RESULT", result });
      if (keepScrollTop) {
        if (_c("columnWidth") && currentLastWordEl) {
          currentLastWordEl.scrollIntoView();
        } else if (scrollTop) {
          // workaround for bug that mobile view scroll to bottom after load more
          gotoTop({ scrollTop, scrollTop2 });
        }
      }
      dispatch(saveCache());
    } catch (error) {
      dispatch({ type: "LOAD_MORE_ERROR", error });
    }
  };
}

export function onDirectRequest(params, hash, replace) {
  // a inner link click
  return (dispatch, getState) => {
    let {
      dicts,
      config: { ROOTPATH, DEFAULTDICT },
    } = getState();
    if (!params.local) {
      if (!params.dict) {
        params.dict = DEFAULTDICT || dicts[0];
      }
    } else {
      dispatch(saveCache());
    }
    dispatch(saveState(params, undefined, replace));
    dispatch({ type: "DIRECT_REQUEST", dicts, params, hash });
    if (!params.local) {
      let { hid, nid } = params;
      dispatch(searchRequest({ hid, nid }));
    } else {
      gotoTop();
    }
  };
}

export function goHome(e, dict) {
  cancelEvent(e);
  return (dispatch, getState) => {
    let {
      dict: oldDict,
      dicts,
      config: { DEFAULTDICT },
    } = getState();
    if (dict === true) {
      dict = oldDict;
    }
    dict = dict || _c("defaultDict") || DEFAULTDICT || dicts[0];
    let searchType = _c("defaultType");
    let romaji = _c("defaultRomaji");
    dispatch(
      saveState({
        q: "",
        local: "",
        dict,
        type: searchType,
        romaji,
      })
    );
    dispatch({ type: "GO_HOME", dict, searchType, romaji });
  };
}

export function saveState(params, url, replace) {
  return (dispatch, getState) => {
    let {
      dicts,
      config: { ROOTPATH, DEFAULTDICT },
    } = getState();
    // console.log("saveState", params);
    url =
      url || ROOTPATH + getCanonicalUrlSearch(params, DEFAULTDICT || dicts[0]);
    if (url == location.pathname + location.search) {
      return dispatch(preserveFocus());
    }
    dispatch(
      replace
        ? replaceState({ params }, "", url)
        : pushState({ params }, "", url)
    );
  };
}

export function replaceState(state, title, url) {
  return (dispatch, getState) => {
    dispatch({ type: "REPLACESTATE", state, oldState: history.state });
    history.replaceState(state, title, url);
  };
}

// 1. save current state (with scroll location and other info)
// 2. change state
export function pushState(state, title, url) {
  return (dispatch, getState) => {
    let oldState;
    if (history.state) {
      oldState = history.state;
    } else {
      let {
        local,
        searchQ: q,
        searchDict: dict,
        searchType: type,
        searchRomaji: romaji,
        dicts,
        page,
        offset,
      } = getState();
      let params = { local, q, dict, type, romaji, page, offset };
      let hash = location.hash;
      oldState = { params, hash };
    }
    // console.log("pushState, oldState", oldState, "newState", state);
    oldState.scrollTop =
      document.documentElement.scrollTop || document.body.scrollTop;
    oldState.scrollTop2 = document.querySelector("#main-content").scrollTop;
    dispatch(replaceState(oldState, ""));
    dispatch({ type: "PUSHSTATE", state, oldState });
    history.pushState(state, title, url);
  };
}

// whe html5 history event trigger
export function popstate(state, e) {
  return (dispatch, getState) => {
    if (!state)
      // raw hash click event
      return;
    let { params, hash, scrollTop, scrollTop2 } = state;
    let oldState = getState();
    let {
      config: { DEFAULTDICT },
    } = oldState;
    let dicts = oldState.dicts;
    let { q, page, offset, local } = params;
    dispatch({
      type: "POPSTATE",
      params,
      dicts,
      hash,
      state,
      oldState: oldState.state,
    });
    if (q || page != null || local) {
      if (
        !local &&
        (["page", "offset"].some((key) => params[key] != oldState[key]) ||
          params.q != oldState.searchQ ||
          params.type != oldState.searchType ||
          params.romaji != oldState.searchRomaji ||
          params.dict != oldState.dict)
      ) {
        dispatch(searchRequest({ scrollTop, scrollTop2 }));
      } else {
        dispatch(loadHash({ scrollTop, scrollTop2 }));
      }
    } else {
      dispatch({
        type: "CLEAR",
        dict: params.dict || DEFAULTDICT || dicts[0],
        romaji: _c("defaultRomaji"),
      });
    }
  };
}

export function loadHash({ scrollTop, scrollTop2 } = {}) {
  // load state.hash and clear it
  return (dispatch, getState) => {
    if (scrollTop !== undefined || scrollTop2 !== undefined) {
      // console.log("set scrollTop", scrollTop, scrollTop2);
      gotoTop({ scrollTop, scrollTop2 });
    } else {
      let { hash } = getState();
      if (hash) {
        let wordEl = document.getElementById(hash.slice(1));
        if (wordEl) {
          wordEl.scrollIntoView();
        }
        dispatch({ type: "CLEAR_HASH" });
      }
    }
  };
}

export function goToWord(ev) {
  let el = getClickEventA(ev);
  if (!el) {
    return;
  }
  // when click a word in navibar
  return (dispatch, getState) => {
    ev.preventDefault();
    let {
      searchQ: q,
      searchDict: dict,
      searchRomaji: romaji,
      searchType: type,
      dicts,
      page,
      offset,
    } = getState();
    let params = { q, dict, type, romaji, page, offset };
    let hash = el.getAttribute("href");
    let wordEl = document.getElementById(hash.slice(1));
    if (wordEl) {
      dispatch(pushState({ params, hash }, "", hash));
      wordEl.scrollIntoView();
      dispatch(preserveFocus());
    }
  };
}

export function playSound(word, searchDict) {
  return (dispatch, getState) => {
    let {
      config: { ROOTPATH },
    } = getState();
    let wordTitle = typeof word == "object" ? eb2textclean(word.heading) : word;
    let wordId = wordGlobalId(word, searchDict);
    dispatch({ type: "PLAY_SOUND", wordId, wordTitle });
    document.querySelector(
      "#soundplayer"
    ).src = `${ROOTPATH}?api=1&binary=mp3&q=${encodeURIComponent(wordTitle)}`;
    document.querySelector("#soundplayer").play();
  };
}

export function playSoundStart(e) {
  return { type: "PLAY_SOUND_START" };
}

export function playSoundEnd(e) {
  return { type: "PLAY_SOUND_END" };
}

export function playSoundError(e) {
  return (dispatch, getState) => {
    let { playingSoundWordTitle: title } = getState();
    if (title) {
      let wordInfo = parseEbTitle(title);
      let speechSynthesisUtterance = browserPlaySpeech(
        wordInfo.keyword || wordInfo.hiragana
      );
      if (speechSynthesisUtterance) {
        // use browser play sound
        speechSynthesisUtterance.addEventListener("end", () => {
          dispatch({ type: "PLAY_SOUND_END" });
        });
        speechSynthesisUtterance.addEventListener("error", () => {
          dispatch({ type: "PLAY_SOUND_END" });
          toastr.error(
            "音声再生失敗",
            `${
              title ? `「${title}」` : "この単語"
            }の発音音声は今再生できません。`
          );
        });
        return;
      }
    }
    dispatch({ type: "PLAY_SOUND_END" });
    toastr.error(
      "音声再生失敗",
      `${title ? `「${title}」` : "この単語"}の発音音声は見つかりません。`
    );
  };
}

export function toggleFurigana(word, dict, lp) {
  return (dispatch, getState) => {
    let {
      words,
      livepreview,
      config: { ROOTPATH },
    } = getState();
    let index, dictIndex;
    if (lp) {
      dictIndex = livepreview.result.findIndex(
        (_word) => wordId(_word) == wordId(word)
      );
    } else if (Array.isArray(words[0])) {
      dictIndex = searchDictsSelector(getState()).indexOf(dict);
      index = words[dictIndex].indexOf(word);
    } else {
      index = words.indexOf(word);
    }
    if (index == -1) return;
    if (!word.furiganaStatus) {
      // 1 requesting; 2 show; 3 hidden
      dispatch({ type: "FURIGANA_REQUEST", word, dictIndex, lp });
      if (!lp) {
        if (Array.isArray(words[0])) {
          word = getState().words[dictIndex][index];
        } else {
          word = getState().words[index];
        }
      }
      let analyzeType = 4;
      let furiganaMode = _c("furiganaMode");
      if (furiganaMode) {
        if (furiganaMode == 1) {
          analyzeType = 0;
        } else if (furiganaMode == 2) {
          analyzeType = 5;
        }
      }
      fetch(`${ROOTPATH}?api=2&type=${analyzeType}`, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: word.text,
      })
        .then((res) => {
          if (res.status != 200 && res.status != 0)
            throw new Error(`Server return error ${res.status}`);
          return res.text();
        })
        .then(
          (furiganaText) => {
            dispatch({
              type: "FURIGANA_REQUEST_RESULT",
              word,
              furiganaText,
              dictIndex,
              lp,
            });
          },
          (error) => {
            dispatch({
              type: "FURIGANA_REQUEST_FAILED",
              word,
              error,
              dictIndex,
              lp,
            });
            toastr.error(
              "振り仮名付けを失敗しました",
              `今この単語の内容に振り仮名を付けることができません。`
            );
          }
        );
    } else if (word.furiganaStatus == 2) {
      dispatch({ type: "FURIGANA_HIDE", word, dictIndex, lp });
    } else if (word.furiganaStatus == 3) {
      dispatch({ type: "FURIGANA_SHOW", word, dictIndex, lp });
    }
  };
}

// analyze a japanese input sentense
export function analyze(q, scrollFlag) {
  return (dispatch, getState) => {
    let {
      analyzeQ,
      analyzeResult,
      config: { ROOTPATH },
    } = getState();
    if (analyzeQ == q && analyzeResult) {
      dispatch({ type: "ANALYZE_SHOW" });
    } else {
      dispatch({ type: "ANALYZE", q });
      fetchJson(`${ROOTPATH}?api=2`, { q, type: 1 }).then(
        (result) => dispatch({ type: "ANALYZE_RESULT", result }),
        (error) => {
          dispatch({ type: "ANALYZE_FAILED", error });
          toastr.error("解析を失敗しました");
        }
      );
    }
    if (scrollFlag) {
      if (document.querySelector("#netquery.netquery")) {
        gotoElOrTop("#analyze");
      } else {
        gotoElOrTop("#analyze", { mobileOnlyTop: true });
      }
    }
    dispatch(preserveFocus());
  };
}

export function closeAnalyze() {
  return { type: "ANALYZE_CLOSE" };
}

export function openDraw(q, scrollFlag) {
  return (dispatch, getState) => {
    dispatch({ type: "SET", drawStatus: 1, drawQ: q });
    if (scrollFlag) gotoElOrTop("#draw", { mobileOnlyTop: true });
  };
}

export function netquery(q, scrollFlag) {
  return (dispatch, getState) => {
    let {
      config,
      netqueryQ,
      netquerySourceIndex: index,
      netqueryStatus,
      netqueryResult,
    } = getState();
    if (netqueryQ == q && netqueryResult[index] !== undefined) {
      dispatch({ type: "NETQUERY_SHOW" });
    } else {
      dispatch({ type: "NETQUERY", q, index, resetflag: netqueryQ != q });
      netquery_request(netquery_sources[index], q, { config }).then(
        (result) =>
          dispatch({
            type: "NETQUERY_RESULT",
            result,
            index,
          }),
        (error) => {
          dispatch({ type: "NETQUERY_FAILED", error, index });
        }
      );
    }
    if (scrollFlag) gotoElOrTop("#netquery", { mobileOnlyTop: true });
    dispatch(preserveFocus());
  };
}

export function netqueryChangeSource(index) {
  return (dispatch, getState) => {
    let { netqueryQ, netquerySourceIndex, netqueryStatus, netqueryResult } =
      getState();
    if (netquerySourceIndex != index && netqueryStatus != 1) {
      dispatch({ type: "NETQUERY_CHANGE_SOURCE", index });
      if (getState().netqueryResult[index] === undefined) {
        dispatch(netquery(netqueryQ));
      } else {
        dispatch({ type: "NETQUERY_SHOW" });
      }
    }
    dispatch(preserveFocus());
  };
}

export function closeNetquery() {
  return { type: "NETQUERY_CLOSE" };
}

export function netqueryTogglePin() {
  return (dispatch, getState) => {
    let { netqueryPin } = getState();
    dispatch({ type: "SET", netqueryPin: netqueryPin == 1 ? 2 : 1 });
  };
}

export function set(state) {
  return Object.assign({ type: "SET" }, state);
}

export function assign(state) {
  return Object.assign({ type: "ASSIGN" }, state);
}

export function suggestionsClear() {
  return { type: "SUGGESTIONS_CLEAR" };
}

export function suggestionsRequest() {
  return async (dispatch, getState) => {
    let { q, romaji, suggestionsQ } = getState();
    let suggestionsLimit = _c("suggestionsLimit");
    let suggestionsProvider = _c("suggestionsProvider");
    if (suggestionsLimit === 0) {
      return;
    }
    q = normalizeQ(q, romaji);
    if (!q || q == suggestionsQ) {
      return;
    }
    try {
      let suggestions = [];
      if (!suggestionsProvider || suggestionsProvider == "wiktionary") {
        suggestions = (
          await fetchJson(
            `https://ja.wiktionary.org/w/api.php?action=opensearch&format=json&formatversion=2&search=${encodeURIComponent(
              q
            )}&limit=${suggestionsLimit || 2}&suggest=true&origin=*`
          )
        )[1];
      } else if (suggestionsProvider == "google") {
        suggestions = await fetchJsonp(
          `https://suggestqueries.google.com/complete/search?q=${encodeURIComponent(
            q
          )}&client=chrome&hl=ja`,
          { jsonpCallback: "jsonp" }
        )
          .then((res) => res.json())
          .then((data) =>
            data[1].filter((word) => {
              let index = word.lastIndexOf(" ");
              return word.startsWith(q) ? index < q.length : index == -1;
            })
          );
      }
      if (
        normalizeQ(getState().q, getState().romaji) == q &&
        suggestions.length
      ) {
        suggestions.length = Math.min(
          suggestions.length,
          suggestionsLimit || 2
        );
        dispatch({
          type: "SUGGESTIONS_REQUEST_SUCCESS",
          q,
          suggestions,
        });
      }
    } catch (error) {
      if (getState().q.trim() == q) {
        dispatch({ type: "SUGGESTIONS_REQUEST_ERROR", q, error });
      }
    }
  };
}

export function livepreviewTriggerMouseOver(info, meta = {}) {
  return async (dispatch, getState) => {
    // console.log("trigger mouseOver", info, meta, getState().livepreview.el);
    clearTimeout(getState().livepreview.outTimeout);
    if (getState().livepreview.el) {
      if (getState().livepreview.el == info.el) {
        if (meta.force || getState().livepreview.status != 4) {
          dispatch({
            type:
              getState().livepreview.status >= 3
                ? "LIVEPREVIEW_RESULT_DISPLAY"
                : "LIVEPREVIEW_REENTER",
          });
        }
        return;
      }
    }
    if (meta.directPreviewLink || !getState().livepreview.el) {
      doPreview();
    } else if (info.el != getState().livepreview.hoverEl) {
      clearTimeout(getState().livepreview.hoverTimeout);
      let hoverTimeout = setTimeout(doPreview, 500);
      dispatch({ type: "LIVEPREVIEW_HOVER", hoverEl: info.el, hoverTimeout });
    }

    function doPreview() {
      if (getState().livepreview.el) {
        dispatch(livepreviewCancel(true));
      }
      dispatch(livepreviewLoad(info, meta));
    }
  };
}

export function livepreviewTriggerMouseOut() {
  return async (dispatch, getState) => {
    let outTimeout = setTimeout(() => {
      dispatch(livepreviewCancel());
    }, 500);
    // console.log("trigger mouseOut", outTimeout);
    dispatch({ type: "LIVEPREVIEW_OUT", outTimeout });
  };
}

export function livepreviewPopoverMouseOver() {
  return async (dispatch, getState) => {
    // console.log("popup mouseOver", getState().livepreview.outTimeout);
    clearTimeout(getState().livepreview.hoverTimeout);
    if (getState().livepreview.outTimeout) {
      clearTimeout(getState().livepreview.outTimeout);
      dispatch({
        type:
          getState().livepreview.status == 3
            ? "LIVEPREVIEW_RESULT_DISPLAY"
            : "LIVEPREVIEW_REENTER",
      });
    }
  };
}

export function livepreviewPopoverMouseOut() {
  // console.log("popover mouseOut");
  return async (dispatch, getState) => {
    let outTimeout = setTimeout(() => {
      // console.log("popover mouseOut => cancel");
      dispatch(livepreviewCancel());
    }, 500);
    dispatch({ type: "LIVEPREVIEW_OUT", outTimeout });
  };
}

export function livepreviewLoad(info, meta = {}) {
  return async (dispatch, getState) => {
    let {
      config: { ROOTPATH },
    } = getState();
    let loadAbortController = new AbortController();
    dispatch({
      type: "LIVEPREVIEW_LOAD",
      info,
      meta: Object.assign(meta, info.meta || {}),
      loadAbortController,
    });
    if (info.el) {
      info.el.dataset.lpel = 1;
    }
    try {
      let dicts = multiDictsString2Array(info.params.dict);
      let result = await Promise.all([
        fetchJson(`${ROOTPATH}?api=1`, info.params, {
          signal: loadAbortController.signal,
        }),
        sleep(50),
      ]);
      result = result[0];
      if (getState().livepreview.status == 1) {
        if (result.words) {
          result = result.words;
        }
        if (Array.isArray(result[0])) {
          result = result.reduce((arr, words, i) => {
            words.forEach((word) => {
              word.dict = dicts[i];
            });
            return arr.concat(words);
          }, []);
        } else {
          result.forEach((word) => (word.dict = dicts[0]));
        }
        dispatch({
          type: getState().livepreview.outTimeout
            ? "LIVEPREVIEW_RESULT_WAIT_DISPLAY"
            : "LIVEPREVIEW_RESULT",
          result,
        });
        dispatch(notebookLoadWordNotes());
      }
    } catch (err) {
      if (err.name === "AbortError") {
        // console.log("Fetch aborted");
      } else {
        dispatch(livepreviewCancel());
      }
    }
  };
}

export function livepreviewCancel(abort = false) {
  return async (dispatch, getState) => {
    if (abort && getState().livepreview.loadAbortController) {
      getState().livepreview.loadAbortController.abort();
    }
    let lpEl = document.querySelector('*[data-lpel="1"]');
    if (lpEl) {
      delete lpEl.dataset.lpel;
    }
    dispatch({ type: "LIVEPREVIEW_CANCEL" });
  };
}

export function livepreviewClose(e) {
  cancelEvent(e);
  return (dispatch, getState) => {
    if (getState().livepreview.status != 2) {
      return;
    }
    dispatch({ type: "LIVEPREVIEW_CLOSE" });
    dispatch(preserveFocus());
  };
}

export function log(msg) {
  return { type: "LOG", msg };
}

export function createUserConfigProfile(profile, fromProfile) {
  return async (dispatch, getState) => {
    let result = await dbCreateUserConfigProfile(profile, fromProfile);
    if (!result) {
      return;
    }
    dispatch(syncUserConfigFromPersistence());
  };
}

export function removeUserConfigProfile(profile) {
  return async (dispatch, getState) => {
    let result = await dbRemoveUserConfigProfile(profile);
    if (!result) {
      return;
    }
    dispatch(syncUserConfigFromPersistence());
  };
}

export function setUserConfigProfile(profile) {
  return async (dispatch, getState) => {
    await dbSetUserConfigProfile(profile);
    dispatch(syncUserConfigFromPersistence());
  };
}

export function updateUserConfig(config, { overwrite } = {}) {
  return async (dispatch, getState) => {
    let { userConfigProfile: profile } = getState();
    await dbUpdateUserConfig({ data: config, profile, overwrite });
    await dispatch(syncUserConfigFromPersistence());
  };
}

export function syncUserConfigFromPersistence() {
  return async (dispatch, getState) => {
    let { userConfig, userConfigProfile, userConfigProfiles } =
      await dbGetUserConfigInfo(true);
    dispatch({
      type: "SET",
      userConfig,
      userConfigProfile,
      userConfigProfiles,
    });
    __user_config_effect__(window.__USERCONFIG__, window.__USERCONFIG_LOCAL__);
  };
}

export function openShare(word) {
  return { type: "SET", sharing: word };
}

export function closeShare() {
  return { type: "SET", sharing: null };
}

export function historyQ(e) {
  return { type: "HISTORY_Q", q: e.target ? e.target.value : e };
}

export function historyRefresh() {
  return (dispatch) => {
    dispatch(historyQuery({ clear: true }));
  };
}

export function historyFirst() {
  return (dispatch) => {
    dispatch(historyQuery());
  };
}

export function historyPrev() {
  return (dispatch) => {
    dispatch(historyQuery({ page: "prev" }));
  };
}

export function historyNext() {
  return (dispatch) => {
    dispatch(historyQuery({ page: "next" }));
  };
}

export function historyQuery({
  type,
  q,
  page = null,
  initial = false,
  clear = false,
} = {}) {
  return async (dispatch, getState) => {
    let {
      fromPopState,
      history: {
        records: oldRecords,
        queryQ,
        queryType,
        currentPageMarker,
        nextPageMarker,
        prevPageMarkers,
      },
    } = getState();
    if (fromPopState && initial && oldRecords.length) {
      return;
    }

    if (type === undefined) {
      type = queryType;
    }
    if (q === undefined) {
      q = queryQ;
    }

    let markerField;
    let marker = null;
    let historyPagination = _c("historyPagination");

    if (!queryType || queryType == "time") {
      markerField = "time";
    }
    if (type == queryType) {
      if (page == "next") {
        marker = nextPageMarker;
      } else if (page == "prev") {
        marker = prevPageMarkers.length
          ? prevPageMarkers[prevPageMarkers.length - 1]
          : null;
      }
    }

    gotoTop();
    dispatch({
      type: "HISTORY_QUERY",
      queryType: type,
      queryQ: q,
      page,
      clear,
    });
    try {
      let records = [];
      let newNextPageMarker = null;
      let newPrevPageMarkers = prevPageMarkers.slice();
      if (markerField) {
        if (!marker) {
          if (q) {
            records = await db.history
              .orderBy(markerField)
              .reverse()
              .filter((a) => a.keyword.toLowerCase().indexOf(q) != -1)
              .limit(historyPagination + 1)
              .toArray();
          } else {
            records = await db.history
              .orderBy(markerField)
              .reverse()
              .limit(historyPagination + 1)
              .toArray();
          }
        } else {
          if (q) {
            records = await db.history
              .where(markerField)
              .belowOrEqual(marker)
              .filter((a) => a.keyword.toLowerCase().indexOf(q) != -1)
              .reverse()
              .limit(historyPagination + 1)
              .toArray();
          } else {
            records = await db.history
              .where(markerField)
              .belowOrEqual(marker)
              .reverse()
              .limit(historyPagination + 1)
              .toArray();
          }
        }
        if (records.length == historyPagination + 1) {
          newNextPageMarker = records[records.length - 1][markerField];
          records.length--;
        }
      }
      if (page) {
        records = records.filter(
          (record) => !oldRecords.find((r) => r.id == record.id)
        );
      }
      if (markerField) {
        if (!page) {
          newPrevPageMarkers = []; // first page
        } else if (page == "next") {
          if (currentPageMarker) {
            newPrevPageMarkers.push(currentPageMarker);
          }
        } else if (page == "prev") {
          newPrevPageMarkers = prevPageMarkers.slice();
          newPrevPageMarkers.pop();
        }
      }
      dispatch({
        type: "HISTORY_QUERY_RESULT",
        records,
        currentPageMarker: marker,
        prevPageMarkers: newPrevPageMarkers,
        nextPageMarker: newNextPageMarker,
      });
    } catch (error) {
      dispatch({ type: "HISTORY_QUERY_ERROR", error });
    }
  };
}

export function historyClear({} = {}) {
  return async (dispatch, getState) => {
    db.history.clear();
    dispatch({ type: "HISTORY_CLEAR" });
  };
}

export function notebookAnkiSync(
  ev,
  { cronjob = false, autosync = false, forceSync = false } = {}
) {
  ev && ev.preventDefault();
  return async (dispatch, getState) => {
    let isBackground = cronjob || autosync;
    if (
      getState().notebook.ankiStatus != 0 ||
      _c("ankiConnectStatus") == 0 ||
      (_c("ankiConnectStatus") == 1 && isBackground)
    ) {
      return;
    }
    dispatch({ type: "ANKI_SYNC" });
    let result = await dbAnkiSync({ isBackground, forceSync });
    if (!isBackground) {
      if (result.conflict) {
        toastr.warning("Anki sync conflict: another sync instance is running");
      } else if (result.error) {
        toastr.error(`Anki sync FAILED: ${result.error.toString()}.`);
      } else {
        toastr.success(
          "Anki sync SUCCESS.",
          !result.changed
            ? "No changes made to Anki."
            : `Added ${result.added} notes to Anki.\nModified ${result.modified} notes in Anki.\nDeleted ${result.deleted} notes from Anki.`
        );
      }
    }
    await dispatch(fetchMeta({ refresh: true }));
    dispatch({ type: "ANKI_SYNC_DONE" });
  };
}

export function notebookAnkiAutoSync(ev) {
  ev && ev.preventDefault();
  return async (dispatch, getState) => {
    let ankiConnectStatus = _d("ankiConnectStatus");
    if (ankiConnectStatus == 0) {
      return;
    }
    ankiConnectStatus = ankiConnectStatus == 1 ? 2 : 1;
    await dispatch(updateUserConfig({ ankiConnectStatus }));
  };
}

export function notebookAnkiDisconnect(ev) {
  ev && ev.preventDefault();
  return async (dispatch, getState) => {
    await dispatch(updateUserConfig({ ankiConnectStatus: 0 }));
    try {
      await db.transaction("rw", db.meta, async (tx) => {
        await db.meta.delete("inProcessAnkiSync");
        await db.meta.delete("lastAnkiSyncTime");
      });
    } catch (e) {}
    await dispatch(fetchMeta({ refresh: true }));
    dispatch({ type: "ANKI_DISCONNECT" });
  };
}

export function notebookAnkiConnect(ev, { test = 0, addr = "" } = {}) {
  ev && ev.preventDefault();
  return async (dispatch, getState) => {
    if (getState().notebook.ankiStatus) {
      return;
    }
    addr = !test
      ? parseUrl(addr, {
          href: defaultUserConfig.ankiConnectAddr,
          hostname: defaultUserConfig.ankiConnectHostname,
          port: defaultUserConfig.ankiConnectPort,
        })
      : _c("ankiConnectAddr");
    dispatch({ type: "ANKI_CONNECT" });
    try {
      let result;
      result = await ankiRequest(
        {
          action: "requestPermission",
          version: 6,
        },
        null,
        addr
      );
      if (result.permission != "granted") {
        throw new Error("permission denied");
      }
      result = await ankiRequest(
        {
          action: "version",
          version: 6,
        },
        _c("ankiConnectApiKey"),
        addr
      );
      if (result != 6) {
        throw new Error(
          `Unsupported AnkiConnect API version: ${result.result}. (Supported API version: 6)`
        );
      }
      toastr.success(`Anki SUCCESS connected to ${addr}.`);
      if (!test) {
        await dispatch(
          updateUserConfig({ ankiConnectStatus: 1, ankiConnectAddr: addr })
        );
      }
    } catch (e) {
      toastr.error(`Anki FAILED connect to ${addr} : ${e.toString()}.`);
    }
    dispatch({ type: "ANKI_CONNECT_DONE" });
  };
}

// show latest 1000 tags
export function notebookTags() {
  return async (dispatch, getState) => {
    let {
      notebook: { tagFilter },
    } = getState();
    let tagsLimit = _c("notebookTagsLimit");
    let tags;
    if (tagsLimit) {
      tags = await db.tag.orderBy("time").reverse().limit(tagsLimit).toArray();
    } else {
      tags = await db.tag.orderBy("name").toArray();
    }
    if (tagFilter) {
      let tags2 = await db.tag
        .where("name")
        .startsWithIgnoreCase(tagFilter)
        .limit(20)
        .toArray();
      tags = tags2
        .concat(
          tags.filter(
            (tag) =>
              tag.name.toLowerCase().indexOf(tagFilter.toLowerCase()) != -1
          )
        )
        .filter(
          (tag, i, arr) => arr.findIndex((t) => t.name === tag.name) === i
        );
    } else {
      tags.sort();
    }
    dispatch({ type: "NOTEBOOK_TAGS", tags });
  };
}

export function notebookLoadWordNotes() {
  return async (dispatch, getState) => {
    let wordNotes = [];
    let isEmpty = wordsEmpty(getState());
    let { searchDict, words, livepreview } = getState();

    if (!isEmpty || livepreview.result.length) {
      let dictids = [];
      if (searchDict.indexOf("_") == -1) {
        dictids = words.map((word) => `${searchDict}_${wordDictId(word)}`);
      } else {
        let searchDicts = searchDictsSelector(getState());
        dictids = words
          .map((words, i) =>
            words.map((word) => `${searchDicts[i]}_${wordDictId(word)}`)
          )
          .reduce((dictids, v) => dictids.concat(v), []);
      }
      dictids = dictids.concat(
        livepreview.result.map((word) => `${word.dict}_${wordDictId(word)}`)
      );
      wordNotes = await db.notebook.where("dictid").anyOf(dictids).toArray();
    }
    dispatch({ type: "NOTEBOOK_WORDNOTES", wordNotes });
  };
}

export function notebookDelete({ id }) {
  return async (dispatch, getState) => {
    let {
      config: { ROOTPATH },
    } = getState();
    try {
      let result = await deleteNote(id, { rootpath: ROOTPATH });
      await dispatch(fetchMeta({ refresh: true }));
      dispatch({ type: "NOTEBOOK_DELETE", ...result });
    } catch (e) {
      dispatch({
        type: "NOTEBOOK_EDIT_ERROR",
        error: `delete_note_error|${e.toString()}`,
      });
    }
  };
}

export function notebookEdit({ e, note, word, dict }) {
  cancelEvent(e);
  return { type: "NOTEBOOK_EDIT", note, word, dict };
}

export function notebookCreate(e) {
  cancelEvent(e);
  return { type: "NOTEBOOK_CREATE" };
}

export function notebookEditEnd() {
  return { type: "NOTEBOOK_EDIT_END" };
}

export function notebookUpdate({
  id,
  comment,
  title,
  heading,
  content,
  tag,
  addTag,
  deleteTag,
  time,
}) {
  return async (dispatch, getState) => {
    let {
      config: { ROOTPATH },
    } = getState();
    let note = {};
    if (id) {
      note = await db.notebook.get(id);
      if (!note) {
        dispatch({ type: "NOTEBOOK_EDIT_ERROR", error: "note_not_found" });
        return;
      }
      if (time && time !== note.time) {
        dispatch({
          type: "NOTEBOOK_EDIT_ERROR",
          error: "note_update_conflict",
        });
        return;
      }
    }

    let mod = {
      comment,
      title,
      heading,
      content,
      tag,
    };
    Object.keys(mod).forEach((key) => {
      if (mod[key] !== undefined) {
        note[key] = mod[key];
      }
    });
    if (addTag || deleteTag) {
      note.tag = note.tag || [];
      if (addTag) {
        let i = note.tag.indexOf(addTag);
        if (i == -1) {
          note.tag.push(addTag);
        }
      }
      if (deleteTag) {
        let i = note.tag.indexOf(deleteTag);
        if (i != -1) {
          note.tag.splice(i, 1);
        }
      }
    }
    let result = await putNote(note, { rootpath: ROOTPATH });
    await dispatch(fetchMeta({ refresh: true }));
    dispatch({ type: "NOTEBOOK_PUT", ...result });
  };
}

export function notebookPut({ word, dict, comment, tag }) {
  return async (dispatch, getState) => {
    let {
      config: { ROOTPATH },
    } = getState();
    let noteData = getWordNote({ word, dict });
    let existingNote = await db.notebook
      .where("dictid")
      .equals(`${dict}_${wordDictId(word)}`)
      .first();
    if (existingNote) {
      noteData.id = existingNote.id;
    }
    let result = await putNote(noteData, { merge: true, rootpath: ROOTPATH });
    await dispatch(fetchMeta({ refresh: true }));
    dispatch({ type: "NOTEBOOK_PUT", ...result });
  };
}

export async function notebookImport(content) {
  return async (dispatch, getState) => {
    let result = { successCnt: 0 };
    dispatch({ type: "NOTEBOOK_IMPORT" });
    try {
      const notes = csvParse(content, {
        columns: true,
        skip_empty_lines: true,
      });
      // console.log("notes", notes);
      result = await dbImportNotes(notes);
    } catch (e) {}
    await dispatch(fetchMeta({ refresh: true }));
    dispatch(notebookTags());
    dispatch(notebookRefresh());
    dispatch({ type: "NOTEBOOK_IMPORT_DONE" });
    return result;
  };
}

export function notebookExport(tag, format) {
  return async (dispatch, getState) => {
    let notes = db.notebook;
    if (tag) {
      notes = notes.where("tag").equalsIgnoreCase(tag.name);
    }
    notes = await notes.toArray();
    let str;
    if (format == "txt") {
      str = notes
        .map((note) => {
          let dict = "";
          if (note.dictid) {
            dict = note.dictid.slice(0, note.dictid.indexOf("_"));
          }
          return `${note.title || "未命名ノート"}\n${
            note.content || ""
          }\n----------\n${note.comment ? note.comment + "\n" : ""}${formatTime(
            note.time
          )} | ${dict ? dict + " | " : ""}Tag: ${(note.tag || []).join(", ")}`;
        })
        .join("\n\n\n");
    } else {
      str = csvStringify(notes, {
        bom: true,
        header: true,
        columns: [
          "title",
          "heading",
          "content",
          "comment",
          "tag",
          "time",
          "dictid",
          "id",
        ],
      });
    }

    // console.log(str);
    downloadAsFile(
      str,
      tag
        ? `Soradict-Notebook (tag - ${tag.name}) (${formatTime(null, {
            date: 1,
          })}).${format}`
        : `Soradict-Notebook (${formatTime(null, { date: 1 })}).${format}`,
      format == "txt" ? "text/plain" : `text/${format}`
    );
  };
}

export function userConfigImport(str) {
  return async (dispatch, getState) => {
    try {
      let userConfig = JSON.parse(str);
      if (typeof userConfig != "object" || Array.isArray(userConfig)) {
        throw new Error("invalid file contents");
      }
      await dispatch(updateUserConfig(userConfig));
      return {};
    } catch (error) {
      return { error };
    }
  };
}

export function userConfigExport() {
  return async (dispatch, getState) => {
    let userConfig = window.__USERCONFIG__;
    let profile = window.__USERCONFIG_PROFILE__ || "default";
    downloadAsFile(
      JSON.stringify(userConfig, null, 2),
      `Soradict-UserConfig_${formatTime(null, { date: 1 })}-${profile}.json`,
      "application/json"
    );
  };
}

export function notebookModal() {
  return { type: "NOTEBOOK_MODAL" };
}

export function notebookQ(e) {
  return { type: "NOTEBOOK_Q", q: e.target ? e.target.value : e };
}

export function notebookQuery({
  q,
  tag,
  page = null,
  initial = false,
  clear = false,
} = {}) {
  return async (dispatch, getState) => {
    let {
      fromPopState,
      notebook: {
        notes: oldNotes,
        queryQ,
        queryTag,
        offset,
        currentPageMarker,
        nextPageMarker,
        prevPageMarkers,
      },
    } = getState();
    if (fromPopState && initial && oldNotes.length) {
      return;
    }
    let markerField;
    let marker = null;
    let notebookPagination = _c("notebookPagination");

    if (q === undefined) {
      q = queryQ;
    }
    if (tag === undefined) {
      tag = queryTag;
    }
    if (!tag) {
      markerField = "time";
    }

    if (page == "next") {
      if (markerField) {
        marker = nextPageMarker;
      } else {
        offset += oldNotes.length;
      }
    } else if (page == "prev") {
      if (markerField) {
        marker = prevPageMarkers.length
          ? prevPageMarkers[prevPageMarkers.length - 1]
          : null;
      } else {
        offset = Math.max(0, offset - notebookPagination);
      }
    } else {
      offset = 0;
    }

    gotoTop();
    dispatch({
      type: "NOTEBOOK_QUERY",
      queryQ: q,
      queryTag: tag,
      page,
      marker,
      clear,
    });
    try {
      let notes = [];
      let newNextPageMarker = null;
      let newPrevPageMarkers = prevPageMarkers.slice();
      let hasNext = false;
      if (markerField) {
        if (!marker) {
          if (q) {
            notes = await db.notebook
              .orderBy(markerField)
              .reverse()
              .filter((a) => a.title.toLowerCase().indexOf(q) != -1)
              .limit(notebookPagination + 1)
              .toArray();
          } else {
            notes = await db.notebook
              .orderBy(markerField)
              .reverse()
              .limit(notebookPagination + 1)
              .toArray();
          }
        } else {
          if (q) {
            notes = await db.notebook
              .where(markerField)
              .belowOrEqual(marker)
              .filter((a) => a.title.toLowerCase().indexOf(q) != -1)
              .reverse()
              .limit(notebookPagination + 1)
              .toArray();
          } else {
            notes = await db.notebook
              .where(markerField)
              .belowOrEqual(marker)
              .reverse()
              .limit(notebookPagination + 1)
              .toArray();
          }
        }
        if (notes.length == notebookPagination + 1) {
          newNextPageMarker = notes[notes.length - 1][markerField];
          notes.length--;
          hasNext = true;
        }
      } else {
        if (q) {
          notes = await db.notebook
            .where("tag")
            .equalsIgnoreCase(tag)
            .filter((a) => a.title.toLowerCase().indexOf(q) != -1)
            .offset(offset)
            .limit(notebookPagination + 1)
            .toArray();
        } else {
          notes = await db.notebook
            .where("tag")
            .equalsIgnoreCase(tag)
            .offset(offset)
            .limit(notebookPagination + 1)
            .toArray();
        }
        if (notes.length == notebookPagination + 1) {
          notes.length--;
          hasNext = true;
        }
        notes.sort((a, b) => b.time - a.time);
      }

      if (page) {
        notes = notes.filter((note) => !oldNotes.find((r) => r.id == note.id));
      }
      if (markerField) {
        if (!page) {
          newPrevPageMarkers = []; // first page
        } else if (page == "next") {
          if (currentPageMarker) {
            newPrevPageMarkers.push(currentPageMarker);
          }
        } else if (page == "prev") {
          newPrevPageMarkers = prevPageMarkers.slice();
          newPrevPageMarkers.pop();
        }
      }
      dispatch({
        type: "NOTEBOOK_QUERY_RESULT",
        notes,
        offset,
        hasNext,
        currentPageMarker: marker,
        prevPageMarkers: newPrevPageMarkers,
        nextPageMarker: newNextPageMarker,
      });
    } catch (error) {
      dispatch({ type: "NOTEBOOK_QUERY_ERROR", error });
    }
  };
}

export function fetchMeta({ e, refresh = false } = {}) {
  cancelEvent(e);
  return async (dispatch, getState) => {
    if (refresh || !getState().meta.time) {
      try {
        await dbSyncMeta();
      } catch (e) {
        console.log("warning, fetch meta errror", e);
      }
      let metadata = await db.meta.toArray();
      dispatch({ type: "FETCH_META", metadata });
    }
  };
}

export function notebookRefresh() {
  return (dispatch) => {
    return dispatch(notebookQuery({ clear: true }));
  };
}

export function notebookFirst() {
  return (dispatch) => {
    return dispatch(notebookQuery());
  };
}

export function notebookPrev() {
  return (dispatch) => {
    return dispatch(notebookQuery({ page: "prev" }));
  };
}

export function notebookNext() {
  return (dispatch) => {
    return dispatch(notebookQuery({ page: "next" }));
  };
}

export function notebookToggle(note) {
  return { type: "NOTEBOOK_TOGGLE", note };
}

export function notebookTagFilter(tagFilter) {
  return async (dispatch, getState) => {
    dispatch({ type: "NOTEBOOK_TAGFILTER", tagFilter });
    await dispatch(notebookTags());
  };
}

export function googleSignin() {
  return async (dispatch, getState) => {
    let {
      config: { ROOTPATH },
    } = getState();
    dispatch({ type: "GOOGLE_SIGNIN" });
    popupTools.popup(
      ROOTPATH + "?api=4",
      "Google Login",
      { width: 800, height: 600 },
      async function (error, data) {
        // this executes when closed
        if (!error) {
          await dispatch({ type: "GOOGLE_SIGNIN_OK", data });
          await db.meta.bulkPut([
            {
              key: "googleUserInfo",
              value: JSON.stringify(data.userInfo),
            },
            { key: "googleTokens", value: JSON.stringify(data.tokens) },
          ]);
          await dispatch(fetchMeta());
          dispatch(googleUserInfoCache(true));
          dispatch(googleSync());
        } else {
          dispatch({ type: "GOOGLE_SIGNIN_ERROR", error });
          // alert(`Googleログインを失敗しました。Error: ${error.toString()}`);
        }
      }
    );
  };
}

// cache (store) google signin result to localStorage
export function googleUserInfoCache(force) {
  return (dispatch, getState) => {
    let {
      config: { SITEID },
    } = getState();
    let key = `${SITEID}_googleUserInfo`;
    let metaValues = getMetaValues(getState());
    if (metaValues.googleUserInfo) {
      if (force || !localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify(metaValues.googleUserInfo));
      }
    } else if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
    }
  };
}

export function googleSignout() {
  return async (dispatch, getState) => {
    dispatch({ type: "GOOGLE_SIGNOUT" });
    await db.meta.bulkDelete(["googleUserInfo", "googleTokens"]);
    await dispatch(fetchMeta());
    dispatch(googleUserInfoCache(true));
  };
}

export function googleSync(options = {}) {
  return async (dispatch, getState) => {
    let {
      config: { ROOTPATH },
      cloud: { syncStatus },
    } = getState();
    let metaData = getMetaValues(getState());
    if (!metaData.googleTokens || syncStatus == 1) {
      return;
    }
    dispatch({ type: "CLOUD_SYNC" });
    try {
      let result = await dbSync(
        ROOTPATH + "?api=4&type=3",
        Object.assign(options, {
          refresh,
        })
      );
      dispatch({ type: "CLOUD_SYNC_FINISH" });
      if (result.changed && options.fromNotebook) {
        dispatch(notebookRefresh());
      }
      if (result.historyChanged && options.fromHistory) {
        dispatch(historyRefresh());
      }
    } catch (error) {
      dispatch({ type: "CLOUD_SYNC_ERROR", error });
    }
    refresh();
    if (!options.background) {
      dispatch(syncUserConfigFromPersistence());
    }
    function refresh() {
      dispatch(fetchMeta({ refresh: true }));
    }
  };
}

export function googleResetSync() {
  return async (dispatch, getState) => {
    await dbResetSync();
  };
}

export function googleOpenDataFile() {
  return async (dispatch, getState) => {
    let metaData = getMetaValues(getState());
    if (!metaData?.googleTokens?.dataFileUrl) {
      return;
    }
    window.open(metaData.googleTokens.dataFileUrl);
  };
}

export function googleTestScript() {
  return async (dispatch, getState) => {
    let {
      config: { ROOTPATH },
    } = getState();
    let metaData = getMetaValues(getState());
    if (!metaData.googleTokens) {
      console.log("abort because of no tokens");
      return;
    }
    let { access_token, refresh_token, expiry_date, appid } =
      metaData.googleTokens;
    let data = await fetchJson(ROOTPATH + "?api=4&type=3", {
      access_token,
      refresh_token,
      expiry_date,
      appid,
    });
  };
}

let tick = 0;

export async function cronjob({ syncMinInterval = 0 } = {}) {
  return async (dispatch, getState) => {
    if (getState().cronjobStatus != 0) {
      return;
    }
    dispatch({ type: "CRONJOB_START" });
    try {
      await dispatch(fetchMeta({ refresh: true }));
      let metaData = getMetaValues(getState());
      if (
        metaData.notSyncedNoteCnt ||
        metaData.notSyncedDeletedNoteCnt ||
        tick % 6 == 1
      ) {
        if (_c("debugSync")) {
          console.log(new Date(), `cronjob sync`);
        }
        await dispatch(googleSync({ background: true }));
      }
    } catch (e) {}
    try {
      if (_c("ankiConnectStatus") == 2 && tick % 6 == 1) {
        await dispatch(
          notebookAnkiSync(null, { cronjob: true, autosync: true })
        );
      }
    } catch (e) {}
    tick = ++tick % 2880; // 24 hours cycle (30 seconds per tick)
    dispatch({ type: "CRONJOB_DONE" });
  };
}

export function cloudPage(page) {
  return (dispatch, getState) => {
    gotoTop();
    dispatch({ type: "CLOUD_PAGE", page });
  };
}

export function init() {
  return async (dispatch, getState) => {
    dispatch(syncUserConfigFromPersistence());
    dispatch(saveCache());
    await dispatch(fetchMeta({ refresh: true }));
    dispatch(googleUserInfoCache()); // <= 1.2.13, googleUserInfo do not IN localStorage
    dispatch(googleSync({ background: true }));
    dispatch(notebookLoadWordNotes());
  };
}

export function parserShow(ev, scrollFlag = 1) {
  cancelEvent(ev);
  return async (dispatch, getState) => {
    dispatch({ type: "PARSER_SHOW" });
    if (scrollFlag) gotoElOrTop("#parser", { mobileOnlyTop: true });
  };
}

export function parserClose() {
  return async (dispatch, getState) => {
    if (getState().parser.abortController) {
      getState().parser.abortController.abort();
    }
    dispatch({ type: "PARSER_CLOSE" });
  };
}

export function parserInput(e) {
  return { type: "PARSER_Q", q: e.target.value };
}

export function parserExecute(ev) {
  cancelEvent(ev);
  return async (dispatch, getState) => {
    let {
      parser,
      config: { ROOTPATH },
    } = getState();
    let q = parser.q.trim();
    if (!q) {
      dispatch({ type: "PARSER_CLEAR", all: true });
      return;
    }
    if (parser.abortController) {
      parser.abortController.abort();
    }
    let abortController = new AbortController();
    let parserTab = _c("parserTab");
    dispatch({ type: "PARSER_EXECUTE", abortController, parserTab });
    if (!parserTab) {
      try {
        let analyzeType = 4;
        let furiganaMode = _c("parserFuriganaMode");
        let parserLpMode = _c("parserLpMode");
        if (furiganaMode) {
          if (furiganaMode == 1) {
            analyzeType = 0;
          } else if (furiganaMode == 2) {
            analyzeType = 5;
          }
        }
        let res = await fetch(
          `${ROOTPATH}?api=2&type=${analyzeType}&lp=${+!parserLpMode}&title=1`,
          {
            method: "POST",
            headers: {
              "Content-Type": "text/plain",
            },
            body: q,
            signal: abortController.signal,
          }
        );
        let result = await res.text();
        dispatch({ type: "PARSER_EXECUTE_RESULT", result, parserTab });
      } catch (error) {
        dispatch({ type: "PARSER_EXECUTE_ERROR", error, parserTab });
      }
    } else if (parserTab == 1) {
      try {
        let parserTranslatorTarget = _c("parserTranslatorTarget");
        let res = await fetch(
          `${ROOTPATH}?api=2&type=3&target=${parserTranslatorTarget}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "text/plain",
            },
            body: q,
            signal: abortController.signal,
          }
        );
        res = await res.json();
        dispatch({
          type: "PARSER_EXECUTE_RESULT",
          parserTab,
          result: res.translation,
        });
      } catch (error) {
        dispatch({ type: "PARSER_EXECUTE_ERROR", parserTab, error });
      }
    } else if (parserTab == 2) {
      try {
        let res = await fetch(`${ROOTPATH}?api=2&type=7`, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain",
          },
          body: q,
          signal: abortController.signal,
        });
        res = await res.json();
        dispatch({
          type: "PARSER_EXECUTE_RESULT",
          parserTab,
          result: res,
        });
      } catch (error) {
        dispatch({ type: "PARSER_EXECUTE_ERROR", parserTab, error });
      }
    } else if (parserTab == 3) {
      try {
        if (q.match(REGEX_ENGLISH_FULL)) {
          q = romajiConvert(q);
        }
        let res = await fetch(`${ROOTPATH}?api=2&type=6`, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain",
          },
          body: q,
          signal: abortController.signal,
        });
        res = await res.json();
        dispatch({
          type: "PARSER_EXECUTE_RESULT",
          parserTab,
          result: res,
        });
      } catch (error) {
        dispatch({ type: "PARSER_EXECUTE_ERROR", parserTab, error });
      }
    }
  };
}

export function parserClear() {
  return async (dispatch, getState) => {
    dispatch({ type: "PARSER_CLEAR" });
  };
}

export function parserToggleLpMode() {
  return async (dispatch, getState) => {
    let parserLpMode = +!_d("parserLpMode");
    await dispatch(
      updateUserConfig({
        parserLpMode,
      })
    );
    dispatch({
      type: parserLpMode ? "PARSER_LPMODE_DISABLE" : "PARSER_LPMODE_ENABLE",
    });
  };
}

export function parserTab(e) {
  return async (dispatch, getState) => {
    let parserTab = parseInt(e.target.dataset.tab);
    if (_c("parserTab") != parserTab)
      await dispatch(updateUserConfig({ parserTab }));
  };
}
