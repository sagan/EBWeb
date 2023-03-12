import React from "react";
import { wordGlobalId, cancelEvent } from "../functions";

export default function PlaySoundIcon({
  word,
  wordId,
  dict,
  playing,
  playSound,
  playingSoundWordId
}) {
  wordId = wordId || wordGlobalId(word, dict);
  playing = playing && playingSoundWordId == wordId;
  return (
    <span
      title="単語の音声を再生する"
      aria-label="単語の音声を再生する"
      role="button"
      aria-pressed={playing ? "true" : "false"}
      className="word-sound emoji needjs"
      onClick={(e) => {
        cancelEvent(e);
        playSound(word, dict);
      }}
    >
      {playing ? "🔊" : "🔉"}
    </span>
  );
}
