import React, { useState, useEffect, useMemo } from "react";
import useDebounce from "../useDebounce.js";
import { debounce } from "../functions.js";
const {
  defaultUserConfig,
  paginationOptions,
  tagsLimitOptions,
  _c,
  _d,
} = require("../userConfig");

export default function NotebookSidebar({
  userConfig,
  notebook,
  metaValues,
  fetchMeta,
  updateUserConfig,
  notebookQ,
  notebookModal,
  notebookRefresh,
  notebookTags,
  notebookTagFilter,
  notebookQuery,
  notebookFirst,
  notebookPrev,
  notebookNext,
}) {
  const [filter, setFilter] = useState(notebook.tagFilter);
  const debouncedFilter = useDebounce(filter, 500);
  const { queryTag } = notebook;

  const query = useMemo(
    () =>
      debounce(function (q) {
        q != notebook.queryQ && notebookQuery({ q });
      }, 500),
    [notebook, notebookQuery]
  );

  useEffect(() => {
    filter != notebook.tagFilter && notebookTagFilter(filter);
  }, [debouncedFilter]);

  const renderTag = (tag) => (
    <li key={tag.name}>
      {queryTag !== tag.name ? (
        <a onClick={() => notebookQuery({ q: "", tag: tag.name })}>
          🏷️&nbsp;{tag.name} ({tag.noteCnt || 0})
        </a>
      ) : (
        <span>
          🏷️&nbsp;{tag.name} ({tag.noteCnt || 0})
        </span>
      )}
    </li>
  );

  return (
    <div className="notebook-sidebar">
      <div className="notebook-pagination">
        <h3 className="flex-spread">
          <span>単語帳 ({metaValues.noteCnt})</span>
          <span className="spacing-between">
            <a
              title={
                notebook.queryLoading
                  ? "読み込み中..."
                  : "すべてのノートを表示 [alt-shift-r]"
              }
              accesskey="r"
              role="button"
              className="last"
              disabled={notebook.queryLoading}
              onClick={(e) => {
                notebookQ("");
                notebookTags();
                fetchMeta({ refresh: true });
                notebookQuery({ q: "", tag: "", clear: true });
              }}
            >
              リセット
            </a>
          </span>
        </h3>
        <ul className="pagination">
          <li>
            {notebook.currentPageMarker || notebook.offset ? (
              <a onClick={notebookFirst} role="button" title="最初のページ">
                ←最初
              </a>
            ) : (
              <span role="button">←最初</span>
            )}
          </li>
          <li>
            {notebook.currentPageMarker || notebook.offset ? (
              <a
                onClick={notebookPrev}
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
            {notebook.nextPageMarker || notebook.hasNext ? (
              <a
                onClick={notebookNext}
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
      <div className="notebook-config">
        <h3 className="flex-spread">
          <span>表示設定</span>
          <button
            className="last"
            title="単語帳のエクスポート・インポート・同期・初期化"
            onClick={notebookModal}
          >
            アクション
          </button>
        </h3>
        {_d("livepreviewEnable") != 2 && (
          <div>
            <label role="button">
              <input
                type="checkbox"
                checked={!!_d("notebookLp")}
                onClick={(e) =>
                  updateUserConfig({ notebookLp: +!_d("notebookLp") })
                }
              />
              &nbsp;リンクをプレビュー
            </label>
          </div>
        )}
        {_d("livepreviewEnable") != 2 &&
          _d("livepreviewModifierKeyType") != 1 &&
          !!_d("notebookLp") && (
            <div>
              <label role="button">
                <input
                  type="checkbox"
                  checked={!!_d("notebookLpRequireModifierKey")}
                  onClick={(e) =>
                    updateUserConfig({
                      notebookLpRequireModifierKey: +!_d(
                        "notebookLpRequireModifierKey"
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
              disabled={notebook.queryLoading}
              value={_d("notebookPagination")}
              onChange={async (e) => {
                await updateUserConfig({
                  notebookPagination: parseInt(e.target.value),
                });
                notebookRefresh();
              }}
            >
              {paginationOptions.indexOf(_d("notebookPagination")) == -1 && (
                <option value={_d("notebookPagination")}>
                  {_d("notebookPagination")}
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
            value={notebook.q}
            onChange={(e) => {
              let q = e.target.value;
              notebookQ(q);
              query(q);
            }}
            placeholder="単語帳を検索"
          />
        </div>
      </div>
      <div className="notebook-tags">
        <h3 className="notebook-tags-header flex-spread">
          <span>タグ</span>
          <span>
            <select
              value={_d("notebookTagsLimit")}
              onChange={async (e) => {
                await updateUserConfig({
                  notebookTagsLimit: parseInt(e.target.value),
                });
                await notebookTags();
              }}
            >
              {tagsLimitOptions.map((option) => (
                <option key={option} value={option}>
                  最近の{option}
                </option>
              ))}
              {tagsLimitOptions.indexOf(_d("notebookTagsLimit")) == -1 && (
                <option value={_d("notebookTagsLimit")}>
                  最近の{_d("notebookTagsLimit")}
                </option>
              )}
              <option value="0">すべて ({metaValues.tagCnt || 0})</option>
            </select>
          </span>
        </h3>
        <div>
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="フィルター"
          />
        </div>
        <ul>
          {!!queryTag &&
            !notebook.tags.find((tag) => tag.name === queryTag) &&
            renderTag({ name: queryTag })}
          {notebook.tags.map(renderTag)}
        </ul>
      </div>
    </div>
  );
}
