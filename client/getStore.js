const process = require("process");
const { createStore, applyMiddleware, compose } = require("redux");
const promiseMiddleware = require("redux-promise");
const ReduxThunk = require("redux-thunk").default;
const { persistStore, persistReducer } = require("redux-persist");
const localforage = require("localforage");
const appReducers = require("./reducers");
const { _c } = require("./userConfig.js");

const composeEnhancers =
  typeof window !== "undefined" && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({ trace: !!_c("debug") })
    : compose;

function getStore(preloadedState) {
  let { config } = preloadedState;
  localforage.config({
    name: `${config.SITEID}_localforage`,
  });
  let rootReducers = appReducers;
  if (process.browser) {
    rootReducers = persistReducer(
      {
        key: "state",
        whitelist: ["netqueryPin", "analyzeShowMore", "drawSpeed"],
        storage: localforage,
      },
      appReducers
    );
  }
  let store = createStore(
    rootReducers,
    preloadedState,
    composeEnhancers(applyMiddleware(promiseMiddleware, ReduxThunk))
  );
  let persistor = persistStore(store);
  return { store, persistor };
}

module.exports = getStore;
