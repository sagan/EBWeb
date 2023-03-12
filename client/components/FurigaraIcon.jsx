import React from "react";
import { _c } from "../userConfig.js";

export default function FurigaraIcon({
  userConfig,
  word,
  dict,
  lp = 0,
  toggleFurigana,
}) {
  let furiganaTip = _c("furiganaMode")
    ? "漢字に振り仮名を付け、日本語形態素を解析する"
    : "漢字に振り仮名を付ける";
  return (
    <span
      aria-label={furiganaTip}
      title={
        word.furiganaStatus == 1 ? "振り仮名を付けている中..." : furiganaTip
      }
      role="button"
      className={`furigana-status-${word.furiganaStatus || 0} needjs`}
      aria-pressed={word.furiganaStatus == 1 ? "true" : "false"}
      onClick={(e) => toggleFurigana(word, dict, lp)}
    >
      振{word.furiganaStatus == 1 ? "..." : ""}
    </span>
  );
}
