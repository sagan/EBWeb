import React, { useState, useRef, useEffect } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";

export default function ParserKanaKanji({ result }) {
  const wrapEl = useRef(null);
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    setText(
      result ? result.map(({ candidate }) => candidate[0] || "").join("") : ""
    );
    setCopied(false);
  }, [result]);

  if (!result) {
    return <div className="parser-result-content parser-kanakanji"></div>;
  }
  return (
    <div className="parser-result-content parser-kanakanji">
      <div ref={wrapEl}>
        {result.map(({ candidate }, i) => (
          <span key={i}>
            <select defaultValue={candidate[0] || ""} onChange={update}>
              {candidate.map((candidate, i) => (
                <option key={i} value={candidate}>
                  {candidate}
                </option>
              ))}
            </select>
          </span>
        ))}
      </div>
      <p>
        {text}
        {!!text && (
          <span>
            &nbsp;&nbsp;
            <CopyToClipboard text={text} onCopy={() => setCopied(true)}>
              <button type="button">
                {copied ? "✓コピーした" : "内容をコピー"}
              </button>
            </CopyToClipboard>
          </span>
        )}
      </p>
    </div>
  );

  function update() {
    setText(
      Array.from(wrapEl.current.querySelectorAll("select"))
        .map((el) => el.value)
        .join("")
    );
    setCopied(false);
  }
}
