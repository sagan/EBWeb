import React from "react";
import SpeechRecognition from "react-speech-recognition";
import { toastr } from "react-redux-toastr";
import Modal from "react-modal";
import { Popover } from "react-tiny-popover";
import Autosuggest from "../../libs/react-autosuggest";
import {
  normalizeQ,
  getCanonicalUrlSearch,
  getQueryRomaji,
} from "../functions";
import {
  guessWordOriginal,
  REGEX_JAPANESE,
  REGEX_ENGLISH_FULL,
} from "../language_functions";
import { focusIfInVP, fixFocus, toggleFullScreen } from "../dom";
import AnalyzeResult from "./AnalyzeResult.jsx";
import NetqueryResultContainer from "../containers/NetqueryResultContainer.jsx";
import FooterContainer from "../containers/FooterContainer.jsx";
import HistoryPage from "../containers/HistoryPage.jsx";
import NotebookPage from "../containers/NotebookPage.jsx";
import CloudPage from "../containers/CloudPage.jsx";
import DictContent from "./DictContent.jsx";
import MultiDictsSelector from "./MultiDictsSelector.jsx";
import Draw from "./Draw.jsx";
import ParserContainer from "../containers/ParserContainer.jsx";
import Kanji from "./Kanji.jsx";
import UserConfigDialog from "./UserConfigDialog.jsx";
import UserConfigProfileSelector from "./UserConfigProfileSelector.jsx";
import { _c } from "../userConfig.js";
const process = require("process");

const QINPUT_SELECTOR = 'input[name="q"]';

let BROWSER = false;
if (process.browser) {
  BROWSER = true;
}

class Dict extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      handwriteShow: 0,
      lwmoreShow: 0,
      modal: 0,
      orientation: 0,
    };
    this.closeModal = this.closeModal.bind(this);
    this.toggleShowMore = this.toggleShowMore.bind(this);
    this.onSuggestionSelected = this.onSuggestionSelected.bind(this);
    this.onSuggestionHighlighted = this.onSuggestionHighlighted.bind(this);
    this.shouldRenderSuggestions = this.shouldRenderSuggestions.bind(this);
  }
  componentDidMount() {
    focusIfInVP(QINPUT_SELECTOR);
    if (this.props.browserSupportsSpeechRecognition)
      this.props.recognition.lang = "ja-JP";
  }
  componentDidUpdate(prevProps, prevState, snapshot) {
    if (
      !this.state.modal &&
      document.activeElement != document.querySelector(QINPUT_SELECTOR) &&
      this.props.local != "cloud" &&
      !document.querySelector(".ReactModal__Overlay")
    ) {
      fixFocus(QINPUT_SELECTOR, _c("fixFocus"));
    }
    if (this.props.listening) {
      let newScript = this.props.finalTranscript || this.props.transcript;
      let oldScript = prevProps.finalTranscript || prevProps.transcript;
      if (newScript != oldScript) {
        this.props.onChangeQ(newScript);
      }
    }
  }
  shouldRenderSuggestions(value) {
    return value.trim().length && this.props.qChanged;
  }
  onSuggestionSelected(
    event,
    { suggestion, suggestionValue, suggestionIndex, sectionIndex, method }
  ) {
    this.props.onChangeQ(suggestion);
    this.props.onSearch(null, { initiator: 1 });
  }
  onSuggestionHighlighted({ suggestion, method }) {
    if (method != "mouse") {
      this.props.onChangeQ(
        suggestion || this.props.suggestionsQ || this.props.q
      );
    }
  }
  render() {
    let msg = "",
      msg2 = "";
    let q = this.props.searchActualQ;
    let searchQ = normalizeQ(this.props.searchQ, !this.props.searchRomaji);
    let guesses = null;
    let showNetquery = 0;
    let showAnalyze = 0,
      analyzeWord;
    let showParser = 0;
    let showRomajiToggleSuggest = false;
    let { keyword, type } = this.props.info;
    let isSearchMulti = this.props.searchDict.match(/[+_]/);
    let isMulti = this.props.dict.match(/[+_]/);
    let isEmpty =
      this.props.words.length == 0 ||
      (Array.isArray(this.props.words[0]) &&
        this.props.words.every((words) => words.length == 0));

    let mainContent;
    if (!this.props.local) {
      if (this.props.furiganaEnable && this.props.analyzeStatus != 3) {
        if (
          this.props.analyzeStatus == 2 &&
          type &&
          (!q ||
            (analyzeWord = this.props.analyzeResult.find(
              (w) => w.baseform == q
            )) ||
            q == this.props.analyzeQ)
        ) {
          showAnalyze = 1;
        } else if (
          this.props.analyzeStatus == 1 ||
          (q && !this.props.searching && isEmpty && q.match(REGEX_JAPANESE))
        ) {
          showAnalyze = 2;
        }
        showParser = this.props.parserOpen;
      }
      if (this.props.netqueryStatus != 3) {
        if (
          this.props.netqueryStatus &&
          type &&
          (!q || q == this.props.netqueryQ)
        ) {
          showNetquery = 1;
        } else if (q && !this.props.searching && isEmpty) {
          showNetquery = 2;
        }
      }

      let searchDictText = this.props.searchDicts.join("+");
      let typeMsg = "????????????";
      if (this.props.searchType == 1) {
        typeMsg = "????????????";
      } else if (this.props.searchType == 2) {
        typeMsg = "?????????????????????";
      }
      if (this.props.searching) {
        if (q) {
          msg = (
            <>
              {searchDictText}???<strong>???{q}???</strong>
              {typeMsg}
              ?????????????????????????????????...
            </>
          );
        } else {
          msg = `${searchDictText}??????????????????????????????...`;
        }
      } else if (this.props.error) {
        msg = `????????????????????????????????????????????????????????????????????????????????????????????????Error: ${this.props.error.toString()}???`;
      } else if (isEmpty || (isSearchMulti && !q)) {
        if (q) {
          msg = (
            <>
              {searchDictText}???<strong>???{q}???</strong>
              {typeMsg}
              ??????????????????????????????????????????
            </>
          );
          if (showAnalyze != 1 || analyzeWord) {
            guesses = guessWordOriginal(q);
          }
          if (q != searchQ && this.props.searchQ.match(REGEX_ENGLISH_FULL)) {
            showRomajiToggleSuggest = true;
          }
        } else if (type) {
          if (this.props.searchDict) {
            msg = (
              <>
                <strong>{searchDictText}</strong>
                ??????????????????????????????????????????????????????
              </>
            );
          } else {
            msg = "?????????????????????????????????404 Not Found???";
          }
        } else {
          msg = (
            <>
              <span className="opt">
                ????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
                <br />
              </span>
              ???????????????????????????
              <strong>
                {isMulti ? this.props.currentDicts.join("+") : this.props.dict}
              </strong>
              ???
            </>
          );
        }
      } else if (this.props.words.length) {
        if (this.props.page != null) {
          if (this.props.offset != null) {
            msg2 = (
              <>
                {this.props.searchDict}
                &nbsp;
                <a
                  href={`${this.props.rootPath}${getCanonicalUrlSearch({
                    dict: this.props.searchDict,
                    page: this.props.page,
                  })}`}
                >
                  ????????? {this.props.page}
                </a>
                &nbsp;??????
                <strong>???{keyword}???</strong>
                ?????????
              </>
            );
          } else {
            msg2 = (
              <>
                {this.props.searchDict}&nbsp;
                <strong>????????? {this.props.page}</strong>???
              </>
            );
          }
        } else {
          let nextPageMarkerElement =
            !!this.props.nextPageMarker &&
            (this.props.loadingMore ? (
              <span>????????????????????????...</span>
            ) : (
              <a
                onClick={this.props.onLoadMore}
                className="needjs content-bottom-load-more"
              >
                ?????????????????????
              </a>
            ));
          if (isSearchMulti) {
            msg2 = q ? (
              <>
                {searchDictText}???<strong>???{q}???</strong>
                {typeMsg}
                ??????????????????
                {nextPageMarkerElement}
              </>
            ) : (
              <>{searchDictText}??????????????????</>
            );
          } else {
            msg2 = (
              <>
                {this.props.searchDict}???<strong>???{q}???</strong>
                {typeMsg}
                ??????????????? 1-
                {this.props.words.length}???{nextPageMarkerElement}
              </>
            );
          }
        }
      }
      mainContent = (
        <article
          id="main-article"
          className={`${
            isSearchMulti || _c("multiDictsAlwaysUse")
              ? "multi-dicts"
              : "single-dict"
          }`}
        >
          <script
            dangerouslySetInnerHTML={{
              __html: `<!--//--><![CDATA[//><!--
(function() {
  var userConfig = window.__USERCONFIG__;
  if( userConfig.multiDictsAlwaysUse ) {
    var mainArticle = document.querySelector("#main-article");
    mainArticle.classList.remove("single-dict");
    mainArticle.classList.add("multi-dicts");
  }
})()
//--><!]]>`,
            }}
          />
          {showParser == 1 ? (
            <div className="block" id="parser">
              <ParserContainer />
            </div>
          ) : (
            <div id="parser" />
          )}
          {this.props.drawStatus == 1 ? (
            <div className="block" id="draw">
              <Draw
                text={this.props.drawQ}
                set={this.props.set}
                drawSpeed={this.props.drawSpeed}
                rootPath={this.props.rootPath}
                kannjiDict={this.props.kannjiDict}
              />
            </div>
          ) : (
            <div id="draw" />
          )}
          {showNetquery == 1 ? (
            <div className="block" id="netquery">
              <NetqueryResultContainer />
              {showAnalyze != 1 && <div id="analyze" />}
            </div>
          ) : (
            <div id="netquery" />
          )}
          {showAnalyze == 1 ? (
            <div className="block" id="analyze">
              <p className="msg">
                <span>
                  ??????
                  <a
                    className="analyze-input"
                    href={`${this.props.rootPath}${getCanonicalUrlSearch({
                      dict: this.props.searchDict,
                      romaji: getQueryRomaji(
                        this.props.analyzeQ,
                        this.props.romaji
                      ),
                      type: 0,
                      q: this.props.analyzeQ,
                    })}`}
                  >
                    {this.props.analyzeQ}
                  </a>
                  ??????????????????????????????????????????
                </span>
                <span className="right">
                  <span
                    role="button"
                    accessKey="x"
                    className="last"
                    title="????????? [alt-shift-x]"
                    aria-label="?????????????????????????????????????????????"
                    onClick={this.props.closeAnalyze}
                  >
                    &times;
                  </span>
                </span>
              </p>
              <AnalyzeResult
                active={q}
                romaji={this.props.romaji}
                analyzeResult={this.props.analyzeResult}
                rootPath={this.props.rootPath}
                dict={this.props.searchDict}
                showMore={this.props.analyzeShowMore}
                toggleShowMore={this.toggleShowMore}
              />
            </div>
          ) : (
            showNetquery != 1 && <div id="analyze" />
          )}
          <div
            className={`block ${
              isSearchMulti || isMulti ? "mds-md" : "mds-sd"
            }`}
          >
            <MultiDictsSelector
              dict={this.props.dict}
              userConfig={this.props.userConfig}
              updateUserConfig={this.props.updateUserConfig}
              currentDicts={this.props.currentDicts}
              selectDict={this.props.selectDict}
              dicts={this.props.dicts}
              multiStyle={this.props.multiStyle}
              set={this.props.set}
              q={q}
              multiShortcuts={this.props.multiShortcuts}
              rootPath={this.props.rootPath}
            />
          </div>
          {showRomajiToggleSuggest && (
            <p className="msg">
              <a
                href={`${this.props.rootPath}${getCanonicalUrlSearch({
                  dict: this.props.searchDict,
                  type: this.props.searchType,
                  q: this.props.searchQ,
                })}${!this.props.searchRomaji ? "?romaji=1" : ""}`}
              >
                ??????
                {searchQ}
                ??????????????????(????????????????????????
                {this.props.searchRomaji ? "??????" : "??????"})
              </a>
            </p>
          )}
          {showNetquery == 2 && (
            <p className="msg needjs">
              <a
                role="button"
                title="[alt-shift-g]"
                accessKey="g"
                onClick={(e) => this.props.netquery(q)}
              >
                ??????
                {q}
                ??????????????????????????????????????????????????????
              </a>
            </p>
          )}
          {showAnalyze == 2 && (
            <p className="msg needjs">
              {this.props.analyzeStatus == 1 ? (
                <span role="button">
                  ??????
                  {this.props.analyzeQ}
                  ????????????????????????????????????...
                </span>
              ) : (
                <a
                  role="button"
                  title="[alt-shift-o]"
                  accessKey="o"
                  onClick={(e) => this.props.analyze(q)}
                >
                  ??????
                  {q}
                  ???????????????????????????????????????
                </a>
              )}
            </p>
          )}
          {msg ? <p className="msg">{msg}</p> : null}
          {Array.isArray(this.props.words[0]) ? (
            !!q ? (
              <div
                className={`dict-content multi multi-style-${this.props.multiStyle}`}
              >
                {this.props.words.map((words, i) => (
                  <DictContent
                    key={i}
                    {...this.props}
                    showTitle={true}
                    words={words}
                    wordIds={this.props.wordIds[i]}
                    searchDict={this.props.searchDicts[i]}
                  />
                ))}
              </div>
            ) : (
              <div className="dict-content" />
            )
          ) : (
            <div className="dict-content">
              <DictContent {...this.props} />
            </div>
          )}
          {msg2 ? <p className="msg">{msg2}</p> : null}
          {!!guesses && guesses.length > 0 && (
            <p className="guess-words">
              <span className="guess-words-label">???????????????: </span>
              {guesses.map((word) => (
                <span className="guess-words-word" key={word}>
                  <a
                    href={`${this.props.rootPath}${getCanonicalUrlSearch({
                      dict: this.props.searchDict,
                      romaji: getQueryRomaji(word, this.props.romaji),
                      type: 2,
                      q: word,
                    })}`}
                  >
                    {word}
                  </a>
                </span>
              ))}
            </p>
          )}
        </article>
      );
    } else {
      switch (this.props.local) {
        case "history":
          mainContent = <HistoryPage />;
          break;
        case "notebook":
          mainContent = <NotebookPage />;
          break;
        case "cloud":
          mainContent = <CloudPage />;
          break;
        default:
          mainContent = <p>{this.props.local}</p>;
          break;
      }
    }

    const searchTypeElement = (
      <div className="search-type">
        <select
          aria-label="???????????????"
          name="type"
          value={this.props.type}
          onChange={(e) => this.props.setSearchType(e.target.value)}
        >
          <option value={0}>????????????</option>
          <option value={1}>????????????</option>
          <option value={2}>????????????</option>
        </select>
      </div>
    );
    const romajiFieldElement = (
      <label
        role="button"
        className="romaji-field"
        title="????????????????????????????????????????????????"
      >
        <input
          type="checkbox"
          name="romaji"
          value="1"
          checked={this.props.romaji}
          onChange={() => this.props.setRomaji(!this.props.romaji)}
        />
        &nbsp;
        <span>??????????????????</span>
      </label>
    );
    const voiceInputBtnElement = (
      <button
        type="button"
        className={`voice-input-btn ${
          this.props.listening ? "active" : ""
        } needjs`}
        title={
          this.props.listening
            ? "???????????????...?????????????????????????????????????????????????????????"
            : "?????????????????????????????????????????????"
        }
        aria-label="?????????????????????????????????????????????"
        onClick={(e) => {
          if (!this.props.browserSupportsSpeechRecognition) {
            return toastr.error(
              "????????????????????????",
              "??????????????????????????????Chrome????????????(iOS????????????Chrome?????????)??????????????????????????????"
            );
          }
          if (this.props.listening) {
            this.props.stopListening();
          } else {
            this.props.resetTranscript();
            this.props.startListening();
          }
        }}
      >
        <span className="emoji">????</span>
      </button>
    );
    const configButton = (
      <button
        type="button"
        title="??????"
        className="config-btn needjs"
        onClick={(e) =>
          this.setState({ modal: 1, handwriteShow: 0, lwmoreShow: 0 })
        }
      >
        <span className="emoji">???</span>
      </button>
    );

    return (
      <div>
        <header>
          <form
            className="search-form"
            action={this.props.rootPath}
            onSubmit={(e) => {
              e.preventDefault();
              if (this.props.listening) {
                this.props.stopListening();
              }
              document.querySelector(QINPUT_SELECTOR).blur(); // make mobile device hide soft keyboard after submit
              this.props.onSearch(null, { initiator: 1 });
            }}
          >
            <div className="form-fields">
              <div className="search-input-wrapper">
                <Autosuggest
                  suggestions={this.props.suggestions}
                  onSuggestionsFetchRequested={this.props.suggestionsRequest}
                  onSuggestionsClearRequested={this.props.suggestionsClear}
                  getSuggestionValue={getSuggestionValue}
                  focusInputOnSuggestionClick={false}
                  renderSuggestion={renderSuggestion}
                  shouldRenderSuggestions={this.shouldRenderSuggestions}
                  onSuggestionSelected={this.onSuggestionSelected}
                  onSuggestionHighlighted={this.onSuggestionHighlighted}
                  inputProps={{
                    ["aria-label"]: "?????????????????????",
                    name: "q",
                    type: "search",
                    placeholder: "??????",
                    maxlength: 128,
                    accesskey: "f",
                    title: "?????? [alt-shift-f]",
                    size: 30,
                    value: this.props.q,
                    onChange: (e) => this.props.onChangeQ(e.target.value),
                    onBlur: (e) => this.props.set({ qChanged: false }),
                    onCompositionEnd: (e) => this.props.set({ qChanged: true }),
                  }}
                />
                <button
                  aria-label="?????????????????????"
                  type="submit"
                  className="search emoji mobile-last"
                >
                  ????
                </button>
                {voiceInputBtnElement}
                <Popover
                  positions={["bottom"]}
                  content={
                    <Kanji
                      width={230}
                      height={230}
                      onSelect={(kanji) => {
                        this.props.onChangeQ(this.props.q + kanji);
                      }}
                      onBackKey={() => {
                        if (this.props.q.length > 0) {
                          this.props.onChangeQ(this.props.q.slice(0, -1));
                        }
                      }}
                      onGoKey={this.props.onSearch}
                    />
                  }
                  isOpen={this.state.handwriteShow == 1}
                  onClickOutside={(e) => this.setState({ handwriteShow: 0 })}
                >
                  <button
                    type="button"
                    title="???????????????"
                    className="handwrite-btn needjs"
                    onClick={(e) =>
                      this.setState({
                        handwriteShow: this.state.handwriteShow == 0 ? 1 : 0,
                      })
                    }
                  >
                    <span className="emoji">???</span>
                  </button>
                </Popover>
                {configButton}
              </div>
              {searchTypeElement}
              {romajiFieldElement}
              <span className="feature-links">
                <UserConfigProfileSelector
                  setUserConfigProfile={this.props.setUserConfigProfile}
                  userConfigProfile={this.props.userConfigProfile}
                  userConfigProfiles={this.props.userConfigProfiles}
                />
                <Popover
                  positions={["bottom"]}
                  content={
                    <div className="lwmore-panel">
                      <p>
                        <label>??????????????????</label>
                        {searchTypeElement}
                      </p>
                      <p>{romajiFieldElement}</p>
                      <p>
                        {voiceInputBtnElement}
                        <Popover
                          positions={["bottom", "right"]}
                          content={
                            <Kanji
                              width={230}
                              height={230}
                              onSelect={(kanji) => {
                                this.props.onChangeQ(this.props.q + kanji);
                              }}
                              onBackKey={() => {
                                if (this.props.q.length > 0) {
                                  this.props.onChangeQ(
                                    this.props.q.slice(0, -1)
                                  );
                                }
                              }}
                              onGoKey={this.props.onSearch}
                            />
                          }
                          isOpen={this.state.handwriteShow == 2}
                          onClickOutside={(e) =>
                            this.setState({ handwriteShow: 0 })
                          }
                        >
                          <button
                            type="button"
                            title="???????????????"
                            className="handwrite-btn needjs"
                            onClick={(e) =>
                              this.setState({
                                handwriteShow:
                                  this.state.handwriteShow == 0 ? 2 : 0,
                              })
                            }
                          >
                            <span className="emoji">???</span>
                          </button>
                        </Popover>
                        {configButton}
                        <button
                          type="button"
                          title="?????????????????????????????????"
                          className="fullscreen-btn needjs"
                          onClick={() => {
                            if (!toggleFullScreen()) {
                              this.unlockOrientation();
                            }
                          }}
                        >
                          <span className="emoji">???</span>
                        </button>
                        <button
                          type="button"
                          title="???????????????????????????"
                          className="lock-orientation-btn needjs"
                          onClick={(e) => {
                            if (
                              !this.state.orientation ||
                              !document.fullscreenElement
                            ) {
                              this.lockOrientation();
                            } else {
                              this.unlockOrientation();
                            }
                          }}
                        >
                          <span className="emoji">????</span>
                        </button>
                      </p>
                    </div>
                  }
                  isOpen={!!this.state.lwmoreShow}
                  onClickOutside={(e) => {
                    if (this.state.handwriteShow != 2) {
                      this.setState({ lwmoreShow: 0 });
                    }
                  }}
                >
                  <a
                    className="lwmore-btn needjs"
                    onClick={(e) =>
                      this.setState({
                        lwmoreShow: +!this.state.lwmoreShow,
                      })
                    }
                  >
                    <span className="emoji icon" title="?????????????????????">
                      ??????
                    </span>
                  </a>
                </Popover>
                <a
                  className="history-link needjs"
                  accesskey="h"
                  title="???????????? [alt-shift-h]"
                  onClick={(e) => {
                    if (this.props.local == "history") {
                      this.props.onSearch(e);
                    }
                  }}
                  href={`${this.props.rootPath}history/`}
                >
                  <span
                    className={`emoji icon ${
                      this.props.local == "history" ? "active" : ""
                    }`}
                  >
                    ????
                  </span>
                </a>
                <a
                  className="notebook-link needjs"
                  accesskey="u"
                  title="????????? [alt-shift-u]"
                  onClick={(e) => {
                    if (this.props.local == "notebook") {
                      this.props.onSearch(e);
                    }
                  }}
                  href={`${this.props.rootPath}notebook/`}
                >
                  <span
                    className={`emoji icon ${
                      this.props.local == "notebook" ? "active" : ""
                    }`}
                  >
                    ????
                  </span>
                </a>
                <a
                  className="cloud-link needjs"
                  onClick={(e) => {
                    if (this.props.local == "cloud") {
                      this.props.onSearch(e);
                    }
                  }}
                  href={`${this.props.rootPath}cloud/`}
                >
                  <span
                    className={`last emoji icon ${
                      this.props.local == "cloud" ? "active" : ""
                    } ${this.props.synced ? "synced" : ""}`}
                    id="cloud-gravatar"
                  >
                    {this.props.googleUserInfo ? (
                      <img
                        crossorigin="anonymous"
                        width="27"
                        height="27"
                        src={this.props.googleUserInfo.picture}
                        title={`${this.props.googleUserInfo.name} ??????????????????${
                          this.props.synced ? " (??? ????????????)" : ""
                        }`}
                      />
                    ) : (
                      <span title="????????????(??????????????????)">??????</span>
                    )}
                  </span>
                  <script
                    dangerouslySetInnerHTML={{
                      __html: `<!--//--><![CDATA[//><!--
(function() {
  if( window.__GOOGLEUSERINFO__ ) {
    var name = window.__GOOGLEUSERINFO__.name;
    var picture = window.__GOOGLEUSERINFO__.picture;
    document.querySelector("#cloud-gravatar").innerHTML = '<img crossorigin="anonymous" width="27" height="27" src="'
      + picture
      + '" title="'
      + name
      + ' ??????????????????" />';
  }
})()
//--><!]]>`,
                    }}
                  />
                </a>
              </span>
            </div>
            <fieldset className="dicts" aria-label="?????????????????????">
              {this.props.dicts.map((dict) => (
                <div title={dict} className="dict" key={dict}>
                  <a
                    aria-label={`?????????${dict}??????????????????`}
                    aria-selected={dict == this.props.dict ? "true" : "false"}
                    data-nolp="1"
                    href={`${this.props.rootPath}${getCanonicalUrlSearch({
                      dict,
                      q,
                      type: this.props.searchType,
                      romaji: this.props.searchRomaji,
                    })}`}
                    className={dict == this.props.dict ? "active" : ""}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      this.props.selectDict(dict);
                    }}
                  >
                    {this.props.dictNames[dict]}
                  </a>
                </div>
              ))}
              <div title={`??????????????????????????????`} className="dict" key="_">
                <a
                  aria-label={`??????????????????????????????`}
                  aria-selected={isMulti}
                  href={`${this.props.rootPath}${getCanonicalUrlSearch({
                    dict: "_",
                    q,
                  })}`}
                  className={isMulti ? "active" : ""}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (!isMulti) {
                      this.props.selectDict("_");
                    }
                  }}
                >
                  ????????????
                </a>
              </div>
            </fieldset>
            <input type="hidden" name="dict" value={this.props.searchDict} />
          </form>
          <audio
            style={{ display: "none" }}
            id="soundplayer"
            ref={(sp) => {
              this.sp = sp;
            }}
            onPlay={this.props.playSoundStart}
            onEnded={this.props.playSoundEnd}
            onError={this.props.playSoundError}
          />
        </header>
        <div id="main-content">
          {mainContent}
          <FooterContainer className="pv" />
        </div>
        <Modal isOpen={!!this.state.modal} onRequestClose={this.closeModal}>
          {this.state.modal == 1 && (
            <UserConfigDialog
              setUserConfigProfile={this.props.setUserConfigProfile}
              createUserConfigProfile={this.props.createUserConfigProfile}
              removeUserConfigProfile={this.props.removeUserConfigProfile}
              userConfigImport={this.props.userConfigImport}
              userConfigExport={this.props.userConfigExport}
              notebookAnkiConnect={this.props.notebookAnkiConnect}
              notebookAnkiDisconnect={this.props.notebookAnkiDisconnect}
              notebookAnkiAutoSync={this.props.notebookAnkiAutoSync}
              notebookAnkiSync={this.props.notebookAnkiSync}
              updateUserConfig={this.props.updateUserConfig}
              ankiStatus={this.props.ankiStatus}
              lastAnkiSyncTime={this.props.lastAnkiSyncTime}
              close={this.closeModal}
              dicts={this.props.dicts}
              config={this.props.config}
              dict={this.props.dict}
              googleUserInfo={this.props.googleUserInfo}
              userConfig={this.props.userConfig}
              userConfigProfile={this.props.userConfigProfile}
              userConfigProfiles={this.props.userConfigProfiles}
              rootPath={this.props.rootPath}
            />
          )}
        </Modal>
      </div>
    );
  }

  closeModal() {
    this.setState({ modal: 0 });
  }

  toggleShowMore() {
    this.props.set({
      analyzeShowMore: +!this.props.analyzeShowMore,
    });
  }

  async lockOrientation() {
    try {
      await document.documentElement.requestFullscreen();
      await screen.orientation.lock("natural");
    } catch (e) {
      toastr.error("??????????????????????????????????????????", e.toString());
      return;
    }
    document.body.classList.add(
      "g-ol",
      screen.orientation.type.indexOf("landscape") != -1 ? "g-ol-l" : "g-ol-p"
    );
    this.setState({ orientation: 1 });
  }
  async unlockOrientation() {
    await screen.orientation.unlock();
    document.body.classList.remove("g-ol", "g-ol-l", "g-ol-p");
    this.setState({ orientation: 0 });
  }
}

export default SpeechRecognition({ autoStart: false, continuous: false })(Dict);

function getSuggestionValue(suggestion) {
  return suggestion;
}

function renderSuggestion(suggestion) {
  return <div>{suggestion}</div>;
}
