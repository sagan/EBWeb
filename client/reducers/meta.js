const { combineReducers } = require("redux");
const { updateArrayState } = require("../functions.js");

const rootReducer = combineReducers({
  data,
  time
});

function time(state = null, action) {
  switch (action.type) {
    case "FETCH_META":
      return +new Date();
    default:
      return state;
  }
}

function data(state = [], action) {
  switch (action.type) {
    case "FETCH_META":
      return action.metadata || [];
    case "NOTEBOOK_PUT":
    case "NOTEBOOK_DELETE":
      return updateArrayState(state, action.updateMetas, null, "key");
    default:
      return state;
  }
}

module.exports = rootReducer;
