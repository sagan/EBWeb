import React, { PureComponent } from "react";
import { getCanonicalUrlSearch, getQueryRomaji } from "../functions";
import { wordTypes } from "../language_functions";

export default class AnalyzeResult extends PureComponent {
  render() {
    let {
      analyzeResult,
      rootPath,
      dict,
      romaji,
      active,
      showMore,
      toggleShowMore,
    } = this.props;
    let showMoreTip = showMore ? "詳細を表示しない" : "詳細を表示する";
    return (
      <>
        <p>
          {analyzeResult.map((word, i) => {
            let type = wordTypes[word[3]] || 0;
            let isActive = active == word[2];
            return type ? (
              <a
                key={i}
                href={`${this.props.rootPath}${getCanonicalUrlSearch({
                  dict,
                  romaji: getQueryRomaji(word[2], romaji),
                  type: 2,
                  q: word[2],
                })}`}
                data-nolp={isActive ? 1 : 0}
                className={`analyze-word analyze-word-${type} ${
                  isActive ? "active" : ""
                }`}
                data-word={word[2]}
                data-word-type={word[3]}
                data-word-reading={word[1]}
                title={`${word[2]} (${word[3]})`}
              >
                {word[0] != word[1] ? (
                  <ruby>
                    {word[0]}
                    <rp>(</rp>
                    <rt>{word[1]}</rt>
                    <rp>)</rp>
                  </ruby>
                ) : (
                  word[0]
                )}
              </a>
            ) : (
              <span
                key={i}
                className={`analyze-word analyze-word-${type} ${
                  isActive ? "active" : ""
                }`}
              >
                {word[0]}
              </span>
            );
          })}
          <span
            className="emoji"
            role="button"
            title={showMoreTip}
            aria-label={showMoreTip}
            onClick={toggleShowMore}
          >
            {showMore ? "⇈" : "⇊"}
          </span>
        </p>
        {!!showMore && (
          <table>
            <thead>
              <tr>
                <th>単語</th>
                <th>読み方</th>
                <th>品詞</th>
                <th>基本形</th>
                <th>備考</th>
              </tr>
            </thead>
            <tbody>
              {analyzeResult.map((word, i) => (
                <tr key={i}>
                  <td>{word[0]}</td>
                  <td>{word[1] != word[0] ? word[1] : ""}</td>
                  <td>{word[3]}</td>
                  <td>{word[2] != word[0] ? word[2] : "―"}</td>
                  <td>
                    {word[4]}, {word[5]}, {word[6]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </>
    );
  }
}
