const { combineReducers } = require("redux");

const rootReducer = combineReducers({
  records,
  queryLoading,
  queryType,
  q,
  queryQ,
  currentPageMarker,
  nextPageMarker,
  prevPageMarkers,
});

function queryLoading(state = false, action) {
  switch (action.type) {
    case "HISTORY_QUERY":
      return true;
    case "HISTORY_QUERY_RESULT":
      return false;
    case "HISTORY_QUERY_ERROR":
      return false;
    default:
      return state;
  }
}

function records(state = [], action) {
  switch (action.type) {
    case "HISTORY_CLEAR":
      return [];
    case "HISTORY_QUERY":
      return action.clear ? [] : state;
    case "HISTORY_QUERY_RESULT":
      return action.records || [];
    default:
      return state;
  }
}

function q(state = "", action) {
  switch (action.type) {
    case "HISTORY_Q":
      return action.q;
    case "HISTORY_QUERY":
      return !action.queryQ ? "" : state;
    default:
      return state;
  }
}

function queryQ(state = "", action) {
  switch (action.type) {
    case "HISTORY_QUERY":
      return action.queryQ ?? "";
    case "HISTORY_CLEAR":
      return "";
    default:
      return state;
  }
}

function queryType(state = "time", action) {
  switch (action.type) {
    case "HISTORY_QUERY":
      return action.queryType ?? "time";
    default:
      return state;
  }
}

function currentPageMarker(state = null, action) {
  switch (action.type) {
    case "HISTORY_QUERY_RESULT":
      return action.currentPageMarker || null;
    default:
      return state;
  }
}

function nextPageMarker(state = null, action) {
  switch (action.type) {
    case "HISTORY_QUERY_RESULT":
      return action.nextPageMarker || null;
    default:
      return state;
  }
}

function prevPageMarkers(state = [], action) {
  switch (action.type) {
    case "HISTORY_QUERY_RESULT":
      return action.prevPageMarkers || [];
    default:
      return state;
  }
}

module.exports = rootReducer;
