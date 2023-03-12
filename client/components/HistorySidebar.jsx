import React, { useMemo } from "react";
import { debounce } from "../functions.js";
const { paginationOptions, _d } = require("../userConfig");

export default function HistorySidebar({
  userConfig,
  history,
  updateUserConfig,
  historyQ,
  historyRefresh,
  historyClear,
  historyQuery,
  historyFirst,
  historyPrev,
  historyNext,
}) {
  const query = useMemo(
    () =>
      debounce(function (q) {
        q != history.queryQ && historyQuery({ q });
      }, 500),
    [history, historyQuery]
  );
  return (
    <>
      <div className="history-pagination">
        <h3 className="flex-spread">
          <span>使用履歴</span>
          {history.queryLoading ? (
            <span className="emoji icon" title="読み込み中...">
              🔄
            </span>
          ) : (
            <a
              role="button"
              className="last"
              title={
                history.queryLoading
                  ? "読み込み中..."
                  : "すべての履歴を表示 [alt-shift-r]"
              }
              accesskey="r"
              onClick={(e) => {
                historyQ("");
                historyQuery({ q: "", clear: true });
              }}
            >
              リセット
            </a>
          )}
        </h3>
        <ul className="pagination">
          <li>
            {history.currentPageMarker ? (
              <a onClick={historyFirst} role="button" title="最初のページ">
                ←最初
              </a>
            ) : (
              <span role="button">←最初</span>
            )}
          </li>
          <li>
            {history.currentPageMarker ? (
              <a
                onClick={historyPrev}
                role="button"
                title="←前のページ [alt-shift-p]"
                accessKey="p"
              >
                ←前
              </a>
            ) : (
              <span role="button">←前</span>
            )}
          </li>
          <li>
            {history.nextPageMarker ? (
              <a
                onClick={historyNext}
                className="last"
                role="button"
                title="次のページ [alt-shift-n]"
                accessKey="n"
              >
                次→
              </a>
            ) : (
              <span role="button" className="last">
                次→
              </span>
            )}
          </li>
        </ul>
      </div>
      <div className="history-config">
        <h3 className="flex-spread">
          <span>表示設定</span>
          <button
            disabled={history.queryLoading}
            className="last"
            onClick={(e) => {
              if (
                !confirm(`全ての利用履歴を削除しようとする、確認しますか？`)
              ) {
                return;
              }
              historyClear();
            }}
          >
            履歴初期化
          </button>
        </h3>
        {_d("livepreviewEnable") != 2 && (
          <div>
            <label role="button">
              <input
                type="checkbox"
                checked={!!_d("historyLp")}
                onClick={(e) =>
                  updateUserConfig({ historyLp: +!_d("historyLp") })
                }
              />
              &nbsp;履歴内容をプレビュー
            </label>
          </div>
        )}
        {_d("livepreviewEnable") != 2 &&
          _d("livepreviewModifierKeyType") != 1 &&
          !!_d("historyLp") && (
            <div>
              <label role="button">
                <input
                  type="checkbox"
                  checked={!!_d("historyLpRequireModifierKey")}
                  onClick={(e) =>
                    updateUserConfig({
                      historyLpRequireModifierKey: +!_d(
                        "historyLpRequireModifierKey"
                      ),
                    })
                  }
                />
                &nbsp;[{_d("livepreviewModifierKey")}押す必要(PC)]
              </label>
            </div>
          )}
        <div>
          <label>
            <span>ページネーション: </span>
            <select
              disabled={history.queryLoading}
              value={_d("historyPagination")}
              onChange={async (e) => {
                await updateUserConfig({
                  historyPagination: parseInt(e.target.value),
                });
                historyRefresh();
              }}
            >
              {paginationOptions.indexOf(_d("historyPagination")) == -1 && (
                <option value={_d("historyPagination")}>
                  {_d("historyPagination")}
                </option>
              )}
              {paginationOptions.map((pagination) => (
                <option key={pagination} value={pagination}>
                  {pagination}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <input
            type="search"
            value={history.q}
            onChange={(e) => {
              let q = e.target.value;
              historyQ(q);
              query(q);
            }}
            placeholder="履歴を検索"
          />
        </div>
      </div>
    </>
  );
}
