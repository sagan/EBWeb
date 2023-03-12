import React from "react";

export default function UserConfigProfiles({
  userConfigProfile,
  userConfigProfiles,
  setUserConfigProfile,
}) {
  return (
    <>
      {userConfigProfiles.map((profile, i) => (
        <>
          <span
            key={profile}
            className={`${userConfigProfile == profile ? "active" : ""}`}
            role="button"
            onClick={async (e) => {
              if (userConfigProfile == profile) {
                return;
              }
              await setUserConfigProfile(profile);
            }}
          >
            {profile}
          </span>
          {i != userConfigProfiles.length - 1 && <span> | </span>}
        </>
      ))}
    </>
  );
}
