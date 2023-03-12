import React, { PureComponent } from "react";
import { REGEX_ENGLISH_FULL } from "../language_functions";

export const externalSearchSites = [
  {
    name: "Google Japan",
    url: "https://www.google.co.jp/search?q=%s",
    icon: "google"
  },
  {
    name: "Google 画像",
    url: "https://www.google.co.jp/search?tbm=isch&q=%s",
    icon: "google"
  },
  {
    name: "Wikipedia (ja)",
    url: "https://ja.wikipedia.org/wiki/%s",
    icon: "wikipedia"
  },
  {
    name: "Wiktionary (ja)",
    url: "https://ja.wiktionary.org/wiki/%s",
    icon: "wiktionary"
  },
  {
    name: "Weblio辞書",
    url: "https://www.weblio.jp/content/%s",
    icon: "weblio"
  },
  {
    name: "goo国語辞書",
    url: "https://dictionary.goo.ne.jp/srch/jn/%s/m0u/",
    icon: "goo"
  },
  {
    name: "コトバンク",
    url: "https://kotobank.jp/gs/?q=%s",
    icon: "kotobank"
  },
  {
    name: "Jisho Dictionary",
    url: "https://jisho.org/search/%s",
    icon: "jisho"
  },
  {
    name: "ピクシブ百科事典",
    url: "https://dic.pixiv.net/a/%s",
    icon: "pixiv"
  },
  {
    name: "ニコニコ大百科",
    url: "http://dic.nicovideo.jp/s/al/t/%s/rev_created/desc/1-",
    icon: "nicovideo"
  },
  {
    name: "翻訳 (日↔英)",
    url: q =>
      `https://translate.google.com/?hl=ja#auto/${
        q.match(REGEX_ENGLISH_FULL) ? "ja" : "en"
      }/%s`,
    icon: "google_translate"
  }
];

export default class ExternalSearchLinks extends PureComponent {
  render() {
    let { keyword } = this.props;
    return (
      <ul className="external-search">
        {externalSearchSites.map((site, i) => {
          let icon =
            site.iconUrl ||
            (site.icon
              ? `${this.props.rootPath}icons/${site.icon}.png`
              : `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
                  new URL(site.url).hostname
                )}`);
          return (
            <li key={site.name}>
              <a
                className="external"
                rel="noopener noreferrer"
                aria-label={`${site.name}で「${keyword}」を検索`}
                href={(typeof site.url == "function"
                  ? site.url(keyword)
                  : site.url
                ).replace("%s", encodeURIComponent(keyword))}
              >
                <img src={icon} className="inline icon" />
                &nbsp;
                {site.name}
              </a>
            </li>
          );
        })}
      </ul>
    );
  }
}
 
