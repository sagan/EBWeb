import React, { useState, useEffect } from "react";
import Autosuggest from "../../libs/react-autosuggest";
import db from "../db.js";
import {
  getCanonicalUrlSearch,
  getWordNote,
  cancelEvent,
  formatTime,
} from "../functions";

export default function NoteDialog({
  ROOTPATH,
  lp,
  metaValues,
  notebookDelete,
  notebookUpdate,
  notebookEditEnd,
  note,
  word,
  error,
  dict,
}) {
  let [values, setValues] = useState({});
  let [original, setOriginal] = useState({ ...note });
  let wordNote = word ? getWordNote({ word, dict }) : null;
  let [tags, setTags] = useState([]);
  let [hintTags, setHintTags] = useState([]);
  let [tag, setTag] = useState("");

  useEffect(() => {
    db.tag.orderBy("time").reverse().limit(10).toArray(setTags);
  }, []);

  return (
    <div className="note-dialog dialog">
      <div className="flex-spread">
        <h3>
          {note.id
            ? `ノートを編集する (日付: ${
                note.time ? formatTime(note.time) : "-"
              })`
            : "ノートを作成する"}
          {!!note.dictid && (
            <span>
              &nbsp;(単語の元:&nbsp;
              <a
                data-lp={+lp}
                data-nolp={+!lp}
                href={`${ROOTPATH}${getCanonicalUrlSearch({
                  dictid: note.dictid,
                })}`}
              >
                {dict}
              </a>
              )
            </span>
          )}
        </h3>
        <span>
          {(!!original.title || !!original.content) && (
            <button
              onClick={async (e) => {
                await notebookUpdate({
                  id: note.id,
                  title: original.title,
                  content: original.content,
                });
              }}
              disabled={
                note.title === original.title &&
                note.content === original.content
              }
              title="ノートのタイトルと内容をリセット"
            >
              リセット
            </button>
          )}
          {!!note.id && (
            <button
              onClick={async (e) => {
                if (
                  (note.comment ||
                    !wordNote ||
                    note.title != wordNote.title ||
                    note.content != wordNote.content) &&
                  !confirm(`このノートを削除しようとする、確認しますか？`)
                ) {
                  return;
                }
                await notebookDelete({ id: note.id });
                notebookEditEnd();
              }}
              title="ノートを削除する"
              className="danger"
            >
              削除
            </button>
          )}
          <span
            role="button"
            className="last"
            onClick={notebookEditEnd}
            aria-label="ダイアログを閉める"
          >
            &times;
          </span>
        </span>
      </div>
      <div>
        <p>
          <label>
            <span>タイトル: </span>
            <input
              name="title"
              type="text"
              placeholder="未命名ノート"
              value={values.title ?? (note.title || "")}
              onChange={onChange}
              onBlur={onBlur}
            />
          </label>
        </p>
        <p>
          <label>
            <span>コンテンツ: </span>
            <textarea
              name="content"
              placeholder="ノートのコンテンツ"
              value={values.content ?? (note.content || "")}
              cols="30"
              rows="5"
              onChange={onChange}
              onBlur={onBlur}
            />
          </label>
        </p>
        <p>
          <label>
            <span>コメント: </span>
            <textarea
              name="comment"
              placeholder="ノートのコメント"
              value={values.comment ?? (note.comment || "")}
              cols="30"
              rows="3"
              onChange={onChange}
              onBlur={onBlur}
            />
          </label>
        </p>
        <p>
          <label>タグ:&nbsp;</label>
          {(note.tag || []).map((tag, i, tags) => (
            <span key={i}>
              <span className="note-tag">
                <span className="emoji">🏷️</span>
                &nbsp;{tag}
                <span
                  role="button"
                  title="このタグを削除する"
                  className="note-tag-delete"
                  onClick={async () => {
                    await notebookUpdate({ id: note.id, deleteTag: tag });
                  }}
                >
                  X
                </span>
              </span>
              {i != tags.length - 1 && ", "}
            </span>
          ))}
        </p>
        <p className="note-add-tag">
          <form onSubmit={onSubmit}>
            <label>タグを追加:&nbsp;</label>
            <Autosuggest
              suggestions={hintTags}
              onSuggestionsFetchRequested={updateHintTags}
              onSuggestionsClearRequested={() => setHintTags([])}
              getSuggestionValue={(tag) => tag.name}
              focusInputOnSuggestionClick={false}
              renderSuggestion={(tag) => <div>{tag.name}</div>}
              onSuggestionSelected={onSuggestionSelected}
              onSuggestionHighlighted={onSuggestionHighlighted}
              inputProps={{
                ["aria-label"]: "タグを追加",
                name: "tag",
                type: "search",
                placeholder: "タグを追加",
                maxlength: 128,
                size: 10,
                value: tag,
                onChange: (e) => setTag(e.target.value),
              }}
            />
            <button type="submit">追加</button>
            <span>
              (<label>最近のタグを使用: </label>
              {tags.map((tag, i, tags) => (
                <span key={i}>
                  <a
                    role="button"
                    onClick={() => addTag(tag)}
                    className="note-tag"
                  >
                    <span className="emoji">🏷️</span>
                    &nbsp;{tag.name}
                  </a>
                  {i != tags.length - 1 && ", "}
                </span>
              ))}
              )
            </span>
          </form>
        </p>
        {!!error && <p className="error">{error}</p>}
      </div>
    </div>
  );

  async function onSubmit(e) {
    cancelEvent(e);
    addTag(tag, true);
  }

  async function onSuggestionSelected(e, { suggestion }) {
    if (suggestion) {
      addTag(suggestion.name, true);
    }
  }

  async function onSuggestionHighlighted({ suggestion, method }) {
    if (method != "mouse" && suggestion) {
      setTag(suggestion.name);
    }
  }

  async function addTag(tag, clear) {
    if (typeof tag == "object") {
      tag = tag.name;
    }
    if (tag && (note.tag || []).indexOf(tag) == -1) {
      await notebookUpdate({ id: note.id, addTag: tag });
      if (clear) {
        setTag("");
      }
    }
  }

  async function updateHintTags({ value }) {
    let tags = await db.tag
      .where("name")
      .startsWithIgnoreCase(value)
      .limit(10)
      .toArray();
    setHintTags(tags);
  }
  function onChange(e) {
    let newValues = { ...values };
    newValues[e.target.name] = e.target.value;
    setValues(newValues);
  }

  async function onBlur(e) {
    if (Object.keys(values).length) {
      await notebookUpdate({ id: note.id, ...values });
      setValues({});
    }
  }
}
