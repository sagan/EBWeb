UserConfigSystemRedesign
2022-11-16

## Goals

* Allow multiple user config "profiles" and quick switch between them.
* User config profiles are also synced.
* Improve reliability and robustness of User Config sync mechanism

## User Config Storage

dexie.js "userconfig" collection:

index: profile,time,status (profile as id)

fields:

* profile: default, 0,1,2
* time: latest modification timestamp
* status: 0 - local; 1 - synced.
* data : (full) userConfigData
* localChangedKeys : localOnly (not synced) userConfig changeed keys: ["sitename"].
  * specify "*" as all keys change, use with a {} or null data.

meta

* userConfigProfile : current using profile name. DO NOT SYNC.
* userConfigSyncDataTime : local userconfig last sync data.

App Initial load:
- load userconfig profile+0 data into config
- check and sync all userconfig profiles with localStorage using $$hash:
  *  userConfig_[profile], userConfigProfile, userConfigProfiles
- load into window.__USERCONFIG__, __USERCONFIG_PROFILE__, __USERCONFIG_PROFILES__

Local Update: {sitename: "aa"}
- indexDb userconfig rw transaction: update userconfig profile

Sync local => cloud:
- upload userconfig status = 0 profiles

sync <= cloud:
- fetch all > userConfigSyncDataTime data records
- apply iteratively to local (could apply localChangedKeys only)

  



  








