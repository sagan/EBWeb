import React, { Fragment } from "react";
import parsers from "../parsers.jsx";
import { _c, _d } from "../userConfig.js";

export default function Parser({
  parserClear,
  parserInput,
  parserClose,
  parserExecute,
  parserTab,
  parserToggleLpMode,
  updateUserConfig,
  userConfig,
  parser: { q, status, results, errors },
}) {
  let selectedIndex = _d("parserTab");
  return (
    <>
      <p className="msg parser-header">
        <span>日本語：</span>
        <span className="right">
          {parsers.map(({ title, desc }, index) => (
            <a
              role="button"
              key={index}
              title={desc}
              className={selectedIndex == index ? "active" : ""}
              data-tab={index}
              onClick={parserTab}
            >
              {title}
            </a>
          ))}
          <span
            role="button"
            aria-label="日本語分析・翻訳・ほかを閉める"
            title="閉める [alt-shift-x]"
            onClick={parserClose}
            className="last"
            accessKey="x"
          >
            &times;
          </span>
        </span>
      </p>
      <form onSubmit={parserExecute}>
        <div className="parser-content">
          <textarea
            onKeyDown={(event) => {
              // ctrl + enter
              if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                parserExecute();
              }
            }}
            placeholder={
              parsers[selectedIndex].placeholder + "Ctrl+Enterで実行。"
            }
            disabled={status == 2}
            value={q}
            onChange={parserInput}
            rows="10"
          />
          <div className="parser-result">
            <p className="topmsg">
              <button type="submit" disabled={status == 2}>
                {status == 2 ? "実行中..." : "実行"}
              </button>
              <button
                type="button"
                disabled={status == 2}
                onClick={parserClear}
              >
                クリア
              </button>
              {!selectedIndex && (
                <>
                  <label role="button" title="分析モード">
                    <select
                      disabled={status == 2}
                      value={_d("parserFuriganaMode")}
                      onChange={async (e) => {
                        await updateUserConfig({
                          parserFuriganaMode: parseInt(e.target.value),
                        });
                        await parserExecute();
                      }}
                    >
                      <option value="" disabled>
                        分析モード
                      </option>
                      <option value="0">振り仮名あり</option>
                      <option value="2">振り仮名なし</option>
                    </select>
                  </label>
                  <label
                    role="button"
                    title="分析結果での形態素単語をプレビュー"
                  >
                    <input
                      type="checkbox"
                      checked={!!_d("parserLpMode")}
                      onClick={parserToggleLpMode}
                    />
                    &nbsp;プレビュー
                  </label>
                </>
              )}
              {selectedIndex == 1 && (
                <>
                  <label>
                    <span>訳文言語: </span>
                    <select
                      value={_d("parserTranslatorTarget")}
                      onChange={async (e) => {
                        await updateUserConfig({
                          parserTranslatorTarget: e.target.value,
                        });
                        await parserExecute();
                      }}
                    >
                      <option value="en">English</option>
                      <option value="zh">简体中文</option>
                      <option value="zh-TW">繁體中文</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                    </select>
                  </label>
                </>
              )}
            </p>
            {parsers.map(({ Component }, index) => {
              return (
                <Fragment key={index}>
                  {selectedIndex == index &&
                    (errors[index] ? (
                      <div
                        className="parser-error"
                        dangerouslySetInnerHTML={{
                          __html: errors[index].toString(),
                        }}
                      />
                    ) : (
                      <Component result={results[index]} />
                    ))}
                </Fragment>
              );
            })}
          </div>
        </div>
      </form>
    </>
  );
}
