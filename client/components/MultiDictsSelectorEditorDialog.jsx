import React, { useEffect, useState } from "react";
import { multiDictsString2Array } from "../functions";
import { _c, _d } from "../userConfig.js";

export default function MultiDictsSelectorEditorDialog({
  close,
  dict,
  dicts,
  multiShortcuts,
  userConfig,
  updateUserConfig,
}) {
  const [newShortcut, setNewShortcut] = useState([
    "",
    multiDictsString2Array(dict, 3),
    "",
    "",
    "",
  ]);
  const [multiDictsShortcuts, setMultiDictsShortcuts] = useState([]);
  useEffect(() => {
    let multiDictsShortcuts = [];
    if (_d("multiDictsShortcuts")) {
      try {
        multiDictsShortcuts = JSON.parse(_d("multiDictsShortcuts"));
      } catch (e) {}
      if (!Array.isArray(multiDictsShortcuts)) {
        multiDictsShortcuts = [];
      }
    }
    setMultiDictsShortcuts(multiDictsShortcuts);
  }, [userConfig.multiDictsShortcuts]);
  return (
    <div className="multi-dicts-selector-editor dialog">
      <h3>
        <span>一括検索・ショートカット設定 (* 変更は自動保存)</span>
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
      <h4>カスタマイズショートカット</h4>
      {multiDictsShortcuts.length == 0 && <i>ショートカットがありません</i>}
      <div className="multi-dicts-selector-editor-shortcuts">
        {multiDictsShortcuts.map((short, i) => (
          <div className="multi-dicts-selector-editor-shortcut" key={i}>
            <label className="multi-dicts-selector-editor-name">
              <input
                type="text"
                name="name"
                value={short[0]}
                placeholder="名"
                onChange={(e) => {
                  multiDictsShortcuts[i][0] = e.target.value;
                  saveConfig(multiDictsShortcuts);
                }}
              />
            </label>
            <label className="multi-dicts-selector-editor-shortcut-dicts">
              辞書:&nbsp;
              {short[1].map((dict, j) => (
                <select
                  key={j}
                  name={`multi-dicts-selector-editor-shortcut-${i}`}
                  value={dict || "_"}
                  onChange={(e) => {
                    let value = e.target.value;
                    if (value == "_") {
                      value = "";
                    }
                    multiDictsShortcuts[i][1][j] = value;
                    saveConfig(multiDictsShortcuts);
                  }}
                >
                  <option key="_" value="_">
                    - (非使用)
                  </option>
                  {dicts.map((dict) => (
                    <option key={dict} value={dict}>
                      {dict}
                    </option>
                  ))}
                </select>
              ))}
            </label>
            <label className="multi-dicts-selector-editor-desc">
              <input
                type="text"
                name="desc"
                value={short[2]}
                placeholder="説明"
                onChange={(e) => {
                  multiDictsShortcuts[i][2] = e.target.value;
                  saveConfig(multiDictsShortcuts);
                }}
              />
            </label>
            <label className="multi-dicts-selector-editor-type">
              <select
                value={short[3] == null || short[3] === "" ? "_" : short[3]}
                onChange={(e) => {
                  let value = e.target.value;
                  if (value == "_") {
                    value = "";
                  } else {
                    value = parseInt(value);
                  }
                  multiDictsShortcuts[i][3] = value;
                  saveConfig(multiDictsShortcuts);
                }}
              >
                <option value="_">検索タイプ</option>
                <option value="0">前方一致</option>
                <option value="1">後方一致</option>
                <option value="2">完全一致</option>
              </select>
            </label>
            <label className="multi-dicts-selector-editor-romaji">
              <select
                value={short[4] == null || short[4] === "" ? "_" : short[4]}
                onChange={(e) => {
                  let value = e.target.value;
                  if (value == "_") {
                    value = "";
                  } else {
                    value = parseInt(value);
                  }
                  multiDictsShortcuts[i][4] = value;
                  saveConfig(multiDictsShortcuts);
                }}
              >
                <option value="_">ローマ字</option>
                <option value="1">変換有効</option>
                <option value="0">変換無効</option>
              </select>
            </label>
            <button
              type="button"
              onClick={(e) => {
                multiDictsShortcuts.splice(i, 1);
                saveConfig(multiDictsShortcuts);
              }}
            >
              削除
            </button>
            <button
              type="button emoji"
              title="先頭に移動"
              disabled={i == 0 || multiDictsShortcuts.length < 2}
              onClick={(e) => {
                multiDictsShortcuts.splice(
                  0,
                  0,
                  ...multiDictsShortcuts.splice(i, 1)
                );
                saveConfig(multiDictsShortcuts);
              }}
            >
              ⇈
            </button>
            <button
              type="button emoji"
              title="上に移動"
              disabled={i == 0 || multiDictsShortcuts.length < 2}
              onClick={(e) => {
                multiDictsShortcuts.splice(
                  i - 1,
                  0,
                  ...multiDictsShortcuts.splice(i, 1)
                );
                saveConfig(multiDictsShortcuts);
              }}
            >
              ↑
            </button>
            <button
              type="button emoji"
              title="下に移動"
              disabled={
                i == multiDictsShortcuts.length - 1 ||
                multiDictsShortcuts.length < 2
              }
              onClick={(e) => {
                multiDictsShortcuts.splice(
                  i,
                  0,
                  ...multiDictsShortcuts.splice(i + 1, 1)
                );
                saveConfig(multiDictsShortcuts);
              }}
            >
              ↓
            </button>
            <button
              type="button emoji"
              title="末尾に移動"
              disabled={
                i == multiDictsShortcuts.length - 1 ||
                multiDictsShortcuts.length < 2
              }
              onClick={(e) => {
                multiDictsShortcuts.splice(
                  multiDictsShortcuts.length - 1,
                  0,
                  ...multiDictsShortcuts.splice(i, 1)
                );
                saveConfig(multiDictsShortcuts);
              }}
            >
              ⇊
            </button>
          </div>
        ))}
      </div>
      <h4>新規ショートカット</h4>
      <div className="multi-dicts-selector-editor-new">
        <label className="multi-dicts-selector-editor-name">
          <input
            type="text"
            name="name"
            placeholder="名(必要)"
            onChange={(e) => {
              newShortcut[0] = e.target.value;
              saveNewShortcut(newShortcut);
            }}
          />
        </label>
        <label className="multi-dicts-selector-editor-shortcut-dicts">
          辞書:&nbsp;
          {newShortcut[1].map((dict, i) => (
            <select
              key={i}
              name={`multi-dicts-selector-shortcut-new-${i}`}
              value={dict || "_"}
              onChange={(e) => {
                let value = e.target.value;
                if (value == "_") {
                  value = "";
                }
                newShortcut[1][i] = value;
                saveNewShortcut(newShortcut);
              }}
            >
              <option key="_" value="_">
                - (非使用)
              </option>
              {dicts.map((dict) => (
                <option key={dict} value={dict}>
                  {dict}
                </option>
              ))}
            </select>
          ))}
        </label>
        <label className="multi-dicts-selector-editor-desc">
          <input
            type="text"
            name="desc"
            placeholder="説明"
            onChange={(e) => {
              newShortcut[2] = e.target.value;
              saveNewShortcut(newShortcut);
            }}
          />
        </label>
        <button
          type="button"
          disabled={!newShortcut[0] || newShortcut[1].every((s) => !s)}
          onClick={(e) => {
            multiDictsShortcuts.push(newShortcut);
            saveConfig(multiDictsShortcuts);
            setNewShortcut(["", ["", "", ""], "", "", ""]);
          }}
        >
          追加
        </button>
      </div>
      <h4>ほかの設定</h4>
      <p>
        <label role="button">
          <input
            type="checkbox"
            checked={!!_d("multiDictsShortcutsHideDefault")}
            onClick={(e) =>
              updateUserConfig({
                multiDictsShortcutsHideDefault: +!_d(
                  "multiDictsShortcutsHideDefault"
                ),
              })
            }
          />
          &nbsp;デフォルトショートカットを非表示にする
        </label>
      </p>
      <p className="padding-bottom">
        <button
          type="button"
          onClick={(e) => {
            if (
              !confirm(
                "カスタマイズショートカットを初期化しようとしています、よろしいですか？"
              )
            ) {
              return;
            }
            saveConfig([]);
          }}
        >
          ショートカット初期化
        </button>
        <button
          onClick={(e) => {
            saveConfig(
              multiDictsShortcuts
                .concat(
                  multiShortcuts.map((shortcut) => {
                    shortcut = shortcut.slice();
                    shortcut[1] = shortcut[1].split("_");
                    return shortcut;
                  })
                )
                .filter((s, i, arr) => arr.findIndex((a) => a[0] == s[0]) == i)
            );
          }}
          disabled={!_d("multiDictsShortcutsHideDefault")}
        >
          デフォルトショートカットを追加
        </button>
      </p>
    </div>
  );

  function saveConfig(multiDictsShortcuts) {
    let str = JSON.stringify(multiDictsShortcuts);
    setMultiDictsShortcuts(JSON.parse(str));
    updateUserConfig({
      multiDictsShortcuts: str,
    });
  }

  function saveNewShortcut(newShortcut) {
    setNewShortcut(JSON.parse(JSON.stringify(newShortcut)));
  }
}
