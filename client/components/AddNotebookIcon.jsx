import React from "react";
import { formatTime } from "../functions";

export default function AddNotebookIcon({
  note,
  word,
  dict,
  notebookEdit,
  notebookPut,
}) {
  return (
    <span
      role="button"
      className={`needjs emoji icon ${note ? "active" : "not-active"}`}
      title={
        note
          ? `単語帳に追加済み (${formatTime(note.time, { date: true })})`
          : "単語帳に追加"
      }
      onClick={(e) => {
        if (note) {
          notebookEdit({
            word,
            dict,
            note,
          });
        } else if (word) {
          notebookPut({
            dict,
            word,
          });
        }
      }}
    >
      ⭐
    </span>
  );
}
