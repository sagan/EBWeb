import React from "react";

export default function HomeNavi({ config: { HOME_HTML }, parserShow }) {
  return (
    <>
      <div id="home_html" dangerouslySetInnerHTML={{ __html: HOME_HTML }} />
      <div className="needjs">
        <h3>ツール</h3>
        <ul>
          <li>
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
    </>
  );
}
