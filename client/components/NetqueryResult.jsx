import React, { PureComponent } from "react";
import { getCanonicalUrlSearch } from "../functions";

import { netquery_sources } from "../netquery";

export default class NetqueryResult extends PureComponent {
  render() {
    let {
      netquery,
      netqueryResult,
      netqueryError,
      netquerySourceIndex,
      netqueryStatus,
      netqueryQ,
      netqueryPin,
      rootPath,
      searchDict,
      closeNetquery,
      netqueryTogglePin,
      netqueryChangeSource,
    } = this.props;

    let result = netqueryResult[netquerySourceIndex];
    let source = netquery_sources[netquerySourceIndex];

    let msg = null;
    if (netqueryStatus == 1) {
      msg = (
        <p>
          「{netqueryQ}
          」の
          {source.name}
          での解釈を読み込み中...
        </p>
      );
    } else if (netqueryStatus == 4) {
      msg = (
        <p>
          「{netqueryQ}
          」の
          {source.name}
          での解釈を表示できません。（Error:&nbsp;
          {(netqueryError || "Unknown").toString()}）<br />
          <a role="button" onClick={(e) => netquery(netqueryQ)}>
            もう一度試す
          </a>
        </p>
      );
    } else if (!result) {
      msg = <p>何も見つかりません。</p>;
    }

    return (
      <>
        <p className="msg">
          <span>
            ↓「
            <a
              className="netquery-input"
              href={`${rootPath}${getCanonicalUrlSearch({
                dict: searchDict,
                romaji: 0,
                type: 0,
                q: netqueryQ,
              })}`}
            >
              {netqueryQ}
            </a>
            」のインターネット上の解釈&nbsp;-&nbsp;
            {source.url ? (
              <a
                className="external"
                rel="noopener noreferrer"
                title="情報提供元"
                href={source.url.replace("%s", encodeURIComponent(netqueryQ))}
              >
                {source.name}
              </a>
            ) : (
              <span>{source.name}</span>
            )}
            ：
          </span>
          <span className="right">
            {netquery_sources.map((source, i) => (
              <a
                key={source.name}
                title={`${source.name}`}
                className={`icon ${
                  i != netquerySourceIndex ? "not-active" : "active"
                }`}
                role="button"
                onClick={(e) => netqueryChangeSource(i)}
              >
                <img
                  className="inline"
                  src={`${rootPath}icons/${source.icon}.png`}
                />
              </a>
            ))}
            <span
              role="button"
              className={`icon emoji ${
                netqueryPin == 1 ? "active" : "not-active"
              }`}
              title="常にインターネット上の解釈を表示する"
              aria-label="常にインターネット上の解釈を表示する"
              onClick={netqueryTogglePin}
            >
              📌
            </span>
            <span
              role="button"
              accessKey="x"
              className="last"
              title="閉める [alt-shift-x]"
              aria-label="インターネット上の解釈を閉める"
              onClick={closeNetquery}
            >
              &times;
            </span>
          </span>
        </p>
        {msg || (
          <>
            <h3>
              {result.url ? (
                <a
                  className="external"
                  rel="noopener noreferrer"
                  href={result.url}
                >
                  {result.title}
                </a>
              ) : (
                <span>{result.title}</span>
              )}
              {!!result.source && (
                <sub className="netquery-source">
                  ({result.source}
                  より)
                </sub>
              )}
            </h3>
            <div
              className="netquery-content"
              style={{
                minHeight: result.image ? result.imageHeight + 10 : "unset",
              }}
            >
              {!!result.image && (
                <div className="netquery-content-thumb">
                  <img
                    src={result.image}
                    width={result.imageWidth}
                    height={result.imageHeight}
                    className="right"
                  />
                </div>
              )}
              <div
                className="netquery-content-html"
                dangerouslySetInnerHTML={{
                  __html: result.html,
                }}
              />
            </div>
          </>
        )}
      </>
    );
  }
}
