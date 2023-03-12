import React from "react";
import { toastr } from "react-redux-toastr";
import { CopyToClipboard } from "react-copy-to-clipboard";
import {
  eb2textclean,
  parseEbTitle,
  getCanonicalUrlSearch,
} from "../functions";
import { browserPlaySpeech } from "../dom";
import ExternalSearchLinks from "./ExternalSearchLinks.jsx";
const classNames = require("classnames");

const shares = [
  {
    url: "https://twitter.com/share?text={text}&url={url}",
    title: "Twitterで共有",
  },
  {
    url: "https://telegram.me/share/url?url={url}&text={text}",
    title: "Telegramで共有",
  },
  {
    url: "http://line.me/R/msg/text/?{text}",
    title: "LINEで送る",
  },
];

// will only render on client

export default class WordShareDialog extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      copied: 0,
      changed: false,
      speaking: null,
      text: eb2textclean(props.word.text),
    };
    this.speakText = this.speakText.bind(this);
    this.endSpeak = this.endSpeak.bind(this);
  }
  render() {
    let { word, close, rootPath, publicUrl, searchDict, dict, defaultDict } =
      this.props;
    let { keyword, text: title } = parseEbTitle(word.heading);
    let url = `${publicUrl}${rootPath}${getCanonicalUrlSearch({
      dict: searchDict,
      page: word.page,
      offset: word.offset,
    })}`;
    return (
      <div className="share-dialog dialog">
        <h3>
          {`「${title}」の辞典内容を共有する`}
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
        <p className="actions">
          <CopyToClipboard
            text={this.state.text}
            onCopy={() => this.setState({ copied: 1 })}
          >
            <button disabled={this.state.copied == 1}>
              {this.state.copied == 1 ? "✓コピーした" : "TXTをコピー"}
            </button>
          </CopyToClipboard>
          <CopyToClipboard
            text={url}
            onCopy={() => this.setState({ copied: 2 })}
          >
            <button disabled={this.state.copied == 2}>
              {this.state.copied == 2 ? "✓コピーした" : "リンクをコピー"}
            </button>
          </CopyToClipboard>
          <button
            disabled={!this.state.changed}
            onClick={(e) =>
              this.setState({
                changed: false,
                copied: 0,
                text: eb2textclean(word.text),
              })
            }
          >
            リセット
          </button>
          {shares.map((share) => (
            <button
              onClick={(e) => {
                window.open(
                  share.url
                    .replace("{url}", encodeURIComponent(url))
                    .replace(
                      "{text}",
                      encodeURIComponent(this.state.text.slice(0, 300))
                    )
                );
              }}
            >
              {share.title}
            </button>
          ))}
          <button
            disabled={!window.navigator.share}
            title={
              !window.navigator.share
                ? "ご使用している端末は共有メニュー機能を対応していません"
                : ""
            }
            onClick={(e) =>
              window.navigator.share({
                title,
                text: this.state.text,
                //url,
              })
            }
          >
            端末の共有メニュー
          </button>
          <button
            disabled={!window.speechSynthesis}
            onClick={this.state.speaking ? this.endSpeak : this.speakText}
            title={
              !window.speechSynthesis
                ? "ご使用している端末は朗読機能を対応していません"
                : ""
            }
          >
            {this.state.speaking ? (
              <span>
                <span className="emoji">🔊</span> 朗読中...(停止にはクリック)
              </span>
            ) : (
              <span>
                <span className="emoji">🔉</span> 辞典内容を朗読する
              </span>
            )}
          </button>
        </p>
        <textarea
          style={{ width: "100%" }}
          rows="5"
          value={this.state.text}
          onChange={(e) =>
            this.setState({
              text: e.target.value,
              copied: 0,
              changed: true,
            })
          }
        />
        <h3>外部サイトで「{keyword}」を検索</h3>
        <ExternalSearchLinks rootPath={this.props.rootPath} keyword={keyword} />
        <h3>ツール</h3>
        <ul className="tool">
          <li>
            <a
              data-nolp="1"
              href={`${rootPath}${getCanonicalUrlSearch({
                dict: defaultDict,
                q: keyword,
              })}`}
            >
              →「{keyword}」を検索
            </a>
          </li>
        </ul>
      </div>
    );
  }

  speakText() {
    let speaking = browserPlaySpeech(this.state.text);
    speaking.addEventListener("end", this.endSpeak);
    speaking.addEventListener("error", () => {
      toastr.error("朗読失敗", `今は朗読できません`);
      this.endSpeak();
    });
    this.setState({ speaking });
  }

  endSpeak() {
    if (this.state.speaking) {
      window.speechSynthesis.cancel();
      this.setState({ speaking: null });
    }
  }

  componentWillUnmount() {
    this.endSpeak();
  }
}
