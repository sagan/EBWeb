import React from "react";
import { Helmet } from "react-helmet";
import ReduxToastr from "react-redux-toastr";
import Modal from "react-modal";
import DictContainer from "../containers/DictContainer.jsx";
import HomeNaviContainer from "../containers/HomeNaviContainer.jsx";
import WordsNaviContainer from "../containers/WordsNaviContainer.jsx";
import HistorySidebarContainer from "../containers/HistorySidebarContainer.jsx";
import NotebookSidebarContainer from "../containers/NotebookSidebarContainer.jsx";
import CloudSidebarContainer from "../containers/CloudSidebarContainer.jsx";
import FooterContainer from "../containers/FooterContainer.jsx";
import { Popover, PopoverHeader, PopoverBody } from "reactstrap";
const process = require("process");
const queryString = require("query-string");

import NoteDialog from "./NoteDialog.jsx";
import AddNotebookIcon from "./AddNotebookIcon.jsx";
import PlaySoundIcon from "./PlaySoundIcon.jsx";
import FurigaraIcon from "./FurigaraIcon.jsx";
import { _c } from "../userConfig.js";

import {
  cancelEvent,
  checkEventModifierKey,
  ebtext2html,
  wordDictId,
  getCanonicalUrlSearch,
  getPageMeta,
  getQueryRomaji,
  parseSitePath,
  __get_state_css__,
} from "../functions";
import {
  getClickEventA,
  getLivepreviewEventInfo,
  gotoTop,
  gotoBottom,
} from "../dom";

let BROWSER = false;
if (process.browser) {
  BROWSER = true;
}

function clearIdleTimeout() {
  if (window._idleCallback) {
    clearTimeout(window._idleCallback);
    window._idleCallback = null;
  }
}

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.innerLinkHandle = this.innerLinkHandle.bind(this);
    this.innerLinkHoverHandle = this.innerLinkHoverHandle.bind(this);
    this.innerLinkMouseOutHandle = this.innerLinkMouseOutHandle.bind(this);
    this.innerLinkPointerUp = this.innerLinkPointerUp.bind(this);
    this.popoverMouseOutHandle = this.popoverMouseOutHandle.bind(this);
    this.dummy = this.dummy.bind(this);
    this.state = {
      idle: 1,
    };
  }
  dummy() {
    // for ios
  }
  componentDidMount() {
    window.__APP__ = this;
    window.addEventListener("popstate", (e) => {
      this.props.popstate(e.state, e);
    });
    let scrollCallback = (e) => {
      clearIdleTimeout();
      window._idleCallback = setTimeout(() => {
        this.setState({ idle: 1 });
        window._idleCallback = null;
      }, 2000);
      this.setState({ idle: 0 });
    };
    window.addEventListener("scroll", scrollCallback);
    document
      .querySelector("#main-content")
      .addEventListener("scroll", scrollCallback);
    window.addEventListener(
      "keydown",
      (e) => {
        // console.log("global key down", e.key, e.ctrlKey);
        switch (e.key) {
          case "Escape":
          case "Esc":
            this.props.livepreviewClose(e);
            break;
          default:
            break;
        }
        if (
          e.key == _c("livepreviewModifierKey") &&
          _c("livepreviewEnable") != 2 &&
          window.__latestMouseOverEvent
        ) {
          this.innerLinkHoverHandle(window.__latestMouseOverEvent, {
            force: true,
          });
        }
      },
      true
    );
    window.addEventListener("hashchange", cancelEvent);
    window.addEventListener("keyup", (e) => {
      // console.log("global key up", e.key, e.ctrlKey);
      if (e.key == _c("livepreviewModifierKey")) {
        if (window.__latestMouseOverEvent) {
          this.props.livepreviewClose();
        } else {
          this.props.livepreviewCancel();
        }
      }
    });
    if (window.speechSynthesis) {
      // workaround for Chrome bug that speechSynthesis.getVoices() return empty list first called
      window.speechSynthesis.onvoiceschanged = function () {
        // console.log(window.speechSynthesis.getVoices())
      };
    }
    if (location.hash) {
      setTimeout(() => {
        let el = document.getElementById(location.hash.slice(1));
        el && el.scrollIntoView();
      }, 100);
    }
  }
  popoverMouseOutHandle(e) {
    if (checkEventModifierKey(e, _c("livepreviewModifierKey"))) {
      return;
    }
    this.props.livepreviewPopoverMouseOut();
  }
  innerLinkMouseOutHandle(e) {
    window.__latestMouseOverEvent = null;
    // console.log("mouseout", e, _c("livepreviewModifierKey"));
    if (checkEventModifierKey(e, _c("livepreviewModifierKey"))) {
      return;
    }
    // do not TRUST e.target as the mouseout event is NOT reliable.
    // eg: for <span><ruby><rt>...</rt>...</ruby></span>
    // when move mouse out of "span",
    // there could NOT be a mouseout event triggered on span but only triggered on ruby on rt
    let livepreviewInfo = getLivepreviewEventInfo(e, {
      rootPath: this.props.config.ROOTPATH,
      userConfig: this.props.userConfig,
      dicts: this.props.dicts,
    });
    // this.props.log("-mouseout " + e.target.tagName);
    if (
      livepreviewInfo &&
      livepreviewInfo.el == this.props.livepreview.el &&
      this.props.livepreview.el.parentNode.querySelector(":hover") !=
        this.props.livepreview.el
    ) {
      this.props.livepreviewTriggerMouseOut();
    }
  }
  innerLinkHoverHandle(e, { force = false } = {}) {
    window.__latestMouseOverEvent = e;
    if (window.getSelection().toString() != "") {
      return;
    }
    let modifierKey = checkEventModifierKey(e, _c("livepreviewModifierKey"));
    if (
      !force &&
      (modifierKey
        ? this.props.livepreview.status == 2
        : _c("livepreviewModifierKeyType") == 1)
    ) {
      // console.log("mouseover: do not trigger");
      return;
    }
    let livepreviewInfo = getLivepreviewEventInfo(e, {
      rootPath: this.props.config.ROOTPATH,
      userConfig: this.props.userConfig,
      dicts: this.props.dicts,
    });
    // this.props.log("-mouseover " + e.target.tagName);
    // console.log("hover", livepreviewInfo);
    if (
      livepreviewInfo &&
      (livepreviewInfo.el.dataset.lpRmk != 1 || modifierKey || force) &&
      (_c("livepreviewEnable") <= 1 || livepreviewInfo.type <= 2)
    ) {
      this.props.livepreviewTriggerMouseOver(livepreviewInfo, {
        type: livepreviewInfo.type,
        text: livepreviewInfo.el.textContent,
        force,
      });
    }
  }
  innerLinkPointerUp(e) {
    if (e.pointerType == "mouse") {
      return;
    }
    let livepreviewInfo = getLivepreviewEventInfo(e, {
      rootPath: this.props.config.ROOTPATH,
      userConfig: this.props.userConfig,
      dicts: this.props.dicts,
    });
    // this.props.log("_pointerup " + (e.target.id || e.target.className));
    if (livepreviewInfo) {
      if (livepreviewInfo.type <= 2) {
        if (this.props.livepreview.el != livepreviewInfo.el) {
          this.props.livepreviewTriggerMouseOver(livepreviewInfo, {
            directPreviewLink: true,
            type: livepreviewInfo.type,
            text: livepreviewInfo.el.textContent,
          });
          livepreviewInfo.el.dataset.clickHandledFlag = "1";
          cancelEvent(e);
        } else {
          // ios safari do not trigger click after first tap
          delete livepreviewInfo.el.dataset.clickHandledFlag;
        }
      }
    } else if (this.props.livepreview.el) {
      // ios safari do not trigger mouseout for tap outside. So do it myself
      this.props.livepreviewTriggerMouseOut();
    }
  }
  innerLinkHandle(e) {
    let el = getClickEventA(e);
    // console.log("innerLinkHandle click", el);
    if (
      !el ||
      !el.href ||
      !el.getAttribute("href").startsWith(this.props.config.ROOTPATH) ||
      el.search.match(/\b(api|binary)=[a-zA-Z0-9_]/)
    ) {
      return;
    }
    if (el.dataset.clickHandledFlag) {
      cancelEvent(e);
      delete el.dataset.clickHandledFlag;
      return;
    }
    if (el.getAttribute("href") == this.props.config.ROOTPATH) {
      return this.props.goHome(e);
    }
    cancelEvent(e);

    let params = Object.assign(
      parseSitePath(el.pathname.slice(this.props.config.ROOTPATH.length)),
      queryString.parse(el.search)
    );
    if (params.romaji === undefined) {
      params.romaji = params.q
        ? getQueryRomaji(params.q, this.props.romaji)
        : this.props.romaji;
    }
    params.nid = el.dataset.nid || null;
    params.hid = el.dataset.hid || null;
    // console.log("inner link click", el, params);
    this.props.onDirectRequest(params);
  }
  render() {
    let {
      furiganaEnable,
      local,
      config,
      userConfig,
      dicts,
      words,
      info,
      livepreview,
      toggleFurigana,
      noteEditing,
      goHome,
    } = this.props;
    let { SITENAME, HOME_HTML, ROOTPATH } = config;
    let { type, prev, next, url } = info;
    let params = {
      local: this.props.local,
      q: this.props.searchActualQ,
      dict: this.props.searchDict,
      page: this.props.page,
      offset: this.props.offset,
    };
    let pageMeta = getPageMeta(config, dicts, params, words);
    let isHome = false;
    if (_c("sitename")) {
      pageMeta.title = pageMeta.title.replace(config.SITENAME, _c("sitename"));
    }
    let css = __get_state_css__(userConfig);
    let lpResult = [];
    if (livepreview.status == 2) {
      lpResult = livepreview.result.slice();
      lpResult.sort((a, b) => {
        let gaijiFlagA = a.heading.match(/\{\{(h|z)([a-f0-9]{4,})\}\}/i);
        let gaijiFlagB = b.heading.match(/\{\{(h|z)([a-f0-9]{4,})\}\}/i);
        if (gaijiFlagA && !gaijiFlagB) {
          return 1;
        }
        if (gaijiFlagB && !gaijiFlagA) {
          return -1;
        }
        if (livepreview.meta.wordReading) {
          let flagA =
            a.heading
              .replace(/[-‐・]/g, "")
              .indexOf(livepreview.meta.wordReading) != -1;
          let flagB =
            b.heading
              .replace(/[-‐・]/g, "")
              .indexOf(livepreview.meta.wordReading) != -1;
          if (flagA && !flagB) {
            return -1;
          }
          if (flagB && !flagA) {
            return 1;
          }
        }
        return 0;
      });
      lpResult.length = Math.min(lpResult.length, 4);
    }
    let sidebarContent;
    if (!local) {
      if (type) {
        sidebarContent = <WordsNaviContainer />;
      } else {
        isHome = true;
        sidebarContent = <HomeNaviContainer />;
      }
    } else {
      switch (local) {
        case "history":
          sidebarContent = <HistorySidebarContainer />;
          break;
        case "notebook":
          sidebarContent = <NotebookSidebarContainer />;
          break;
        case "cloud":
          sidebarContent = <CloudSidebarContainer />;
          break;
        default:
          sidebarContent = null;
          break;
      }
    }
    return (
      <div
        id="root"
        className={`g-lp-${livepreview.status} ${
          lpResult.length == 0 ? "g-lpe" : ""
        }`}
        onMouseUp={this.dummy}
        onClick={this.innerLinkHandle}
      >
        <div
          id="wrapper"
          onMouseOut={
            _c("livepreviewEnable") != 2 ? this.innerLinkMouseOutHandle : null
          }
          onPointerUp={
            _c("livepreviewEnable") != 2 ? this.innerLinkPointerUp : null
          }
          onMouseOver={
            _c("livepreviewEnable") != 2 ? this.innerLinkHoverHandle : null
          }
        >
          <Helmet>
            <title>{pageMeta.title}</title>
            <meta property="og:title" content={pageMeta.title} />
            <meta name="description" content={pageMeta.description} />
            <meta name="keywords" content={pageMeta.keywords} />
            <meta property="og:description" content={pageMeta.description} />
            <meta property="og:site_name" content={SITENAME} />
            <meta property="og:url" content={url} />
            <link rel="canonical" href={url} />
            <link
              rel="search"
              href={ROOTPATH + "opensearch.xml"}
              title={SITENAME}
              type="application/opensearchdescription+xml"
            />
            {!!prev && <link rel="prev" href={prev.href} />}
            {!!next && <link rel="next" href={next.href} />}
            {!!css && <style id="user-config-css">{css}</style>}
            <link
              rel="manifest"
              href={config.ROOTPATH + "assets/manifest.json"}
            />
            <body
              data-il-ucps={BROWSER ? "0" : "1"}
              data-il={BROWSER ? "0" : "1"}
              data-ih={isHome ? "1" : "0"}
              data-is={this.props.synced ? "1" : "0"}
              data-idle={`${this.state.idle}`}
            />
          </Helmet>
          <ReduxToastr
            timeOut={4000}
            newestOnTop={false}
            preventDuplicates
            position="top-right"
            transitionIn="fadeIn"
            transitionOut="fadeOut"
            progressBar
            closeOnToastrClick
          />
          <FooterContainer className="mv" />
          <aside>
            <h1 id="sitetitle">
              <a href={ROOTPATH} onClick={goHome}>
                <span>{_c("sitename") || SITENAME}</span>
              </a>
              <script
                dangerouslySetInnerHTML={{
                  __html: `<!--//--><![CDATA[//><!--
(function() {
  if( window.__USERCONFIG__.sitename ) {
    document.querySelector("#sitetitle a").textContent = window.__USERCONFIG__.sitename;
  }
})()
//--><!]]>`,
                }}
              />
            </h1>
            <div className="sidebar-content">{sidebarContent}</div>
          </aside>
          <main>
            <DictContainer />
          </main>
          <Modal
            isOpen={!!noteEditing}
            onRequestClose={this.props.notebookEditEnd}
          >
            {!!noteEditing && (
              <NoteDialog
                {...noteEditing}
                lp={!!_c("notebookLp")}
                ROOTPATH={ROOTPATH}
                error={this.props.noteEditError}
                notebookUpdate={this.props.notebookUpdate}
                notebookDelete={this.props.notebookDelete}
                notebookEditEnd={this.props.notebookEditEnd}
              />
            )}
          </Modal>
        </div>
        {((livepreview.status != 0 &&
          livepreview.status != 4 &&
          livepreview.meta.directPreviewLink) ||
          (livepreview.status == 2 && lpResult.length > 0)) && (
          <Popover
            placement="bottom"
            isOpen={true}
            target={livepreview.el}
            boundariesElement="window"
            toggle={(e) => {
              // empty
            }}
          >
            <div
              className="livepreview-wrapper"
              onMouseOver={this.props.livepreviewPopoverMouseOver}
              onMouseOut={this.popoverMouseOutHandle}
            >
              <div className="livepreview">
                {livepreview.status == 1 && <h3>読み込み中...</h3>}
                {lpResult.length ? (
                  <>
                    {lpResult.map((word, i) => {
                      let note = this.props.wordNotes.find(
                        (note) =>
                          note.dictid == `${word.dict}_${wordDictId(word)}`
                      );
                      return (
                        <div key={i} className="livepreview-word">
                          <h3 className="livepreview-word-title">
                            <a
                              className="livepreview-word-permalink"
                              title="この単語のリンク（パーマリンク）"
                              href={`${ROOTPATH}${getCanonicalUrlSearch(
                                Object.assign({}, livepreview.params, {
                                  dict: word.dict,
                                })
                              )}`}
                            >
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: ebtext2html(
                                    word.heading,
                                    ROOTPATH,
                                    word.dict
                                  ),
                                }}
                              />
                            </a>
                            <AddNotebookIcon
                              note={note}
                              word={word}
                              dict={word.dict}
                              notebookEdit={this.props.notebookEdit}
                              notebookPut={this.props.notebookPut}
                            />
                            <PlaySoundIcon
                              word={word}
                              dict={word.dict}
                              playSound={this.props.playSound}
                              playingSoundWordId={this.props.playingSoundWordId}
                              playing={this.props.playing}
                            />
                            {furiganaEnable ? (
                              <FurigaraIcon
                                userConfig={userConfig}
                                word={word}
                                dict={word.dict}
                                lp={1}
                                toggleFurigana={toggleFurigana}
                              />
                            ) : null}
                          </h3>
                          <div
                            className="livepreview-word-content"
                            dangerouslySetInnerHTML={{
                              __html: ebtext2html(
                                word.furiganaStatus == 2
                                  ? word.furiganaText
                                  : word.text,
                                ROOTPATH,
                                word.dict
                              ),
                            }}
                          />
                        </div>
                      );
                    })}
                  </>
                ) : livepreview.status == 1 ? (
                  <div className="livepreview-word-content">
                    「{livepreview.meta.text}」のプレビュー内容を読み込み中...。
                    {livepreview.meta.directPreviewLink &&
                      "再びリンクをタッチすると、メインウィンドウでロードします。"}
                  </div>
                ) : (
                  <div className="livepreview-word-content">
                    対応する内容が見つかりません。
                  </div>
                )}
              </div>
            </div>
          </Popover>
        )}
        <div id="sanavi">
          <img
            src={`${this.props.config.ROOTPATH}icons/arrow-circle-up.svg`}
            onClick={() => history.back()}
            role="button"
            title="Go Back"
            id="goback"
          />
          <img
            src={`${this.props.config.ROOTPATH}icons/arrow-circle-up.svg`}
            onClick={() => history.forward()}
            role="button"
            title="Go Forward"
            id="goforward"
          />
        </div>
        <img
          src={`${this.props.config.ROOTPATH}icons/arrow-circle-up.svg`}
          onClick={gotoTop}
          onMouseEnter={clearIdleTimeout}
          role="button"
          title="Go To Top"
          id="gototop"
        />
        <img
          src={`${this.props.config.ROOTPATH}icons/arrow-circle-up.svg`}
          onClick={gotoBottom}
          onMouseEnter={clearIdleTimeout}
          role="button"
          title="Go To Bottom"
          id="gotobottom"
        />
      </div>
    );
  }
}
