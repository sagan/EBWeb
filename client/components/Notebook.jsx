import React, { PureComponent } from "react";
import Modal from "react-modal";
import PlaySoundIcon from "./PlaySoundIcon.jsx";
import { getCanonicalUrlSearch, formatTime, debounce } from "../functions";
import NotebookActionsDialog from "./NotebookActionsDialog.jsx";
import { _c, _d } from "../userConfig.js";

export default class Notebook extends PureComponent {
  constructor(props) {
    super(props);
    this.query = debounce(this.query.bind(this), 500);
  }
  componentDidMount() {
    this.props.notebookQuery({ initial: true });
    this.props.notebookTags();
    this.props.fetchMeta();
  }
  query(q) {
    q != this.props.notebook.queryQ && this.props.notebookQuery({ q });
  }
  render() {
    let {
      userConfig, // need it exists in props so any change will trigger re-render
      config: { ROOTPATH },
      modal,
      metaValues,
      updateUserConfig,
      googleSync,
      playSound,
      playing,
      playingSoundWordId,
      notebook,
      notebookAnkiConnect,
      notebookAnkiSync,
      notebookModal,
      notebookExport,
      notebookImport,
      notebookEdit,
      notebookCreate,
      notebookQ,
      notebookQuery,
      notebookToggle,
      notebookRefresh,
    } = this.props;
    let { showingId, q, queryQ, queryTag, notes, queryLoading } = notebook;

    let synced =
      metaValues.notSyncedNoteCnt == 0 &&
      metaValues.notSyncedDeletedNoteCnt == 0;
    let ankiSynced =
      metaValues.notebookLastModifiedTime < metaValues.lastAnkiSyncTime;
    return (
      <article className="single-dict">
        <h3 className="flex-spread flex-align-start">
          <span className="flex-2">
            単語帳 ({notes.length})
            {!!queryTag && (
              <span title={`タグ ${queryTag}`}> - 🏷️ {queryTag}</span>
            )}
          </span>
          <input
            className="flex-2 no-min-width"
            placeholder="検索"
            type="search"
            value={q}
            onChange={(e) => {
              let q = e.target.value;
              notebookQ(q);
              this.query(q);
            }}
          />
          <span className="flex-3 align-right">
            <label role="button" title="タイトルのみ表示モード">
              <input
                type="checkbox"
                checked={!!_d("notebookTitleMode")}
                onClick={(e) =>
                  updateUserConfig({
                    notebookTitleMode: +!_d("notebookTitleMode"),
                  })
                }
              />
              &nbsp;簡略
            </label>
            {!!_d("ankiConnectStatus") && !metaValues.googleUserInfo && (
              <span>
                <a
                  role="button"
                  className={
                    notebook.ankiStatus == 2
                      ? "loading"
                      : ankiSynced
                      ? "loaded"
                      : ""
                  }
                  title={
                    notebook.ankiStatus == 2
                      ? "Anki 同期中..."
                      : ankiSynced
                      ? "Anki 同期済み"
                      : "Anki 同期"
                  }
                  onClick={notebookAnkiSync}
                >
                  <span className="emoji">☁️</span>
                </a>
              </span>
            )}
            {!!metaValues.googleUserInfo && (
              <span>
                <a
                  role="button"
                  className={
                    metaValues.inProcessSync
                      ? "loading"
                      : synced
                      ? "loaded"
                      : ""
                  }
                  title={
                    metaValues.inProcessSync
                      ? "同期中..."
                      : synced
                      ? "同期済み"
                      : "同期"
                  }
                  onClick={async (e) => {
                    await googleSync({ force: 1, fromNotebook: true });
                    await notebookAnkiSync();
                  }}
                >
                  <span className="emoji">☁️</span>
                </a>
              </span>
            )}
            <a
              role="button"
              title={queryLoading ? "更新中..." : "更新"}
              className={queryLoading ? "loading" : ""}
              onClick={notebookRefresh}
            >
              <span className="emoji">🔃</span>
            </a>
            <a
              role="button"
              className="last"
              title="新規ノートを作成 [alt-shift-+]"
              accesskey="+"
              onClick={notebookCreate}
            >
              +
            </a>
          </span>
        </h3>
        {notes.length == 0 &&
          (queryQ ? (
            <p className="msg">該当する単語がありません。</p>
          ) : (
            <p className="msg">
              お気に入りの単語を単語帳に追加するには、検索結果で単語のタイトル右側の
              「<span className="emoji icon not-active">⭐</span>
              」印をクリックしてください。データは今使用している端末のみに保存され、
              当サイトのサーバーに送信されることはありません。
              <span>
                &nbsp;(Googleアカウントで&nbsp;
                <a role="button" href={`${ROOTPATH}cloud/`}>
                  <span className="emoji icon" title="ログイン(クラウド機能)">
                    ☁️
                  </span>
                  ログイン
                </a>
                すると、 単語帳は自動的に他のデバイスと同期します。)
              </span>
            </p>
          ))}
        <div
          className={`dict-content notes ${
            _d("notebookTitleMode") ? "notes-title-mode" : ""
          }`}
        >
          {notes.map((note) => {
            let {
              id,
              dictid,
              time,
              tag,
              status,
              title,
              heading,
              content,
              comment,
            } = note;
            let dict = "";
            if (dictid) {
              dict = dictid.slice(0, dictid.indexOf("_"));
            }
            tag = tag || [];
            return (
              <div key={id} className="note">
                <span
                  className="note-title"
                  onClick={
                    _d("notebookTitleMode")
                      ? (e) => {
                          if (e.target.classList.contains("note-source-link")) {
                            return;
                          }
                          notebookToggle(note);
                        }
                      : null
                  }
                >
                  <h2 className="note-title-text">
                    <a>{title || "未命名ノート"}</a>
                  </h2>
                  {!!dictid && (
                    <sub className="note-source">
                      <a
                        className="note-source-link"
                        data-nolp={+!_d("notebookLp")}
                        data-lp={_d("notebookLp")}
                        data-lp-rmk={_d("notebookLpRequireModifierKey")}
                        href={`${ROOTPATH}${getCanonicalUrlSearch({
                          dictid,
                        })}`}
                      >
                        {dict}
                      </a>
                      &nbsp;より
                    </sub>
                  )}
                  <PlaySoundIcon
                    word={note.title}
                    playSound={playSound}
                    playingSoundWordId={playingSoundWordId}
                    playing={playing}
                  />
                  <span
                    className="emoji"
                    role="button"
                    title="ノートを編集する"
                    onClick={(e) => notebookEdit({ e, note, dict })}
                  >
                    🖊️
                  </span>
                  {!!_d("notebookTitleMode") && (
                    <span
                      role="button"
                      className={`${showingId != id ? "rotate270" : ""}`}
                      title="ノート内容を表示する"
                    >
                      ▾
                    </span>
                  )}
                </span>
                {(!_d("notebookTitleMode") || showingId == id) && (
                  <>
                    <div className="note-content">{content}</div>
                    <hr />
                    <div className="note-comment">{comment}</div>
                    <div className="note-meta">
                      <span className="note-time">{formatTime(time)}</span>
                      <span className="note-tags">
                        {tag.map((tag, i, tags) => (
                          <span key={i}>
                            <a
                              role="button"
                              onClick={() => notebookQuery({ tag, q: "" })}
                              className="note-tag"
                            >
                              <span className="emoji">🏷️</span>
                              {tag}
                            </a>
                            {i != tags.length - 1 && ", "}
                          </span>
                        ))}
                      </span>
                      {!!_d("debugSync") && (
                        <span
                          className="note-status"
                          title="ノートの同期状態(0 = created; 1 = synced; 2 = updated)"
                        >
                          Status: {status}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
        <Modal isOpen={modal} onRequestClose={notebookModal}>
          {modal == 1 && (
            <NotebookActionsDialog
              userConfig={userConfig}
              metaValues={metaValues}
              notebook={notebook}
              close={notebookModal}
              notebookExport={notebookExport}
              notebookImport={notebookImport}
              notebookAnkiConnect={notebookAnkiConnect}
              notebookAnkiSync={notebookAnkiSync}
            />
          )}
        </Modal>
      </article>
    );
  }
}
