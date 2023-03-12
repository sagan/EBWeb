import React from "react";
import { Helmet } from "react-helmet";
import { Provider } from "react-redux";
const ReactDOMServer = require("react-dom/server");
import App from "./containers/AppContainer.jsx";
import AssetsHeader from "./AssetsHeader.jsx";
import getStore from "./getStore";
import {
  getCanonicalUrlSearch,
  __user_config_effect__,
  __get_state_css__,
} from "./functions";

let VERSION = __ROOTVERSION__;
let COMMIT_HASH = __COMMIT_HASH__;
export { App, getStore, VERSION, COMMIT_HASH };

export default class IndexComponent extends React.Component {
  render() {
    const { store, assets, script, manifest, config, preloadedState } =
      this.props;
    let AppHtml = ReactDOMServer.renderToString(
      <Provider store={store}>
        <App />
      </Provider>
    );
    const helmet = Helmet.renderStatic();
    const htmlAttrs = helmet.htmlAttributes.toComponent();
    const bodyAttrs = helmet.bodyAttributes.toComponent();
    return (
      <html lang="ja" prefix="og: http://ogp.me/ns#" {...htmlAttrs}>
        <head>
          <meta charSet="utf-8" />
          <script
            dangerouslySetInnerHTML={{
              __html: `<!--//--><![CDATA[//><!--
(function() {
  window.__USERCONFIG__ = {};
  window.__USERCONFIG_PROFILE__ = "default";
  window.__USERCONFIG_PROFILES__ = ["default"];
  window.__USERCONFIG_LOCAL__ = {};
  window.__ROOTPATH__ = "${config.ROOTPATH}";
  window.__SITEID__ = "${config.SITEID}";
  window.__GOOGLEUSERINFO__ = null;
  try {
    window.__USERCONFIG_PROFILES__ = JSON.parse(localStorage.getItem("${config.SITEID}_userConfigProfiles")) || ["default"];
  } catch(e) {}
  try {
    window.__USERCONFIG_PROFILE__ = localStorage.getItem("${config.SITEID}_userConfigProfile") || "default";
    window.__USERCONFIG__ = JSON.parse(localStorage.getItem(
        "${config.SITEID}_userConfig" +
        (window.__USERCONFIG_PROFILE__ != "default" ? "_" + window.__USERCONFIG_PROFILE__ : "")
      )) || {};
  } catch(e) {}
  try {
    window.__GOOGLEUSERINFO__ = JSON.parse(localStorage.getItem("${config.SITEID}_googleUserInfo")) || null;
  } catch(e) {}
})()
//--><!]]>`,
            }}
          />
          {!!config.GA && (
            <script
              dangerouslySetInnerHTML={{
                __html: `<!--//--><![CDATA[//><!--
(function() {
  var userConfig = window.__USERCONFIG__;
  if( !navigator.doNotTrack && !window.__DNT__ && !userConfig.dnt ) {
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${config.GA}');

    var gaScript = document.createElement("script");
    gaScript.async = true;
    gaScript.src = "https://www.googletagmanager.com/gtag/js?id=${config.GA}";
    document.head.appendChild(gaScript);
  }
})();
//--><!]]>`,
              }}
            />
          )}
          {helmet.title.toComponent()}
          <script
            dangerouslySetInnerHTML={{
              __html: `<!--//--><![CDATA[//><!--
(function() {
  var userConfig = window.__USERCONFIG__;
  if( userConfig.sitename ) {
    document.title = document.title.replace("${config.SITENAME}", userConfig.sitename);
  }
})();
//--><!]]>`,
            }}
          />
          <meta name="referrer" content="same-origin" />
          <link rel="stylesheet" type="text/css" href={assets["bundle.css"]} />
          <AssetsHeader assets={assets} manifest={manifest} />
          {helmet.meta.toComponent()}
          {helmet.link.toComponent()}
        </head>
        <body className="g-auto g-nojs" {...bodyAttrs}>
          <script
            dangerouslySetInnerHTML={{
              __html: `<!--//--><![CDATA[//><!--
(function() {
  var __get_state_css__ = ${__get_state_css__.toString()};
  var userConfig = window.__USERCONFIG__;
  try {
    var css = __get_state_css__(userConfig);
    if( css ) {
      var style=document.createElement('style');
      style.id = "user-config-css";
      style.dataset.reactHelmet = true;
      if(style.styleSheet) {
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css));
      }
      document.getElementsByTagName('head')[0].appendChild(style);
    }
    var js = userConfig.js;
    if( js ) {
      var s = document.createElement('script');
      s.type = 'text/javascript';
      try {
        s.appendChild(document.createTextNode(js));
        document.body.appendChild(s);
      } catch (e) {
        s.text = js;
        document.body.appendChild(s);
      }
    }
  } catch(e) {}
  if(!window.SpeechRecognition && !window.webkitSpeechRecognition && !window.mozSpeechRecognition && !window.msSpeechRecognition && !window.oSpeechRecognition) {
    document.body.classList.add("g-nosr");
  }
})()
//--><!]]>`,
            }}
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `<!--//--><![CDATA[//><!--
(function() {
  var __user_config_effect__ = ${__user_config_effect__.toString()};
  var userConfig = window.__USERCONFIG__;
  var userConfigLocal = window.__USERCONFIG_LOCAL__;
  try {
    var defaultDict = userConfigLocal.defaultDict || userConfig.defaultDict;
    if(defaultDict && location.hash == "#defaultDict") {
      try {
        history.replaceState({params: {dict: defaultDict}}, "",
          location.pathname + encodeURIComponent(defaultDict) + "/");
        window.__DICT__ = defaultDict;
      } catch(e) {}
    }
  } catch(e) {}
  __user_config_effect__(userConfig, userConfigLocal);
})();
//--><!]]>`,
            }}
          />
          <div id="rr" dangerouslySetInnerHTML={{ __html: AppHtml }} />
          <script
            dangerouslySetInnerHTML={{
              __html: `<!--//--><![CDATA[//><!--
(function() {
  var __PRELOADED_STATE__ = ${safeStringify(preloadedState)};
  if( window.__DICT__ ) {
    __PRELOADED_STATE__.dict = window.__DICT__;
  }
  window.__PRELOADED_STATE__ = __PRELOADED_STATE__;
  if ('serviceWorker' in navigator && location.hostname != 'localhost') {
    window.addEventListener('load', function() {
      if( !window.__NOSW__ && !window.__USERCONFIG__.nosw ) {
        navigator.serviceWorker.register('${
          config.ROOTPATH
        }service-worker.js', {scope: '${config.ROOTPATH}'});
        navigator.serviceWorker.ready.then(function(swRegistration) {
          window.__sw_registration__ = swRegistration;
          swRegistration.sync.register('cloudsync');
          return swRegistration.periodicSync.register('cloudsync', {
            minInterval: 300 * 1000
          });
        });
      } else {
        navigator.serviceWorker.getRegistration('${
          config.ROOTPATH
        }').then(function(registration) {
         registration && registration.unregister();
        });
      }
    });
  }
})();
//--><!]]>`,
            }}
          />
          <script async type="module" src={assets["bundle.js"]} />
          <script async noModule src={config.ROOTPATH + "bundle.legacy.js"} />
          {!!script && <script async src={script} />}
        </body>
      </html>
    );
  }
}

// A utility function to safely escape JSON for embedding in a <script> tag
function safeStringify(obj) {
  return JSON.stringify(obj)
    .replace(/<\/(script)/gi, "<\\/$1")
    .replace(/<!--/g, "<\\!--")
    .replace(/\u2028/g, "\\u2028") // Only necessary if interpreting as JS, which we do
    .replace(/\u2029/g, "\\u2029"); // Ditto
}
