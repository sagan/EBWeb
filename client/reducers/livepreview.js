const { updateArrElement } = require("./common");
const { combineReducers } = require("redux");

const rootReducer = combineReducers({
  status,
  result,
  loadAbortController,
  outTimeout,
  hoverTimeout,
  hoverEl,
  el,
  meta,
  params,
});

function meta(state = {}, action) {
  switch (action.type) {
    case "LIVEPREVIEW_LOAD":
      return action.meta;
    case "LIVEPREVIEW_CANCEL":
      return {};
    default:
      return state;
  }
}

function result(state = [], action) {
  switch (action.type) {
    case "GO_HOME":
    case "NOTEBOOK_EDIT":
    case "SEARCH_START":
    case "LIVEPREVIEW_LOAD":
    case "LIVEPREVIEW_CANCEL":
      return [];
    case "LIVEPREVIEW_RESULT":
    case "LIVEPREVIEW_RESULT_WAIT_DISPLAY":
      let words = Array.isArray(action.result)
        ? action.result
        : action.result.words;
      if (Array.isArray(words[0])) {
        // multi dict search result
        words = words.reduce((arr, words) => arr.concat(words), []);
      }
      return words;
    case "FURIGANA_REQUEST":
      return action.lp
        ? updateArrElement(state, action.dictIndex, {
            furiganaStatus: 1,
          })
        : state;
    case "FURIGANA_REQUEST_RESULT":
      return action.lp
        ? updateArrElement(state, action.dictIndex, {
            furiganaText: action.furiganaText,
            furiganaStatus: 2,
          })
        : state;
    case "FURIGANA_REQUEST_FAILED":
      return action.lp
        ? updateArrElement(state, action.dictIndex, {
            furiganaStatus: 0,
          })
        : state;
    case "FURIGANA_SHOW":
      return action.lp
        ? updateArrElement(state, action.dictIndex, {
            furiganaStatus: 2,
          })
        : state;
    case "FURIGANA_HIDE":
      return action.lp
        ? updateArrElement(state, action.dictIndex, {
            furiganaStatus: 3,
          })
        : state;
    default:
      return state;
  }
}

function loadAbortController(state = null, action) {
  switch (action.type) {
    case "LIVEPREVIEW_LOAD":
      return action.loadAbortController;
    case "LIVEPREVIEW_CANCEL":
    case "SEARCH_START":
    case "GO_HOME":
    case "NOTEBOOK_EDIT":
      return null;
    default:
      return state;
  }
}

function hoverEl(state = null, action) {
  switch (action.type) {
    case "LIVEPREVIEW_HOVER":
      return action.hoverEl;
    case "LIVEPREVIEW_LOAD":
    case "SEARCH_START":
    case "GO_HOME":
    case "NOTEBOOK_EDIT":
    case "LIVEPREVIEW_CANCEL":
    case "LIVEPREVIEW_REENTER":
      return null;
    default:
      return state;
  }
}

function hoverTimeout(state = null, action) {
  switch (action.type) {
    case "LIVEPREVIEW_HOVER":
      return action.hoverTimeout;
    case "LIVEPREVIEW_LOAD":
    case "SEARCH_START":
    case "GO_HOME":
    case "NOTEBOOK_EDIT":
    case "LIVEPREVIEW_CANCEL":
    case "LIVEPREVIEW_REENTER":
      return null;
    default:
      return state;
  }
}

function outTimeout(state = null, action) {
  switch (action.type) {
    case "LIVEPREVIEW_OUT":
      return action.outTimeout;
    case "SEARCH_START":
    case "GO_HOME":
    case "NOTEBOOK_EDIT":
    case "LIVEPREVIEW_CANCEL":
    case "LIVEPREVIEW_REENTER":
      return null;
    default:
      return state;
  }
}

// 0 initial
// 1 pending (loading )
// 2 displaying
// 3 special: result fetched, but user move outed the mouse (wait to cancel)
// 4 user closed this word's popup (Esc or close button)
function status(state = 0, action) {
  switch (action.type) {
    case "LIVEPREVIEW_CLOSE":
      return 4;
    case "LIVEPREVIEW_RESULT_WAIT_DISPLAY":
      return 3;
    case "LIVEPREVIEW_RESULT":
    case "LIVEPREVIEW_RESULT_DISPLAY":
      return 2;
    case "LIVEPREVIEW_LOAD":
      return 1;
    case "LIVEPREVIEW_CANCEL":
    case "SEARCH_START":
    case "GO_HOME":
    case "NOTEBOOK_EDIT":
      return 0;
    default:
      return state;
  }
}

function el(state = null, action) {
  switch (action.type) {
    case "LIVEPREVIEW_LOAD":
      return action.info.el;
    case "LIVEPREVIEW_CANCEL":
    case "SEARCH_START":
    case "GO_HOME":
    case "NOTEBOOK_EDIT":
      return null;
    default:
      return state;
  }
}
function params(state = {}, action) {
  switch (action.type) {
    case "LIVEPREVIEW_LOAD":
      return action.info.params;
    case "LIVEPREVIEW_CANCEL":
    case "SEARCH_START":
    case "GO_HOME":
    case "NOTEBOOK_EDIT":
      return {};
    default:
      return state;
  }
}

module.exports = rootReducer;
