import React, { PureComponent } from "react";
import { getCanonicalUrlSearch, formatTime, debounce } from "../functions";

export default class History extends PureComponent {
  constructor(props) {
    super(props);
    this.query = debounce(this.query.bind(this), 500);
  }
  componentDidMount() {
    this.props.historyQuery({ initial: true });
  }
  query(q) {
    q != this.props.history.queryQ && this.props.historyQuery({ q });
  }
  render() {
    let {
      userConfig: {
        historyLp,
        historyLpRequireModifierKey,
        googleTokens,
        debugSync,
      },
      config: { ROOTPATH },
      metaValues,
      googleSync,
      history: { records, q, queryQ, queryLoading },
      historyQ,
      historyRefresh,
    } = this.props;
    historyLp = !!historyLp;
    historyLpRequireModifierKey = !!historyLpRequireModifierKey;
    let synced =
      metaValues.notSyncedNoteCnt == 0 &&
      metaValues.notSyncedDeletedNoteCnt == 0;
    return (
      <article className="single-dict">
        <h3 className="flex-spread flex-align-start">
          <span className="flex-2">使用履歴 ({records.length})</span>
          <input
            className="flex-2 no-min-width"
            placeholder="検索"
            type="search"
            value={q}
            onChange={(e) => {
              let q = e.target.value;
              historyQ(q);
              this.query(q);
            }}
          />
          <span className="flex-3 align-right">
            {!!googleTokens && (
              <span>
                <a
                  role="button"
                  onClick={async (e) => {
                    await googleSync({ force: 1, fromHistory: true });
                  }}
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
                >
                  <span className="emoji">☁️</span>
                </a>
              </span>
            )}
            <a
              role="button"
              className={`${queryLoading ? "loading " : ""}last`}
              title={queryLoading ? "更新中..." : "更新"}
              onClick={historyRefresh}
            >
              <span className="emoji">🔃</span>
            </a>
          </span>
        </h3>
        {records.length == 0 &&
          (queryQ ? (
            <p className="msg">該当する使用履歴がありません。</p>
          ) : (
            <p className="msg">
              検索・使用履歴は自動的にここに現れます。
              データは今使用している端末のみに保存され、
              当サイトのサーバーに送信されることはありません。
              <span>
                &nbsp;(Googleアカウントで&nbsp;
                <a role="button" href={`${ROOTPATH}cloud/`}>
                  <span className="emoji icon" title="ログイン(クラウド機能)">
                    ☁️
                  </span>
                  ログイン
                </a>
                すると、 最近の使用履歴は自動的に他のデバイスと同期します。)
              </span>
            </p>
          ))}
        <div className="dict-content history-records">
          {records.map(
            ({
              text,
              id,
              time,
              keyword,
              dict,
              q,
              type,
              page,
              offset,
              status,
            }) => {
              return (
                <div key={id} className="history-entry">
                  <div className="history-entry-time">
                    {time ? formatTime(time, { noseconds: true }) : "-"}
                  </div>
                  <div className="history-entry-main">
                    <a
                      data-nolp={+!historyLp}
                      data-lp={+historyLp}
                      data-lp-rmk={+historyLpRequireModifierKey}
                      data-hid={id}
                      href={`${ROOTPATH}${getCanonicalUrlSearch({
                        dict,
                        q,
                        type,
                        page,
                        offset,
                      })}`}
                    >
                      {text}
                    </a>
                    {!!debugSync && (
                      <span
                        className="history-status"
                        title="履歴記録の同期状態(0 = created; 1 = synced)"
                      >
                        &nbsp;(Status: {status})
                      </span>
                    )}
                  </div>
                </div>
              );
            }
          )}
        </div>
      </article>
    );
  }
}
