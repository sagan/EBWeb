const { combineReducers } = require("redux");

const NUM = 4;

const rootReducer = combineReducers({
  status,
  abortController,
  results,
  errors,
  q,
});

/*
0: close; 1: show; 2: requesting
*/
function status(state = 0, action) {
  switch (action.type) {
    case "PARSER_SHOW":
      return state == 0 ? 1 : state;
    case "PARSER_CLOSE":
      return 0;
    case "PARSER_EXECUTE":
      return 2;
    case "PARSER_EXECUTE_RESULT":
    case "PARSER_EXECUTE_ERROR":
      return 1;
    default:
      return state;
  }
}

function q(state = "", action) {
  switch (action.type) {
    case "PARSER_Q":
      return action.q;
    case "PARSER_CLEAR":
      return "";
    default:
      return state;
  }
}

function abortController(state = null, action) {
  switch (action.type) {
    case "PARSER_EXECUTE":
      return action.abortController;
    case "PARSER_CLOSE":
      return null;
    default:
      return state;
  }
}

function results(state = Array(NUM), action) {
  switch (action.type) {
    case "PARSER_EXECUTE":
      return updateArray(state, action.parserTab, null);
    case "PARSER_CLEAR":
      return action.all ? Array(NUM) : state;
    case "PARSER_EXECUTE_RESULT":
      return updateArray(state, action.parserTab, action.result);
    case "PARSER_LPMODE_DISABLE":
      if (state[0]) {
        state = updateArray(
          state,
          0,
          state[0].replace(/data-lp="1"/g, 'data-nolp="1"')
        );
      }
      return state;
    case "PARSER_LPMODE_ENABLE":
      if (state[0]) {
        state = updateArray(
          state,
          0,
          state[0].replace(/data-nolp="1"/g, 'data-lp="1"')
        );
      }
      return state;
    default:
      return state;
  }
}

function errors(state = Array(NUM), action) {
  switch (action.type) {
    case "PARSER_EXECUTE":
    case "PARSER_EXECUTE_RESULT":
      return updateArray(state, action.parserTab, null);
    case "PARSER_CLEAR":
      return Array(NUM);
    case "PARSER_EXECUTE_ERROR":
      return updateArray(state, action.parserTab, action.error);
    default:
      return state;
  }
}

module.exports = rootReducer;

function updateArray(array, index, element) {
  array = array.slice();
  array.splice(index, 1, element);
  return array;
}
