import React, { useState, useEffect } from "react";
import { formatTime } from "../functions";
import CloudManual from "./CloudManual.jsx";
import CloudPrivacy from "./CloudPrivacy.jsx";
import TestPage from "./TestPage.jsx";
import { _c } from "../userConfig.js";

export default function Cloud({
  syncUserConfigFromPersistence,
  cloud,
  fetchMeta,
  metaValues,
  googleOpenDataFile,
  googleSignin,
  googleSignout,
  googleSync,
  googleResetSync,
}) {
  let { googleUserInfo, googleTokens } = metaValues;
  let { syncError } = cloud;

  const [t, setT] = useState(+new Date());
  const [updating, setUpdating] = useState(false);
  const [first, setFirst] = useState(true);

  let syncing =
    metaValues.inProcessSync &&
    metaValues.inProcessSync + 120 * 1000 >= +new Date();

  function refresh() {
    setT(+new Date());
  }

  async function sync(force = 0) {
    await googleSync({ force });
  }

  useEffect(() => {
    if (first) {
      setFirst(false);
      sync();
    }
  }, [first]);

  useEffect(() => {
    (async () => {
      if (updating) {
        return;
      }
      setUpdating(true);
      await fetchMeta({ refresh: true });
      await syncUserConfigFromPersistence();
      setUpdating(false);
    })();
  }, [t]);

  useEffect(() => {
    const interval = setInterval(refresh, 1000);
    return () => clearInterval(interval);
  }, []);

  if (cloud.page == "manual") {
    return (
      <article className="single-dict">
        <CloudManual />
      </article>
    );
  } else if (cloud.page == "privacy") {
    return (
      <article className="single-dict">
        <CloudPrivacy />
      </article>
    );
  } else if (cloud.page == "test") {
    return (
      <article className="single-dict">
        <TestPage />
      </article>
    );
  }

  return (
    <article className="single-dict">
      <h3>クラウド</h3>
      <p>
        クラウド機能を利用して、
        この端末での単語帳と設定などのデータをGoogleサーバーに永久保存して、
        ほかのデバイスと同期することができます。
        クラウド機能を利用するには、Googleアカウントでログインしてください。
        データはユーザーご自分の&nbsp;
        <a
          className="external"
          rel="noopener noreferrer"
          href="https://www.google.com/intl/ja/drive/"
        >
          Googleドライブ
        </a>
        &nbsp;に保存されます。
        現在同期できるのデータは：単語帳、設定、最近の使用履歴。
      </p>
      <p>
        ログイン状態：
        {googleUserInfo ? (
          <span>
            <img
              crossorigin="anonymous"
              className="cloud-gravatar"
              width="16"
              height="16"
              src={googleUserInfo.picture}
            />
            &nbsp;
            {googleUserInfo.name} でログイン中
          </span>
        ) : (
          "非ログイン中"
        )}
      </p>
      {!!googleUserInfo && (
        <div>
          <h3>
            同期情報 (情報日時: {formatTime(t)}&nbsp;
            <a role="button" title="更新" onClick={refresh}>
              🔄
            </a>
            )
          </h3>
          <ul>
            <li>現在の同期状態：{syncing ? "同期中..." : "非同期中"}</li>
            <li>
              同期済みの単語ノート数：
              {metaValues.notSyncedNoteCnt < 100
                ? metaValues.noteCnt - metaValues.notSyncedNoteCnt
                : "-"}
              &nbsp;/ {metaValues.noteCnt}
              {metaValues.notSyncedNoteCnt >= 100 && ` (未同期ノート数 100+)`}
              {metaValues.notSyncedNoteCnt == 0 &&
                metaValues.notSyncedDeletedNoteCnt == 0 &&
                metaValues.noteCnt > 0 && (
                  <span className="ok">&nbsp;(✓ すべて同期完了)</span>
                )}
            </li>
            <li>
              最近の同期メッセージ：{syncError ? syncError.toString() : "-"}
            </li>
            <li>
              最終同期日時：
              {googleTokens.syncTime ? formatTime(googleTokens.syncTime) : "-"}
            </li>
            {!!_c("debugSync") && (
              <>
                <li>
                  クラウドでの単語帳(ノート)データ日時：
                  {metaValues.syncDataTime
                    ? formatTime(metaValues.syncDataTime)
                    : "-"}
                </li>
                <li>
                  クラウドでの設定データ日時：
                  {metaValues.syncConfigDataTime
                    ? formatTime(metaValues.syncConfigDataTime)
                    : "-"}
                </li>
                <li>
                  クラウドでの使用履歴データ日時：
                  {metaValues.syncHistoryDataTime
                    ? formatTime(metaValues.syncHistoryDataTime)
                    : "-"}
                </li>
                <li>
                  <span title="inProcessSync">
                    ただいまの同期リクエスト開始時間：
                  </span>
                  {metaValues.inProcessSync
                    ? formatTime(metaValues.inProcessSync)
                    : "-"}
                </li>
                <li>
                  <span title="inProcessSync">同期最短間隔(ms)：</span>
                  {_c("syncMinInterval")}
                </li>
              </>
            )}
          </ul>
        </div>
      )}
      <p className="spacing-between">
        {!googleUserInfo && (
          <button type="button" onClick={googleSignin}>
            Googleアカウントでログイン
          </button>
        )}
        {!!googleUserInfo && (
          <button type="button" onClick={(e) => sync(1)}>
            今すぐ同期
          </button>
        )}
        {!!googleUserInfo && !!_c("debugSync") && (
          <button type="button" onClick={(e) => sync(2)}>
            強制同期
          </button>
        )}
        {!!_c("debugSync") && (
          <button
            type="button"
            onClick={async (e) => {
              if (!confirm("デーだ同期状態リセットしようと、確認しますか？")) {
                return;
              }
              await googleResetSync();
              refresh();
              alert("デーだ同期状態リセット完了。");
            }}
          >
            デーだ同期状態リセット
          </button>
        )}
        {!!googleTokens && (
          <button
            type="button"
            onClick={googleOpenDataFile}
            disabled={!googleTokens.dataFileUrl}
            title="Googleドライブでのこの同期サービスのデータファイル(スプレッドシート)を開きます"
          >
            同期ファイルを開く
          </button>
        )}
        {!!googleUserInfo && (
          <button
            type="button"
            onClick={(e) => {
              if (!confirm(`ログアウトしようとする、確認しますか？`)) {
                return;
              }
              googleSignout();
            }}
          >
            ログアウト
          </button>
        )}
      </p>
    </article>
  );
}
