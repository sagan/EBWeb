import React, { useState } from "react";
import { Popover } from "react-tiny-popover";
import UserConfigProfiles from "./UserConfigProfiles.jsx";

export default function UserConfigProfileSelector({
  userConfigProfile,
  userConfigProfiles,
  setUserConfigProfile,
}) {
  let [open, setOpen] = useState(false);
  return (
    <span>
      <Popover
        positions={["bottom", "top"]}
        content={
          open ? (
            <div className="userconfig-profile-selector">
              <p className="profiles">
                <UserConfigProfiles
                  userConfigProfile={userConfigProfile}
                  userConfigProfiles={userConfigProfiles}
                  setUserConfigProfile={setUserConfigProfile}
                />
              </p>
              <p className="center">設定プロフィール</p>
            </div>
          ) : null
        }
        isOpen={open}
        onClickOutside={(e) => setOpen(false)}
      >
        <a
          className="userconfig-profile-selector-btn needjs"
          onClick={(e) => setOpen(!open)}
        >
          <span className="emoji icon" title="設定プロフィールを変更">
            {userConfigProfile[0].toUpperCase()}
          </span>
          <script
            dangerouslySetInnerHTML={{
              __html: `<!--//--><![CDATA[//><!--
(function() {
  var profile = window.__USERCONFIG_PROFILE__;
  if( profile != "default" ) {
    var context = document.currentScript ? document.currentScript.parentNode.parentNode : document;
    var els = context.querySelectorAll('.userconfig-profile-selector-btn span');
    for(var i = 0; i < els.length; i++) {
      els[i].innerHTML = profile[0].toUpperCase();
    }
  }
  document.body.dataset.ilUcps = 0;
})()
//--><!]]>`,
            }}
          />
        </a>
      </Popover>
    </span>
  );
}
