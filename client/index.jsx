import "./dummy_polyfill.jsx";
import "./autotrack.custom.js";
//import "./googleapi.js"; // local copy of https://apis.google.com/js/platform.js

import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import Modal from "react-modal";
import { PersistGate } from "redux-persist/integration/react";
import App from "./containers/AppContainer.jsx";
import getStore from "./getStore";
import { externalSearchSites } from "./components/ExternalSearchLinks.jsx";
import { netquery_sources, netquery_sourceFuncs } from "./netquery.js";
import * as actions from "./actions";
import db from "./db.js";

import "normalize.css";
import "nprogress/nprogress.css";
import "react-redux-toastr/lib/css/react-redux-toastr.min.css";
import "./asserts/style.scss";
import "../libs/dmak.min.js";

const queryString = require("query-string");
const popupTools = require("popup-tools");
const { parseSitePath, getQueryRomaji } = require("./functions");
const { defaultUserConfig, notSyncUserConfigKeys } = require("./userConfig");

Modal.defaultStyles.content.bottom = "auto";
Modal.defaultStyles.overlay.backgroundColor = "rgba(255, 248, 220, 0.9)"; // Cornsilk

const { store, persistor } = getStore(window.__PRELOADED_STATE__);
window.__PRELOADED_STATE__ = null;
window.__DB__ = db;
window.__STORE__ = store;
window.__ACTIONS__ = actions;
window.__DATA__ = {
  defaultUserConfig,
  externalSearchSites,
  netquery_sources,
  netquery_sourceFuncs,
  notSyncUserConfigKeys,
};

persistor.subscribe(async () => {
  const { bootstrapped } = persistor.getState();
  if (bootstrapped) {
    await store.dispatch(actions.init());
    ReactDOM.hydrate(
      <Provider store={store}>
        <App />
      </Provider>,
      document.getElementById("rr"),
      () => {
        if (location.search.match(/\b__nossr__\b/)) {
          let params = queryString.parse(location.search);
          let { ROOTPATH } = store.getState().config;
          if (location.pathname.startsWith(ROOTPATH)) {
            Object.assign(
              params,
              parseSitePath(location.pathname.slice(ROOTPATH.length))
            );
          }
          if (params.q && params.romaji == null) {
            params.romaji = getQueryRomaji(params.q, store.getState().romaji);
          }
          store.dispatch(actions.onDirectRequest(params, null, true));
        }
        if (!window.__NOCJ__ && !window.__USERCONFIG__.nocj) {
          setInterval(() => {
            store.dispatch(actions.cronjob());
          }, 30 * 1000);
        }
        if (typeof window._mod == "function") {
          window._mod();
        }
        window.__REACT_RENDERED__ = 1;
        document.body.dataset.ir = "1";
      }
    );
  }
});
