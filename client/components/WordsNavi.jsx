import React from "react";
import { ebtext2html, getCanonicalUrlSearch } from "../functions";
import ExternalSearchLinks from "./ExternalSearchLinks.jsx";

const KEYWORD_EXCERPT_LENGTH = 15;

export default class WordsNavi extends React.Component {
  render() {
    let {
      info,
      defaultDict,
      searchActualQ,
      searchDicts,
      words,
      wordIds,
      nextPageMarker,
      loadingMore,
      onLoadMore,
      parserShow,
      rootPath,
    } = this.props;
    let { keyword, pagination, prev, next } = info;
    let keywordExcerpt =
      keyword && keyword.length > KEYWORD_EXCERPT_LENGTH
        ? keyword.slice(0, KEYWORD_EXCERPT_LENGTH) + "..."
        : keyword;

    return (
      <div className="words-navi">
        {!!pagination && (
          <div className="navi-pagination">
            <h3>{pagination}</h3>
            <ul className="pagination">
              {!!prev && (
                <li>
                  <a href={prev.href}>←{prev.title}</a>
                </li>
              )}
              {!!next && (
                <li>
                  <a href={next.href}>{next.title}→</a>
                </li>
              )}
            </ul>
          </div>
        )}
        {Array.isArray(words[0]) ? (
          <div className="navi-multi-dicts">
            {searchDicts.map((searchDict, i) => (
              <WordsList
                key={i}
                {...this.props}
                words={words[i]}
                wordIds={wordIds[i]}
                searchDict={searchDict}
              />
            ))}
          </div>
        ) : (
          <WordsList {...this.props} />
        )}
        {!!keyword && (
          <div className="navi-tools">
            <h3>ツール</h3>
            <ul>
              {!!nextPageMarker && (
                <li className="needjs">
                  {loadingMore ? (
                    <span>→ もっと読み込み中...</span>
                  ) : (
                    <a
                      onClick={onLoadMore}
                      title={`「${keywordExcerpt}」を検索結果をもっと読み込む`}
                    >
                      → もっと読み込む
                    </a>
                  )}
                </li>
              )}
              {keyword !== searchActualQ && (
                <li>
                  <a
                    href={`${this.props.rootPath}${getCanonicalUrlSearch({
                      dict: defaultDict,
                      q: keyword,
                    })}`}
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      this.props.onDirectRequest({
                        dict: defaultDict,
                        q: keyword,
                      });
                    }}
                  >
                    →「{keywordExcerpt}」を検索
                  </a>
                </li>
              )}
              <li className="needjs">
                <a
                  role="button"
                  title="[alt-shift-g]"
                  accessKey="g"
                  onClick={(e) => this.props.netquery(keyword, 1)}
                >
                  →「{keywordExcerpt}」のネット上の解釈
                </a>
              </li>
              {!!this.props.furiganaEnable && (
                <li className="needjs">
                  <a
                    role="button"
                    title="[alt-shift-o]"
                    accessKey="o"
                    onClick={(e) => this.props.analyze(keyword, 1)}
                  >
                    →「{keywordExcerpt}」の日本語形態素
                  </a>
                </li>
              )}
              <li className="needjs">
                <a
                  role="button"
                  title="[alt-shift-z]"
                  accessKey="z"
                  onClick={(e) => this.props.openDraw(keyword, 1)}
                >
                  →「{keywordExcerpt}」の漢字情報・筆順
                </a>
              </li>
              <li className="needjs">
                <a
                  role="button"
                  title="[alt-shift-.]"
                  accessKey=">"
                  onClick={parserShow}
                >
                  → 日本語分析・翻訳・ほか
                </a>
              </li>
            </ul>
          </div>
        )}
        {!!keyword && (
          <div className="navi-external">
            <h3>外部サイトで「{keywordExcerpt}」を検索</h3>
            <ExternalSearchLinks rootPath={rootPath} keyword={keyword} />
          </div>
        )}
      </div>
    );
  }
}

function WordsList({ words, searchDict, rootPath, goToWord, wordIds }) {
  return (
    <div className="nav-words">
      {words.length ? (
        <h3>
          {searchDict} ({words.length})
        </h3>
      ) : null}
      {!!words.length && (
        <ul>
          {words.map((word, i) => (
            <li key={wordIds[i]}>
              <a
                href={"#" + wordIds[i]}
                onClick={goToWord}
                dangerouslySetInnerHTML={{
                  __html: ebtext2html(word.heading, rootPath, searchDict),
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
