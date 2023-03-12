import React from "react";
import Modal from "react-modal";
import MultiDictsSelectorEditorDialog from "./MultiDictsSelectorEditorDialog.jsx";
import { getCanonicalUrlSearch } from "../functions";
import { _c, _d } from "../userConfig.js";

const accessKeys = ["q", "w", "e"];

export default class MultiDictsSelector extends React.Component {
  constructor(props) {
    super(props);
    this.state = { modal: false };
    this.closeModal = this.closeModal.bind(this);
  }

  closeModal() {
    this.setState({ modal: false });
  }

  render() {
    let currentDicts = Array(3).fill("_");
    Object.assign(currentDicts, this.props.currentDicts);
    let multiDictsShortcuts = [];
    if (_d("multiDictsShortcuts")) {
      try {
        multiDictsShortcuts = JSON.parse(_d("multiDictsShortcuts"));
        if (!Array.isArray(multiDictsShortcuts)) {
          multiDictsShortcuts = [];
        }
      } catch (e) {}
    }

    return (
      <>
        <p className="msg mds-header">
          <span className="multi-dicts-selector-title">複数辞典一括検索</span>
          <span id="multi-dicts-selector-wrap" className="right">
            <a
              className="needjs icon"
              title="ショートカットを追加・編集"
              onClick={(e) => this.setState({ modal: true })}
            >
              <span>+</span>
            </a>
            <span id="multi-dicts-selector-custom">
              <script
                dangerouslySetInnerHTML={{
                  __html: `<!--//--><![CDATA[//><!--
(function() {
  var userConfig = window.__USERCONFIG__;
  var rootPath = window.__ROOTPATH__;
  if( userConfig.multiDictsShortcuts ) {
    var multiDictsShortcuts = [];
    var accessKeys = ${JSON.stringify(accessKeys)};
    try {
      multiDictsShortcuts = JSON.parse(userConfig.multiDictsShortcuts);
    } catch (e) {}
    if (!Array.isArray(multiDictsShortcuts)) {
      multiDictsShortcuts = [];
    }
    var wrap = document.querySelector("#multi-dicts-selector-custom");
    multiDictsShortcuts.forEach(function(shortcut, i) {
      var dictHtmlStr = encodeURIComponent(shortcut[1].join("_"));
      var active = location.pathname.indexOf("/" + dictHtmlStr + "/") != -1;
      var el = document.createElement("a");
      el.innerHTML = '<span>' + shortcut[0] + '</span>';
      el.setAttribute("class", "icon " + (active ? "active" : "not-active"));
      el.setAttribute("accesskey", accessKeys[i] || "");
      el.setAttribute("title", shortcut[2] +
        (accessKeys[i] ? "[alt-shift-" + accessKeys[i] + "]" : "")
      );
      el.setAttribute("role", "button");
      el.setAttribute("href", rootPath + dictHtmlStr + '/');
      wrap.appendChild(el);
    });
  }
})()
//--><!]]>`,
                }}
              />
              {multiDictsShortcuts.map((shortcut, i) => {
                let dict = shortcut[1].join("_");
                let accesskey = accessKeys[i] || "";
                return (
                  <a
                    className={`icon ${
                      dict == this.props.dict ? "active" : "not-active"
                    }`}
                    href={`${this.props.rootPath}${getCanonicalUrlSearch({
                      dict,
                    })}`}
                    accesskey={accesskey}
                    role="button"
                    onClick={(e) => {
                      if (shortcut[3] != null && shortcut[3] !== "") {
                        this.props.set({
                          searchType: shortcut[3],
                        });
                      }
                      if (shortcut[4] != null && shortcut[4] !== "") {
                        this.props.set({
                          romaji: shortcut[4],
                          searchRomaji: shortcut[4],
                        });
                      }
                      this.props.selectDict(dict, e);
                    }}
                    title={
                      shortcut[2] +
                      (accesskey ? `[alt-shift-${accesskey}]` : "")
                    }
                    key={i}
                  >
                    <span>{shortcut[0]}</span>
                  </a>
                );
              })}
            </span>
            <span
              id="multi-dicts-selector-default"
              className={_d("multiDictsShortcutsHideDefault") ? "none" : ""}
            >
              {this.props.multiShortcuts.map((shortcut, i) => (
                <a
                  className={`icon ${
                    shortcut[1] == this.props.dict ? "active" : "not-active"
                  }`}
                  href={`${this.props.rootPath}${getCanonicalUrlSearch({
                    dict: shortcut[1],
                    q: this.props.q,
                  })}`}
                  role="button"
                  onClick={(e) => this.props.selectDict(shortcut[1], e)}
                  title={shortcut[2] || ""}
                  key={shortcut[0]}
                >
                  <span>{shortcut[0]}</span>
                </a>
              ))}
            </span>
            <a
              title="複数の辞典の検索結果を横に並ぶ"
              role="button"
              className={`needjs icon ${
                this.props.multiStyle == 0 ? "active" : "not-active"
              }`}
              onClick={(e) => this.props.set({ multiStyle: 0 })}
            >
              <img
                class="inline"
                src={`${this.props.rootPath}icons/vertical.png`}
              />
            </a>
            <a
              title="複数の辞典の検索結果を縦に並ぶ"
              role="button"
              className={`last needjs icon ${
                this.props.multiStyle == 1 ? "active" : "not-active"
              }`}
              onClick={(e) => this.props.set({ multiStyle: 1 })}
            >
              <img
                class="inline"
                src={`${this.props.rootPath}icons/horizontal.png`}
              />
            </a>
          </span>
        </p>
        <div className="multi-dicts-selector">
          {currentDicts.map((dict, i) => (
            <div key={i}>
              <select
                value={currentDicts[i] || "_"}
                onChange={(e) => {
                  currentDicts[i] = e.target.value;
                  currentDicts = currentDicts
                    .filter((d) => d != "_")
                    .filter((v, i, a) => a.indexOf(v) === i);
                  if (currentDicts.length > 1) {
                    this.props.selectDict(currentDicts.join("_"));
                  } else if (currentDicts.length == 1) {
                    this.props.selectDict(
                      _d("multiDictsAlwaysUse")
                        ? currentDicts[0]
                        : currentDicts[0] + "_"
                    );
                  } else {
                    this.props.selectDict("__");
                  }
                }}
              >
                <option key="_" value="_">
                  - (非使用)
                </option>
                {this.props.dicts.map((dict) => (
                  <option key={dict} value={dict}>
                    {dict}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <Modal isOpen={!!this.state.modal} onRequestClose={this.closeModal}>
          <MultiDictsSelectorEditorDialog
            userConfig={this.props.userConfig}
            dict={this.props.dict}
            updateUserConfig={this.props.updateUserConfig}
            multiShortcuts={this.props.multiShortcuts}
            close={this.closeModal}
            dicts={this.props.dicts}
          />
        </Modal>
      </>
    );
  }
}
