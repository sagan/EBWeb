import React from "react";
import { _c } from "../userConfig.js";

const pages = [
  { id: "", name: "クラウド・同期" },
  { id: "manual", name: "同期機能説明" },
  { id: "privacy", name: "プライバシーポリシー" },
];

const debugPages = [{ id: "test", name: "Test & Debug" }];

export default function CloudSidebar({
  page,
  cloudPage,
  updateUserConfig,
  userConfig,
}) {
  return (
    <>
      <div className="cloud-pages">
        <h3>クラウド</h3>
        <ul>
          {pages.map(({ id, name }) => (
            <li key={id}>
              {page != id ? (
                <a onClick={(e) => cloudPage(id)}>{name}</a>
              ) : (
                <span className="active">{name}</span>
              )}
            </li>
          ))}
          {!!_c("debugSync") &&
            debugPages.map(({ id, name }) => (
              <li key={id}>
                {page != id ? (
                  <a onClick={(e) => cloudPage(id)}>{name}</a>
                ) : (
                  <span className="active">{name}</span>
                )}
              </li>
            ))}
        </ul>
      </div>
      <div className="cloud-config">
        <h3>設定</h3>
        <div>
          <label role="button" title="Print debug output to browser console.">
            <input
              type="checkbox"
              checked={!!_c("debugSync")}
              onClick={(e) =>
                updateUserConfig({ debugSync: +!_c("debugSync") })
              }
            />
            &nbsp;Enable debug
          </label>
        </div>
        {!!_c("debugSync") && (
          <div>
            <label
              role="button"
              title="Make sync API return additional info for debug."
            >
              <input
                type="checkbox"
                checked={!!_c("debugSyncApi")}
                onClick={(e) =>
                  updateUserConfig({ debugSyncApi: +!_c("debugSyncApi") })
                }
              />
              &nbsp;Debug sync API
            </label>
          </div>
        )}
      </div>
    </>
  );
}
