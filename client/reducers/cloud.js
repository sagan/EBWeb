const { combineReducers } = require("redux");
const { updateArrayState } = require("../functions.js");

const rootReducer = combineReducers({
  syncStatus,
  syncError,
  page
});

function syncStatus(state = 0, action) {
  switch (action.type) {
    case "CLOUD_SYNC":
      return 1;
    case "CLOUD_SYNC_FINISH":
    case "CLOUD_SYNC_ERROR":
    case "GOOGLE_SIGNOUT":
      return 0;
    default:
      return state;
  }
}

function syncError(state = null, action) {
  switch (action.type) {
    case "CLOUD_SYNC":
    case "CLOUD_SYNC_FINISH":
    case "GOOGLE_SIGNOUT":
      return null;
    case "CLOUD_SYNC_ERROR":
      return action.error;
    default:
      return state;
  }
}

function page(state = "", action) {
  switch (action.type) {
    case "CLOUD_PAGE":
      return action.page || "";
    case "POPSTATE":
    case "DIRECT_REQUEST":
      return action.params.local == "cloud" ? "" : state;
    default:
      return state;
  }
}

module.exports = rootReducer;
