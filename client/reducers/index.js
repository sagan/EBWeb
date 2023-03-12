// rootReducer.js
const { combineReducers, createStore } = require("redux");
const { reducer: toastrReducer } = require("react-redux-toastr");
const livepreview = require("./livepreview");
const history = require("./history");
const notebook = require("./notebook");
const meta = require("./meta");
const cloud = require("./cloud");
const parser = require("./parser");
const { updateArrElement } = require("./common");

const rootReducer = combineReducers({
  cronjobStatus,
  toastr: toastrReducer,
  local,
  q,
  multiStyle,
  qChanged,
  suggestions,
  suggestionsQ,
  searchQ,
  searchActualQ,
  analyzeQ,
  analyzeStatus,
  analyzeResult,
  analyzeShowMore,
  netqueryQ,
  loadingMore,
  netqueryStatus,
  netqueryResult,
  netqueryPin,
  netquerySourceIndex,
  netqueryError,
  searchDict,
  searchRomaji,
  searchType,
  drawQ,
  drawSpeed,
  drawStatus,
  dict,
  romaji,
  hash,
  type,
  dicts,
  words,
  nextPageMarker,
  searching,
  sharing,
  playingSoundWordId,
  playingSoundWordTitle,
  playing,
  error,
  page,
  offset,
  history,
  notebook,
  meta,
  cloud,
  parser,
  livepreview,
  logdata,
  cache,
  nowState,
  oldState,
  fromPopState, // whether current state (nowState) is from a popevent event
  userConfig,
  userConfigProfile,
  userConfigProfiles,
  config: (state = {}) => state, //just keep the same
});

module.exports = rootReducer;

function cronjobStatus(state = 0, action) {
  switch (action.type) {
    case "CRONJOB_START":
      return 1;
    case "CRONJOB_DONE":
      return 0;
    default:
      return state;
  }
}

function fromPopState(state = false, action) {
  switch (action.type) {
    case "PUSHSTATE":
      return false;
    case "POPSTATE":
      return true;
    default:
      return state;
  }
}

function nowState(state = null, action) {
  switch (action.type) {
    case "REPLACESTATE":
    case "PUSHSTATE":
    case "POPSTATE":
      return action.state ?? null;
    default:
      return state;
  }
}

function oldState(state = null, action) {
  switch (action.type) {
    case "REPLACESTATE":
    case "PUSHSTATE":
    case "POPSTATE":
      return action.oldState ?? null;
    default:
      return state;
  }
}

function local(state = "", action) {
  switch (action.type) {
    case "GO_HOME":
    case "SEARCH_USER_INITIATE":
    case "HOME_SELECT_DICT":
      return "";
    case "POPSTATE":
    case "DIRECT_REQUEST":
      return action.params.local ?? "";
    default:
      return state;
  }
}

function cache(state = [], action) {
  switch (action.type) {
    case "SET":
      return action.cache ?? state;
    case "UPDATE_CACHE":
      let cache = state.slice();
      let index = cache.findIndex((item) => item.url == action.data.url);
      if (index != -1) {
        cache.splice(index, 1);
      }
      cache.push(action.data);
      if (cache.length > 20) {
        cache.shift();
      }
      return cache;
    default:
      return state;
  }
}

function sharing(state = null, action) {
  switch (action.type) {
    case "SET":
      return action.sharing ?? state;
    case "SEARCH_START":
    case "GO_HOME":
      return null;
    default:
      return state;
  }
}

function logdata(state = "", action) {
  switch (action.type) {
    case "SET":
      return action.logdata ?? state;
    case "LOG":
      return state + "\n" + action.msg;
    case "CLEARLOG":
      return "";
    default:
      return state;
  }
}

function userConfig(state = {}, action) {
  switch (action.type) {
    case "SET":
      return action.userConfig ?? state;
    default:
      return state;
  }
}

function userConfigProfile(state = "default", action) {
  switch (action.type) {
    case "SET":
      return action.userConfigProfile ?? state;
    default:
      return state;
  }
}

function userConfigProfiles(state = ["default"], action) {
  switch (action.type) {
    case "SET":
      return action.userConfigProfiles ?? state;
    default:
      return state;
  }
}

function drawQ(state = "", action) {
  switch (action.type) {
    case "SET":
      return action.drawQ ?? state;
    default:
      return state;
  }
}

function drawSpeed(state = 2, action) {
  switch (action.type) {
    case "SET":
      return action.drawSpeed ?? state;
    default:
      return state;
  }
}

function drawStatus(state = 0, action) {
  switch (action.type) {
    case "SET":
      return action.drawStatus ?? state;
    default:
      return state;
  }
}

function multiStyle(state = 0, action) {
  switch (action.type) {
    case "SET":
      return action.multiStyle ?? state;
    default:
      return state;
  }
}

function qChanged(state = false, action) {
  switch (action.type) {
    case "SET":
      return action.qChanged ?? state;
    case "CHANGE_Q":
      return true;
    case "SEARCH_USER_INITIATE":
    case "GO_HOME":
      return false;
    default:
      return state;
  }
}

function suggestionsQ(state = "", action) {
  switch (action.type) {
    case "SUGGESTIONS_REQUEST_SUCCESS":
      return action.q;
    case "SUGGESTIONS_REQUEST_ERROR":
      return "";
    case "SUGGESTIONS_CLEAR":
      return "";
    case "SUGGESTIONS_REQUEST":
    default:
      return state;
  }
}

function suggestions(state = [], action) {
  switch (action.type) {
    case "SUGGESTIONS_REQUEST_SUCCESS":
      return action.suggestions;
    case "SUGGESTIONS_REQUEST_ERROR":
      return state.length > 0 ? [] : state;
    case "SUGGESTIONS_CLEAR":
      return state.length > 0 ? [] : state;
    case "SUGGESTIONS_REQUEST":
    default:
      return state;
  }
}

function analyzeShowMore(state = 0, action) {
  switch (action.type) {
    case "SET":
      return action.analyzeShowMore ?? state;
    default:
      return state;
  }
}

function analyzeQ(state = "", action) {
  switch (action.type) {
    case "ANALYZE":
      return action.q;
    default:
      return state;
  }
}
function analyzeStatus(state = 0, action) {
  switch (action.type) {
    case "SEARCH_START":
      return state == 3 ? 0 : state;
    case "ANALYZE":
      return 1;
    case "ANALYZE_RESULT":
      return 2;
    case "ANALYZE_CLOSE":
      return 0; // closed (hidden)
    case "ANALYZE_SHOW":
      return 2;
    case "ANALYZE_FAILED":
      return 0;
    default:
      return state;
  }
}
function analyzeResult(state = null, action) {
  switch (action.type) {
    case "ANALYZE":
      return null;
    case "ANALYZE_RESULT":
      return action.result;
    default:
      return state;
  }
}

function netqueryPin(state = 0, action) {
  switch (action.type) {
    case "SEARCH_START":
    case "GO_HOME":
      return state == 2 ? 0 : state;
    case "SET":
      return action.netqueryPin ?? state;
    // case "NETQUERY_CLOSE":
    // return 0;
    default:
      return state;
  }
}

function netqueryQ(state = "", action) {
  switch (action.type) {
    case "NETQUERY":
      return action.q;
    default:
      return state;
  }
}
function netqueryStatus(state = 0, action) {
  switch (action.type) {
    case "SEARCH_START":
    case "NETQUERY_CHANGE_SOURCE":
      return state >= 3 ? 0 : state;
    case "NETQUERY":
      return 1;
    case "NETQUERY_RESULT":
      return 2;
    case "NETQUERY_CLOSE":
      return 0; // closed (hidden)
    case "NETQUERY_SHOW":
      return 2;
    case "NETQUERY_FAILED":
      return 4;
    default:
      return state;
  }
}

function netqueryResult(state = {}, action) {
  let newState;
  switch (action.type) {
    case "NETQUERY":
      if (action.resetflag) return {};
      newState = Object.assign({}, state);
      delete newState[action.index];
      return newState;
    case "NETQUERY_RESULT":
      newState = Object.assign({}, state);
      newState[action.index] = action.result;
      return newState;
    default:
      return state;
  }
}

function netqueryError(state = null, action) {
  switch (action.type) {
    case "NETQUERY":
    case "NETQUERY_CHANGE_SOURCE":
      return null;
    case "NETQUERY_FAILED":
      return action.error;
    default:
      return state;
  }
}

function netquerySourceIndex(state = 0, action) {
  switch (action.type) {
    case "NETQUERY_CHANGE_SOURCE":
      return action.index;
    default:
      return state;
  }
}

function page(state = null, action) {
  switch (action.type) {
    case "GO_HOME":
    case "SEARCH_USER_INITIATE":
      return null;
    case "POPSTATE":
    case "DIRECT_REQUEST":
      return action.params.page != null ? parseInt(action.params.page) : null;
    default:
      return state;
  }
}

function offset(state = null, action) {
  switch (action.type) {
    case "GO_HOME":
    case "SEARCH_USER_INITIATE":
      return null;
    case "POPSTATE":
    case "DIRECT_REQUEST":
      return action.params.offset != null
        ? parseInt(action.params.offset)
        : null;
    default:
      return state;
  }
}

function romaji(state = 1, action) {
  switch (action.type) {
    case "SET":
      return action.romaji ?? state;
    case "GO_HOME":
    case "SET_ROMAJI":
      return action.romaji;
    case "POPSTATE":
    case "DIRECT_REQUEST":
      return action.params.romaji != null
        ? parseInt(action.params.romaji)
        : state;
    default:
      return state;
  }
}

function searchActualQ(state = "", action) {
  switch (action.type) {
    case "SEARCH_START":
      return action.params.actualQ || "";
    case "GO_HOME":
    case "CLEAR":
      return "";
    default:
      return state;
  }
}

function searchQ(state = "", action) {
  // console.log("searchQ action ", action)
  switch (action.type) {
    case "SEARCH_START":
    case "DIRECT_REQUEST":
      return action.params.q || "";
    case "GO_HOME":
    case "CLEAR":
      return "";
    default:
      return state;
  }
}

function searchRomaji(state = 0, action) {
  switch (action.type) {
    case "SET":
      return action.searchRomaji ?? state;
    case "SEARCH_START":
    case "DIRECT_REQUEST":
      return action.params.romaji != null
        ? parseInt(action.params.romaji)
        : state;
    case "GO_HOME":
    case "CLEAR":
      return action.romaji;
    default:
      return state;
  }
}

function searchType(state = 0, action) {
  switch (action.type) {
    case "SET":
      return action.searchType ?? state;
    case "SEARCH_START":
    case "DIRECT_REQUEST":
      return action.params.type != null ? parseInt(action.params.type) : state;
    case "GO_HOME":
      return action.searchType;
    default:
      return state;
  }
}

function searchDict(state = "", action) {
  switch (action.type) {
    case "SET":
      return action.searchDict ?? state;
    case "SEARCH_START":
      return action.params.dict ? action.params.dict : state;
    case "HOME_SELECT_DICT":
    case "GO_HOME":
    case "CLEAR":
      return action.dict;
    // case "POPSTATE":
    // case "DIRECT_REQUEST":
    //   return action.params.dict ? action.params.dict : state;
    default:
      return state;
  }
}

function searching(state = false, action) {
  switch (action.type) {
    case "SEARCH_START":
      return true;
    case "SEARCH_RESULT":
    case "SEARCH_ERROR":
    case "GO_HOME":
    case "CLEAR":
      return false;
    default:
      return state;
  }
}

function error(state = null, action) {
  switch (action.type) {
    case "SEARCH_START":
    case "GO_HOME":
    case "CLEAR":
      return null;
    case "SEARCH_ERROR":
      return action.error;
    default:
      return state;
  }
}

function hash(state = "", action) {
  switch (action.type) {
    case "CLEAR_HASH":
      return "";
    case "POPSTATE":
    case "DIRECT_REQUEST":
      return action.hash ?? "";
    default:
      return state;
  }
}

function type(state = 0, action) {
  switch (action.type) {
    case "SET":
      return action.searchType ?? state;
    case "SET_SEARCH_TYPE":
    case "GO_HOME":
      return action.searchType;
    case "POPSTATE":
    case "DIRECT_REQUEST":
      return action.params.type != null ? parseInt(action.params.type) : state;
    default:
      return state;
  }
}

function dict(state = "", action) {
  switch (action.type) {
    case "SET":
      return action.dict ?? state;
    case "SELECT_DICT":
    case "GO_HOME":
      return action.dict;
    case "POPSTATE":
    case "DIRECT_REQUEST":
      return action.params.dict ? action.params.dict : state;
    default:
      return state;
  }
}

function dicts(state = [], action) {
  switch (action.type) {
    default:
      return state;
  }
}

function loadingMore(state = false, action) {
  switch (action.type) {
    case "LOAD_MORE":
      return true;
    case "LOAD_MORE_RESULT":
    case "LOAD_MORE_ERROR":
      return false;
    default:
      return state;
  }
}

function nextPageMarker(state = "", action) {
  switch (action.type) {
    case "SET":
      return action.nextPageMarker ?? state;
    case "SEARCH_START":
    case "GO_HOME":
    case "CLEAR":
      return "";
    case "SEARCH_RESULT":
    case "LOAD_MORE_RESULT":
      return Array.isArray(action.result) ? "" : action.result.nextPageMarker;
    default:
      return state;
  }
}

function words(state = [], action) {
  let values;
  switch (action.type) {
    case "SET":
      return action.words ?? state;
    case "SEARCH_START":
    case "GO_HOME":
    case "CLEAR":
      return state.length > 0 ? [] : state;
    case "SEARCH_RESULT":
      return Array.isArray(action.result) ? action.result : action.result.words;
    case "LOAD_MORE_RESULT":
      return !Array.isArray(state[0])
        ? _concate_words(
            state,
            Array.isArray(action.result) ? action.result : action.result.words
          )
        : state.map((words, i) =>
            _concate_words(words, action.result.words[i])
          );
    case "FURIGANA_SHOW":
      return !action.lp
        ? _update_multi_word(state, action.dictIndex, action.word, {
            furiganaStatus: 2,
          })
        : state;
    case "FURIGANA_HIDE":
      return !action.lp
        ? _update_multi_word(state, action.dictIndex, action.word, {
            furiganaStatus: 3,
          })
        : state;
    case "FURIGANA_REQUEST":
      return !action.lp
        ? _update_multi_word(state, action.dictIndex, action.word, {
            furiganaStatus: 1,
          })
        : state;
    case "FURIGANA_REQUEST_RESULT":
      return !action.lp
        ? _update_multi_word(state, action.dictIndex, action.word, {
            furiganaText: action.furiganaText,
            furiganaStatus: 2,
          })
        : state;
    case "FURIGANA_REQUEST_FAILED":
      return !action.lp
        ? _update_multi_word(state, action.dictIndex, action.word, {
            furiganaStatus: 0,
          })
        : state;
    default:
      return state;
  }
}

function _concate_words(words, newWords) {
  newWords = newWords || [];
  return words.concat(
    newWords.filter(
      (word) =>
        !words.find((s) => s.page == word.page && s.offset == word.offset)
    )
  );
}

function _update_multi_word(words, dictIndex, index, values) {
  if (dictIndex == null) return updateArrElement(words, index, values);
  return updateArrElement(
    words,
    words[dictIndex],
    updateArrElement(words[dictIndex], index, values)
  );
}

function playingSoundWordTitle(state = "", action) {
  switch (action.type) {
    case "SEARCH_START":
    case "GO_HOME":
    case "CLEAR":
      return "";
    case "PLAY_SOUND":
      return action.wordTitle;
    default:
      return state;
  }
}

function playingSoundWordId(state = "", action) {
  switch (action.type) {
    case "SEARCH_START":
    case "GO_HOME":
    case "CLEAR":
      return "";
    case "PLAY_SOUND":
      return action.wordId;
    default:
      return state;
  }
}

function playing(state = 0, action) {
  switch (action.type) {
    case "SEARCH_START":
    case "GO_HOME":
    case "CLEAR":
      return 0;
    case "PLAY_SOUND_START":
      return 1;
    case "PLAY_SOUND_END":
      return 0;
    default:
      return state;
  }
}

function q(state = "", action) {
  switch (action.type) {
    case "CHANGE_Q":
      return action.value || "";
    case "GO_HOME":
      return "";
    case "POPSTATE":
    case "DIRECT_REQUEST":
      return action.params.q || state;
    default:
      return state;
  }
}
