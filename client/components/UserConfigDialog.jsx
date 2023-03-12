import React from "react";
import ReactTooltip from "react-tooltip";
import { toastr } from "react-redux-toastr";
import UserConfigProfiles from "./UserConfigProfiles.jsx";
import { fetchJson, cancelEvent, formatTime } from "../functions";
const { defaultUserConfig, _d, _u } = require("../userConfig");

export default class UserConfig extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      css: props.userConfig.css || "",
      js: props.userConfig.js || "",
      updatingSw: false,
      checking: false,
      latestVersion: "",
      latestCommitHash: "",
      latestConfigHash: "",
      swMsg: "",
    };
    if (window.__sw_registration__) {
      if (window.__sw_registration__.installing) {
        window.__sw_registration__.installing.addEventListener(
          "statechange",
          this.swStateChangeHandle
        );
      }
    }
  }
  async componentDidMount() {
    this.setState({ checking: true });
    try {
      let meta = await fetchJson(`${this.props.rootPath}?api=3&__nocache__`);
      this.setState({
        checking: false,
        latestVersion: meta.VERSION,
        latestCommitHash: meta.COMMIT_HASH,
        latestConfigHash: meta.CONFIG_HASH,
      });
    } catch (e) {
      this.setState({ checking: false });
    }
  }
  resetConfig = async (e) => {
    let { updateUserConfig } = this.props;
    if (!window.confirm(`すべての設定をリセットしようとする、確認しますか？`)) {
      return;
    }
    await updateUserConfig(null, { overwrite: true });
    toastr.info("設定リセットしました");
  };
  swStateChangeHandle = (e) => {
    switch (e.target.state) {
      case "installed":
        if (navigator.serviceWorker.controller) {
          toastr.success(
            "Service Workerの更新を完了しました",
            "ページをリロードするのをお勧めします"
          );
          this.setState({
            swMsg:
              "Service Workerの更新を完了しました。ページをリロードするのをお勧めします。",
          });
        }
        break;
    }
    this.forceUpdate();
  };
  componentWillUnmount() {
    if (window.__sw_registration__) {
      ["installing", "active", "waiting"].forEach((name) => {
        let worker = window.__sw_registration__[name];
        worker &&
          worker.removeEventListener("statechange", this.swStateChangeHandle);
      });
    }
  }
  handleChangeConfig = (e) => {
    let value = e.target.value;
    let type = 0; // 1 int; 2 delete (to initial)
    if (e.target.type == "checkbox") {
      value = +e.target.checked;
    } else if (e.target.type == "number" && e.target.value !== "") {
      type = 1;
    } else if (e.target.tagName == "SELECT" && typeof value == "string") {
      if (value === "__unset__") {
        type = 2;
      } else if (value.match(/^[0-9]+$/)) {
        type = 1;
      }
    }
    if (type == 2) {
      let userConfig = Object.assign({}, this.props.userConfig);
      delete userConfig[e.target.name];
      return this.props.updateUserConfig(userConfig, {
        overwrite: 1,
      });
    }
    if (type == 1) {
      value = parseInt(value) || 0;
    }
    this.props.updateUserConfig({ [e.target.name]: value });
  };
  render() {
    let {
      config,
      updateUserConfig,
      lastAnkiSyncTime,
      ankiStatus,
      notebookAnkiConnect,
      notebookAnkiDisconnect,
      notebookAnkiAutoSync,
      notebookAnkiSync,
      userConfigExport,
      userConfigImport,
      setUserConfigProfile,
      createUserConfigProfile,
      removeUserConfigProfile,
      close,
      dicts,
      dict,
      googleUserInfo,
      userConfig,
      userConfigProfile,
      userConfigProfiles,
    } = this.props;
    let { DATE, USERCONFIG_DOCUMENT_URL, JS_DOCUMENT_URL, $$hash } = config;

    let isLatest =
      !this.state.latestVersion ||
      (this.state.latestVersion == __ROOTVERSION__ &&
        this.state.latestCommitHash == __COMMIT_HASH__ &&
        this.state.latestConfigHash == $$hash);
    let sw_status = "not_installed";
    let __sw_registration__ = window.__sw_registration__;
    if (__sw_registration__) {
      let sw =
        __sw_registration__.installing ||
        __sw_registration__.waiting ||
        __sw_registration__.active;
      if (sw) {
        sw_status = sw.state;
      } else {
        sw_status = "not_active";
      }
    }

    return (
      <div className="user-config-dialog dialog">
        <h3>
          設定 (* 変更すると自動保存)
          <span className="right">
            {!!USERCONFIG_DOCUMENT_URL && (
              <a
                role="button"
                className="icon"
                href={USERCONFIG_DOCUMENT_URL}
                title="ヘルプ"
              >
                ?
              </a>
            )}
            <span
              role="button"
              className="last"
              onClick={close}
              aria-label="ダイアログを閉める"
            >
              &times;
            </span>
          </span>
        </h3>
        <p className="profiles">
          <span
            data-for="userconfig-dialog-profile-label-tooltip"
            data-tip="プロフィール"
          >
            プロフィール:&nbsp;
          </span>
          <ReactTooltip
            id="userconfig-dialog-profile-label-tooltip"
            effect="solid"
          />
          <UserConfigProfiles
            userConfigProfile={userConfigProfile}
            userConfigProfiles={userConfigProfiles}
            setUserConfigProfile={setUserConfigProfile}
          />
          <span className="right">
            <span
              role="button"
              onClick={async (e) => {
                if (userConfigProfile == "default") {
                  return alert(
                    "「default」プロフィールは削除操作に対応しません。"
                  );
                }
                if (
                  !confirm(
                    `現在のプロフィール「${userConfigProfile}」を削除しようとする、よろしいでしょうか？`
                  )
                ) {
                  return;
                }
                await removeUserConfigProfile(userConfigProfile);
              }}
              title={`現在のプロフィール「${userConfigProfile}」を削除する`}
            >
              &times;
            </span>
            <span
              role="button"
              className="last"
              onClick={async (e) => {
                let name = prompt("新規プロフィールの名前: ")?.trim();
                if (!name) {
                  return;
                }
                await createUserConfigProfile(name, userConfigProfile);
              }}
              title="新規プロフィール"
            >
              +
            </span>
          </span>
        </p>
        <form onSubmit={cancelEvent}>
          <p>
            <label>
              <span>サイトのタイトル: </span>
              <input
                name="sitename"
                type="text"
                placeholder={config.SITENAME}
                value={_d("sitename")}
                onChange={this.handleChangeConfig}
              />
            </label>
            <span>
              * ページの左上のサイトタイトルを自分好きなものに変更する。
            </span>
          </p>
          <p>
            <label>
              <span>初期辞典: </span>
              <select
                name="defaultDict"
                value={_d("defaultDict")}
                onChange={this.handleChangeConfig}
              >
                <option value="">システムデフォルト</option>
                {!!_d("defaultDict") &&
                  dicts.indexOf(_d("defaultDict")) == -1 && (
                    <option>{_d("defaultDict")}</option>
                  )}
                {dicts.map((dict) => (
                  <option key={dict}>{dict}</option>
                ))}
              </select>
            </label>
            <span>
              * ページの左上のサイトタイトルをクリックするとこの辞典を選択する。
            </span>
            <button
              type="button"
              onClick={(e) => updateUserConfig({ defaultDict: dict })}
            >
              只今使用している辞典にする
            </button>
          </p>
          <p>
            <label>
              <span>初期検索タイプ: </span>
              <select
                name="defaultType"
                value={_d("defaultType")}
                onChange={this.handleChangeConfig}
              >
                <option value="0">前方一致 (初期値)</option>
                <option value="1">後方一致</option>
                <option value="2">完全一致</option>
              </select>
            </label>
            <span>
              *
              ページの左上のサイトタイトルをクリックするとこの検索タイプに設定する。
            </span>
          </p>
          <p>
            <label>
              <span>初期ローマ字変換状態: </span>
              <select
                name="defaultRomaji"
                value={_d("defaultRomaji")}
                onChange={this.handleChangeConfig}
              >
                <option value="1">ON (ローマ字変換有効) (初期値)</option>
                <option value="0">OFF (ローマ字変換無効)</option>
              </select>
            </label>
            <span>
              *
              ページの左上のサイトタイトルをクリックするとこのローマ字変換状態に設定する。
            </span>
          </p>
          <p>
            <label>
              <span>検索キーワード入力欄のフォーカスを固定: </span>
              <select
                name="fixFocus"
                value={_d("fixFocus")}
                onChange={this.handleChangeConfig}
              >
                <option value="">自動 (PCモードだけで有効)</option>
                <option value="always">常に有効</option>
                <option value="none">無効</option>
              </select>
            </label>
            <span>
              * 有効すると、常に検索キーワード入力欄にフォーカスを維持する。
            </span>
          </p>
          <p>
            <label>
              <span>検索キーワード入力候補提供者: </span>
              <select
                name="suggestionsProvider"
                value={_d("suggestionsProvider")}
                onChange={this.handleChangeConfig}
              >
                <option value="wiktionary">Wiktionary (初期値)</option>
                <option value="google">Google</option>
              </select>
            </label>
            <span>* 検索キーワード予測候補の提供者。</span>
          </p>
          <p>
            <label>
              <span>検索キーワード入力候補数: </span>
              <select
                name="suggestionsLimit"
                value={_d("suggestionsLimit")}
                onChange={this.handleChangeConfig}
              >
                <option value="0">0 (予測候補機能無効)</option>
                <option value="1">1</option>
                <option value="2">2 (初期値)</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="8">8</option>
                <option value="9">9</option>
                <option value="10">10</option>
              </select>
            </label>
            <span>
              * 検索キーワード予測候補数。"0"は予測候補機能無効にする。
            </span>
          </p>
          <p>
            <label>
              <span>振り仮名を付ける機能: </span>
              <select
                name="furiganaMode"
                value={_d("furiganaMode")}
                onChange={this.handleChangeConfig}
              >
                <option value="0">
                  振り仮名を付け、日本語形態素を解析する (初期値)
                </option>
                <option value="1">振り仮名を付けるのみ</option>
                <option value="2">日本語形態素を解析するのみ</option>
              </select>
            </label>
            <span>* 辞典内容に振り仮名を付ける機能を設定。</span>
          </p>
          <p>
            <label>
              <span>ライブプレビュー: </span>
              <select
                name="livepreviewEnable"
                value={_d("livepreviewEnable")}
                onChange={this.handleChangeConfig}
              >
                <option value="0">有効 (初期値)</option>
                {_d("livepreviewEnable") == 1 && (
                  <option value="1">有効</option>
                )}
                <option value="2">無効</option>
                <option value="3">リンクのみ有効</option>
              </select>
            </label>
            <span>
              * ライブプレビュー機能とは単語のリンク、
              また辞典内容での単語形態素にカーソルを合わせる(スマホでの場合はタップする)と、
              その単語の辞典内容の要約が表示されます。
            </span>
          </p>
          <p>
            <label>
              <span>
                ライブプレビュートリガー修飾キー(PCモードのみで有効):&nbsp;
              </span>
              <select
                name="livepreviewModifierKey"
                value={_d("livepreviewModifierKey")}
                onChange={this.handleChangeConfig}
              >
                <option value="Shift">Shift (初期値)</option>
                <option value="Alt">Alt</option>
                <option value="Control">Control</option>
              </select>
            </label>
            <label title="ライブプレビュートリガー修飾キータイプ">
              <span>タイプ: </span>
              <select
                name="livepreviewModifierKeyType"
                value={_d("livepreviewModifierKeyType")}
                onChange={this.handleChangeConfig}
              >
                <option value="0">Optional (初期値)</option>
                <option value="1">Required</option>
              </select>
            </label>
            <span>
              * When type set to "required", the livepreview window will only
              apprear if holding the modifier key. Additionaly, hold the
              modifier key to prevent the livepreview window from disappearing
              automatically.
            </span>
          </p>
          <p>
            <label>
              <span>ライブプレビュー辞典: </span>
              <select
                name="livepreviewDict"
                value={_d("livepreviewDict")}
                onChange={this.handleChangeConfig}
              >
                <option value="">システムデフォルト</option>
                {!!_d("livepreviewDict") &&
                  dicts.indexOf(_d("livepreviewDict")) == -1 && (
                    <option>{_d("livepreviewDict")}</option>
                  )}
                {dicts.map((dict) => (
                  <option key={dict}>{dict}</option>
                ))}
              </select>
            </label>
            <span>* 単語形態素のライブプレビュー機能に使用する辞典。</span>
            <button
              type="button"
              onClick={(e) => updateUserConfig({ livepreviewDict: dict })}
            >
              只今使用している辞典にする
            </button>
          </p>
          <p>
            <label>
              <span>English 辞典: </span>
              <select
                name="defaultDictEN"
                value={_d("defaultDictEN")}
                onChange={this.handleChangeConfig}
              >
                <option value="">システムデフォルト</option>
                {_d("defaultDictEN") &&
                  dicts.indexOf(_d("defaultDictEN")) == -1 && (
                    <option>{_d("defaultDictEN")}</option>
                  )}
                {dicts.map((dict) => (
                  <option key={dict}>{dict}</option>
                ))}
              </select>
            </label>
            <span>
              *
              自分好みのEnglish辞典。一部の英語を検索する場合、この辞典を使用します。
            </span>
            <button
              type="button"
              onClick={(e) => updateUserConfig({ defaultDictEN: dict })}
            >
              只今使用している辞典にする
            </button>
          </p>
          <p>
            <label>
              <span>PCモードのレイアウトを使用: </span>
              <select
                name="forcePCMode"
                value={_d("forcePCMode")}
                onChange={this.handleChangeConfig}
              >
                <option value="0">自動 (初期値)</option>
                <option value="1">
                  常に強制的にPCモードのレイアウトを使用
                </option>
                <option value="2">
                  画面横向きの時のみ強制的にPCモードのレイアウトを使用
                </option>
                <option value="3">
                  常に強制的ににスマホモードのレイアウトを使用
                </option>
                <option value="4">
                  画面縦向きの時強制的にスマホモードのレイアウトを使用
                </option>
              </select>
            </label>
            {_d("forcePCMode") == 2 && (
              <label>
                (画面の幅 &gt;=
                <input
                  type="number"
                  name="forcePCMode2MinWidth"
                  title="最小幅値(px)"
                  placeholder="0"
                  onChange={this.handleChangeConfig}
                  value={
                    userConfig.forcePCMode2MinWidth !== ""
                      ? userConfig.forcePCMode2MinWidth || 0
                      : ""
                  }
                />
                pxの時のみ)
              </label>
            )}
            <span>
              * 当サイトはレスポンシブデザインを対応しています。
              初期設定の「自動」では、画面の幅(width)に応じてページのコンテンツを最適に表示されます。
            </span>
          </p>
          <p>
            <label>
              <span>PCモードのレイアウトに必要の画面幅の下限(px): </span>
              <input
                name="pcModeMinWidth"
                type="number"
                placeholder={defaultUserConfig.pcModeMinWidth}
                value={
                  userConfig.pcModeMinWidth !== ""
                    ? userConfig.pcModeMinWidth ||
                      defaultUserConfig.pcModeMinWidth
                    : ""
                }
                onChange={this.handleChangeConfig}
              />
            </label>
            <span>
              *
              画面幅がこの値を超えると、自動的にPCモードのレイアウトを使用します。
            </span>
          </p>
          <p>
            <label>
              <span>コンテンツ幅: </span>
              <select
                name="contentWidth"
                value={
                  typeof userConfig.contentWidth == "number" ||
                  userConfig.contentWidth === ""
                    ? defaultUserConfig.contentWidth
                    : userConfig.contentWidth || "__"
                }
                onChange={this.handleChangeConfig}
              >
                <option value="__">
                  デフォルト (最大幅を{defaultUserConfig.contentWidth}
                  pxに制限する)
                </option>
                <option value="full">全幅 (すべての空間を利用する)</option>
                <option value={defaultUserConfig.contentWidth}>
                  カスタマイズ幅
                </option>
              </select>
            </label>
            {(typeof userConfig.contentWidth == "number" ||
              userConfig.contentWidth === "") && (
              <input
                type="number"
                name="contentWidth"
                title="最大幅値(px)"
                placeholder="最大幅値(px)"
                onChange={this.handleChangeConfig}
                value={userConfig.contentWidth}
              />
            )}
            <span>
              * 辞典内容の幅(max-width)。
              幅を制限すると読みやすくなることがあります。この設定はPCモードのみに有効。
            </span>
          </p>
          <p>
            <label>
              <span>コンテンツの段組みの段の幅: </span>
              <select
                name="columnWidth"
                value={
                  typeof userConfig.columnWidth == "number" ||
                  userConfig.columnWidth === ""
                    ? "480"
                    : userConfig.columnWidth || "__"
                }
                onChange={this.handleChangeConfig}
              >
                <option value="__">0 (段組み禁止) (初期値)</option>
                <option value="360px">360px</option>
                <option value="480px">480px</option>
                <option value="600px">600px</option>
                <option value="480">カスタマイズ値</option>
              </select>
            </label>
            {(typeof userConfig.columnWidth == "number" ||
              userConfig.columnWidth === "") && (
              <input
                type="number"
                name="columnWidth"
                placeholder="段組みの段の幅(px)"
                title="段組みの段の幅(px)"
                onChange={this.handleChangeConfig}
                value={userConfig.columnWidth}
              />
            )}
            <span>
              * 辞典内容の段組みの段の幅(column-width)。
              初期値の"0"では、段組みそのものを禁止します。
            </span>
          </p>
          <p>
            <label>
              <span>カスタマイズ CSS: </span>
              <textarea
                name="css"
                cols="30"
                rows="5"
                defaultValue={this.state.css}
                onBlur={this.handleChangeConfig}
              />
            </label>
            <span>
              * 自分好みのCSS。PCまたスマホでのCSSだけを対応したい場合、それぞれ
              "body.g-pv {"{}"}" と "body.g-mv {"{}"}"のbody
              classを指定してください。
            </span>
          </p>
          <p>
            <label>
              <span>カスタマイズ JS: </span>
              <textarea
                name="js"
                cols="30"
                rows="5"
                defaultValue={this.state.js}
                onBlur={this.handleChangeConfig}
              />
            </label>
            <span>
              * 自分好みのJavaScript。
              ここのJSコンテンツはページDOMの"&lt;body&gt;"Elementの真っ先にロードされる。
              変更後ページ更新必要。 Available global hook variables for custom
              JS:
              <code>__APP__</code> , <code>__DB__</code> ,&nbsp;
              <code>__STORE__</code> , <code>__ACTIONS__</code> ,&nbsp;
              <code>__DATA__</code> , <code>__USERCONFIG__</code>,&nbsp;
              <code>__USERCONFIG_LOCAL__</code>. Consult the site&nbsp;
              {JS_DOCUMENT_URL ? (
                <a href={JS_DOCUMENT_URL}>help documentation</a>
              ) : (
                <span>help documentation</span>
              )}
              &nbsp;for more details.
            </span>
          </p>
          <p>
            <label>
              <span>この端末のID: </span>
              <input
                name="deviceId"
                type="text"
                placeholder="deviceId"
                value={_d("deviceId")}
                onChange={this.handleChangeConfig}
              />
            </label>
            <span>
              * 今使用している端末のID。Custom Js に&nbsp;
              <code>__USERCONFIG__.deviceId</code>&nbsp;、Custom CSS に&nbsp;
              <code>body[data-device-id=""] {"{}"}</code> で引用可能。
              <strong>端末ごとに設定、同期されていません。</strong>
            </span>
          </p>
        </form>
        <h4>Anki 連携</h4>
        <p>
          単語帳の内容をこのパソコンでの&nbsp;
          <a className="external" href="https://apps.ankiweb.net/">
            Anki
          </a>
          &nbsp;の deck に同期する。 この機能をご利用するには、
          <a className="external" href="https://apps.ankiweb.net/">
            Anki
          </a>
          &nbsp;と&nbsp;
          <a
            className="external"
            href="https://github.com/FooSoft/anki-connect"
          >
            AnkiConnect
          </a>
          &nbsp; が必要です。また、Ankiで当サイトの origin の&nbsp;
          <code>{config.PUBLIC_URL}</code>&nbsp; を認める必要があります。
        </p>
        <form onSubmit={cancelEvent}>
          <p>
            <label>
              <span>Anki 同期先: </span>
              <input
                name="ankiConnectDeck"
                type="text"
                placeholder={defaultUserConfig.ankiConnectDeck}
                value={_u("ankiConnectDeck", "")}
                onChange={this.handleChangeConfig}
              />
            </label>
            <span>
              * 単語帳を&nbsp;
              <img
                className="inline icon"
                width="16"
                height="16"
                src={`${this.props.rootPath}icons/anki.png`}
              />
              &nbsp;
              <a className="external" href="https://apps.ankiweb.net/">
                Anki
              </a>
              &nbsp; のこの deck に同期する&nbsp; (
              <strong>単語帳 → Anki</strong>&nbsp; の一方向同期)
            </span>
          </p>
          <p>
            <label>
              <span>Anki Connect API key: </span>
              <input
                name="ankiConnectApiKey"
                type="text"
                placeholder=""
                value={_d("ankiConnectApiKey")}
                onChange={this.handleChangeConfig}
              />
            </label>
            <span>* Anki Connect の API key。</span>
          </p>
          <p>
            <label>
              <span>Anki Connect address: </span>
              <input
                name="ankiConnectGlobalAddr"
                type="text"
                placeholder="8765"
                value={_d("ankiConnectGlobalAddr")}
                onChange={this.handleChangeConfig}
              />
            </label>
            <span>
              * Anki Connect addr (global).&nbsp; Could be any combination of
              protocol (default to <code>http:</code>),&nbsp; host (default
              to&nbsp;
              <code>localhost</code>) or port (default to <code>8765</code>
              ).&nbsp; Example:&nbsp;
              <code>8765</code>,&nbsp;
              <code>192.168.1.1</code>,&nbsp;
              <code>192.168.1.1:8765</code>
            </span>
          </p>
          <p>
            <label>
              <span>
                Anki 連携状態:&nbsp;
                <span
                  className={`anki-connect-status-${_d(
                    "ankiConnectStatus"
                  )} label`}
                >
                  {_d("ankiConnectStatus") == 2
                    ? "connected (auto-sync)"
                    : _d("ankiConnectStatus") == 1
                    ? "connected"
                    : "not_connected"}
                </span>
                {!!_d("ankiConnectStatus") && (
                  <span>
                    (with&nbsp;
                    <code>{_d("ankiConnectAddr")}</code>)
                  </span>
                )}
              </span>
            </label>
            <button
              type="button"
              onClick={() => {
                let addr = defaultUserConfig.ankiConnectAddr;
                let test = !!_d("ankiConnectStatus");
                if (!test && _d("ankiConnectGlobalAddr")) {
                  addr = prompt(
                    "Connect to Anki Connect addr:",
                    _d("ankiConnectGlobalAddr")
                  );
                }
                if (addr === null) {
                  return;
                }
                notebookAnkiConnect(null, {
                  test,
                  addr,
                });
              }}
              disabled={ankiStatus != 0}
            >
              {ankiStatus == 1
                ? "Connecting..."
                : _d("ankiConnectStatus")
                ? "Test"
                : "Connect"}
            </button>
            {!!_d("ankiConnectStatus") && (
              <>
                <button
                  type="button"
                  onClick={notebookAnkiSync}
                  disabled={ankiStatus != 0}
                >
                  {ankiStatus == 2 ? "Syncing..." : "Sync"}
                </button>
                <button
                  type="button"
                  onClick={notebookAnkiDisconnect}
                  disabled={ankiStatus != 0}
                >
                  Disconnect
                </button>
                <button
                  type="button"
                  disabled={ankiStatus != 0}
                  onClick={() => {
                    if (
                      !confirm(
                        `Will force re-sync notebook with Anki, are you sure?`
                      )
                    ) {
                      return;
                    }
                    notebookAnkiSync(null, { forceSync: true });
                  }}
                >
                  {ankiStatus == 2 ? "Syncing..." : "Force-sync"}
                </button>
                <label title="単語帳データは変更すると、自動的に Anki と同期する">
                  <input
                    type="checkbox"
                    checked={_d("ankiConnectStatus") == 2}
                    onChange={() => notebookAnkiAutoSync()}
                    disabled={ankiStatus != 0}
                  />
                  自動同期
                </label>
              </>
            )}
            <span>
              * <strong>Anki 連携状態はこの端末のみで有効。</strong>
            </span>
          </p>
          {!!_d("ankiConnectStatus") && (
            <p>
              <em>
                Anki 最終同期日時:&nbsp;
                {lastAnkiSyncTime ? formatTime(lastAnkiSyncTime) : "-"}
              </em>
            </p>
          )}
        </form>
        <h4>上級者向け設定</h4>
        <form onSubmit={cancelEvent}>
          <p>
            <label role="button" className="field">
              <input
                type="checkbox"
                name="nosw"
                checked={!!_d("nosw")}
                onChange={this.handleChangeConfig}
              />
              &nbsp;
              <span>nosw スイッチ</span>
            </label>
            <span>* Service Worker 無効化スイッチ</span>
          </p>
          <p>
            <label role="button" className="field">
              <input
                type="checkbox"
                name="nocj"
                checked={!!_d("nocj")}
                onChange={this.handleChangeConfig}
              />
              &nbsp;
              <span>No cronjob スイッチ</span>
            </label>
            <span>* 有効すると、定期同期などのタスクが動作しなくなる。</span>
          </p>
          <p>
            <label role="button" className="field">
              <input
                type="checkbox"
                name="dnt"
                checked={!!_d("dnt")}
                onChange={this.handleChangeConfig}
              />
              &nbsp;<span>Do Not Track スイッチ</span>
            </label>
            <span>
              * 有効すると、当サイトはあなたを Google Analytics
              追跡・分析から外します。
            </span>
          </p>
          <p>
            <label role="button" className="field">
              <input
                type="checkbox"
                name="debug"
                checked={!!_d("debug")}
                onChange={this.handleChangeConfig}
              />
              &nbsp;
              <span>Debug スイッチ</span>
            </label>
            <span>
              * Enable debug / develop mode. (Will impact the performance).
            </span>
          </p>
        </form>
        <p>
          <button type="button" onClick={this.resetConfig}>
            すべての設定をリセット
          </button>
          <button type="button" onClick={userConfigExport}>
            設定をエクスポート
          </button>
          <input
            type="file"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) {
                return;
              }
              if (!file.name.endsWith(".json") || file.size > 1024 * 100) {
                return toastr.warning(
                  "設定インポート：ファイル非合法",
                  `Require .json file (max size 100KB)`
                );
              }
              if (
                !confirm(
                  `設定ファイル ${file.name} をインポートしようとしています、よろしいですか？`
                )
              ) {
                this.configFileEl.value = null;
                return;
              }
              const reader = new FileReader();
              reader.addEventListener(
                "load",
                async () => {
                  let result = await userConfigImport(reader.result);
                  if (result.error) {
                    return handleError(result.error);
                  }
                  toastr.success("設定インポートしました", `${file.name}`);
                  this.configFileEl.value = null;
                },
                false
              );
              reader.addEventListener("error", handleError, false);
              reader.readAsText(file);

              function handleError(error) {
                toastr.error(
                  "設定インポート失敗しました",
                  `エラー：${error.toString()}`
                );
                this.configFileEl.value = null;
              }
            }}
            ref={(el) => (this.configFileEl = el)}
          />
          <button type="button" onClick={() => this.configFileEl.click()}>
            設定をインポート
          </button>
        </p>
        <p>
          *　設定は今使用しているブラウザーの localStorage に保存される。
          {!!googleUserInfo ? (
            <span>
              &nbsp;(Googleアカウント&nbsp;
              <img
                className="cloud-gravatar"
                width="16"
                height="16"
                src={googleUserInfo.picture}
              />
              &nbsp;
              {googleUserInfo.name} で同期しています。)
            </span>
          ) : (
            <span>
              &nbsp;(Googleアカウントで&nbsp;
              <a
                role="button"
                onClick={close}
                href={`${this.props.rootPath}cloud/`}
              >
                <span className="emoji icon" title="ログイン(クラウド機能)">
                  ☁️
                </span>
                ログイン
              </a>
              すると、 設定を他のデバイスと同期することができます。)
            </span>
          )}
        </p>
        <h4>Service Worker</h4>
        <p>
          <label>
            <span>状態: </span>
            <span className={`sw-status-${sw_status || 0}`}>{sw_status}</span>
          </label>
          <span>
            * 当サイトは &nbsp;
            <a
              className="external"
              href="https://developers.google.com/web/fundamentals/primers/service-workers/?hl=ja"
            >
              Service Worker
            </a>
            &nbsp; 技術を利用して、オフライン動作を対応している。
            <button
              disabled={!__sw_registration__}
              type="button"
              title="Service WorkerをUnregisterする (キャッシュを削除)"
              onClick={async (e) => {
                if (
                  !confirm(
                    `Will unregister current service worker and purge all caches, are you sure?`
                  )
                ) {
                  return;
                }
                try {
                  await __sw_registration__.unregister();
                  window.__sw_registration__ =
                    await navigator.serviceWorker.getRegistration();
                  let cacheNames = await caches.keys();
                  for (let i = 0; i < cacheNames.length; i++) {
                    if (
                      cacheNames[i].indexOf(config.PUBLIC_URL) != -1 ||
                      new RegExp(`\\b${config.SITEID}[\\b_]`).test(
                        cacheNames[i]
                      )
                    ) {
                      await caches.delete(cacheNames[i]);
                    }
                  }
                } catch (e) {}
                this.setState({
                  swMsg:
                    "Service WorkerをUnregisterしました (キャッシュは削除された)。ページをリロードすると再びService Workerをinstallする。",
                });
              }}
            >
              Unregister
            </button>
            <button
              disabled={this.state.updatingSw || !__sw_registration__}
              type="button"
              title="今すぐService Workerを更新する"
              onClick={async (e) => {
                this.setState({ updatingSw: true });
                try {
                  window.__sw_registration__ =
                    await __sw_registration__.update();
                  window.__sw_registration__.onupdatefound = (e) => {
                    toastr.info(
                      "新たなService Workerバージェンを発見",
                      "Service Workerを更新中..."
                    );
                    this.setState({
                      swMsg:
                        "新たなService Workerバージェンを発見：Service Workerを更新中...",
                    });
                    e.target.installing.addEventListener(
                      "statechange",
                      this.swStateChangeHandle
                    );
                  };
                } catch (e) {}
                this.setState({ updatingSw: false });
              }}
            >
              {this.state.updatingSw ? "Updating..." : "Update"}
            </button>
          </span>
        </p>
        {!!this.state.swMsg && <p className="secondary">{this.state.swMsg}</p>}
        <h4>サイトのバージョン</h4>
        <p className="padding-bottom">
          <span>
            現在のバージョン: {__ROOTVERSION__}-{__COMMIT_HASH__}-
            <span title={$$hash}>{$$hash.slice(0, 8)}</span>
            &nbsp;(Date:&nbsp;
            {DATE || "-"})
          </span>
          <span> | </span>
          <span>
            更新バージョン:&nbsp;
            {this.state.checking ? (
              <span>確認中...</span>
            ) : isLatest ? (
              <span className="ok">すでに最新版です</span>
            ) : (
              <span>
                <span className="inline-section notice">
                  {this.state.latestVersion}-{this.state.latestCommitHash}-
                  <span title={this.state.latestConfigHash}>
                    {this.state.latestConfigHash.slice(0, 8)}
                  </span>
                </span>
                <button
                  type="button"
                  title="新しいバージョンに更新します (ページは再ロードする)"
                  onClick={async (e) => {
                    if (__sw_registration__) {
                      await __sw_registration__.unregister();
                    }
                    location.reload(true);
                  }}
                >
                  今すぐ更新
                </button>
              </span>
            )}
          </span>
        </p>
      </div>
    );
  }
}
