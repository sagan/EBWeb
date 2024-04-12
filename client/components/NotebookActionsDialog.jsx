import React from "react";
import { useFilePicker } from "use-file-picker";
import { _c, _d } from "../userConfig";
import { formatTime } from "../functions";

export default function NotebookActionsDialog({
  userConfig,
  metaValues,
  close,
  notebookAnkiConnect,
  notebookAnkiSync,
  notebookExport,
  notebookImport,
  notebook: { ankiStatus, queryTag, tags, importStatus },
}) {
  const [openFileSelector, { filesContent, loading, errors, clear }] =
    useFilePicker({
      readAs: "Text",
      accept: [".csv"],
      maxFileSize: 50, // MB
      multiple: false,
    });
  let tag = tags.find((tag) => tag.name === queryTag);
  let cnt = tag ? tag.noteCnt || 0 : metaValues.noteCnt || 0;
  let lastAnkiSyncTime = metaValues.lastAnkiSyncTime || 0;

  async function importNotebook() {
    // console.log("file", filesContent[0].content);
    let result = await notebookImport(filesContent[0].content);
    alert(`ファイル ${filesContent[0].name} のインポートは完了しました。
インポートした単語数: ${result.successCnt}。
エラー発生の単語数: ${result.failureCnt}。
`);
    clear();
  }

  return (
    <div className="notebook-actions-dialog dialog">
      <h3>
        <span>単語帳のアクション</span>
        <span className="right">
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
      <h4>エクスポート・インポート</h4>
      <p>
        <span>
          {tag ? (
            <span>🏷️&nbsp;{tag.name}&nbsp;</span>
          ) : (
            <span>すべて&nbsp;</span>
          )}
          ({cnt})&nbsp;のノートをエクスポートする:&nbsp;
        </span>
        <button
          disabled={!!importStatus || !cnt}
          onClick={(e) => notebookExport(tag, "csv")}
        >
          エクスポート(CSV形式)
        </button>
        <button
          disabled={!!importStatus || !cnt}
          onClick={(e) => notebookExport(tag, "txt")}
        >
          エクスポート(閲覧用TXT形式)
        </button>
      </p>
      <p>
        <span>ノートをインポートする: </span>
        <button disabled={!!importStatus} onClick={openFileSelector}>
          ファイル(CSV形式)を選択
        </button>
        <button
          disabled={!!importStatus || filesContent.length == 0}
          onClick={importNotebook}
        >
          {importStatus ? "インポート中..." : "インポート"}
        </button>
        {filesContent.length > 0 && (
          <span>選択しているファイル: {filesContent[0].name}</span>
        )}
      </p>
      <h4>Anki 同期 (実験的な機能)</h4>
      <p>
        単語帳の内容をこのパソコンでの&nbsp;
        <a className="external" href="https://apps.ankiweb.net/">
          Anki
        </a>
        &nbsp;の deck に同期 &nbsp;(<strong>単語帳 → Anki</strong>&nbsp;
        の一方向同期)&nbsp;:&nbsp;
        <button
          disabled={!_d("ankiConnectStatus") || !!ankiStatus}
          onClick={notebookAnkiSync}
        >
          {ankiStatus == 2 ? "Syncing..." : "Sync"}
        </button>
        <button
          disabled={!_d("ankiConnectStatus") || !!ankiStatus}
          onClick={() => notebookAnkiConnect(null, { test: 1 })}
        >
          {ankiStatus == 1 ? "Connecting..." : "Test"}
        </button>
      </p>
      <p>
        <span>
          Anki 連携状態:&nbsp;
          <span
            className={`anki-connect-status-${_d("ankiConnectStatus")} label`}
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
        <br />
        *&nbsp;
        <em>
          Anki 最終同期日時:&nbsp;
          {lastAnkiSyncTime ? formatTime(lastAnkiSyncTime) : "-"}
        </em>
        <br />* Anki での同期先 deck:&nbsp;
        <code>{_d("ankiConnectDeck")}</code>
        <br />* この機能をご利用するには、設定画面で Anki
        との連携を配置してください。
      </p>
      <h4>単語帳の初期化</h4>
      <p className="padding-bottom">
        誤操作を防止するために、現在、単語帳の初期化機能は配備されていません。
        ご要望がある方は以下のリンク先の手順を踏んでブラウザの機能を使用し、当サイトのサイトデータを消去してください：
        <a
          className="external"
          href="https://support.google.com/accounts/answer/32050"
        >
          Chrome
        </a>
        ,&nbsp;
        <a
          className="external"
          href="https://support.mozilla.org/ja/kb/how-clear-firefox-cache"
        >
          Firefox
        </a>
        ,&nbsp;
        <a className="external" href="https://support.apple.com/ja-jp/HT201265">
          Safari
        </a>
        。
      </p>
    </div>
  );
}
