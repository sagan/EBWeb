import { v4 as uuidv4 } from "uuid";
import { oldGetUserConfig } from "./client_functions";
import { ANKI_MODEL } from "./constants";
// import Dexie from "dexie"; // webpack bug require not defined
const Dexie = require("dexie/dist/dexie.js").default;
const {
  uniqueFilter,
  fetchJson,
  debounce,
  ankiRequest,
} = require("./functions");
const { updateHash } = require("../functions");
const {
  _c,
  _d,
  notSyncUserConfigKeys,
  parseUserConfigJson,
} = require("./userConfig");

let SITEID = __SITEID__;
let ROOTPATH = __ROOTPATH__;

// Create your instance
const db = new Dexie(SITEID);

db.version(1).stores({
  history: "id,keyword,status,time", // other fields: dict,type,page,offset,q... normal params
  notebook: "id,title,dictid,status,*tag,time", // other fields: dict, note
  tag: "name,status", // auto generate, local only
});
db.version(2).stores({
  history: "id,keyword,status,time",
  notebook: "id,title,dictid,status,*tag,time",
  tag: "name,status,time",
});
db.version(3).stores({
  history: "id,keyword,status,time",
  notebook: "id,title,dictid,status,*tag,time",
  tag: "name,status,time",
  meta: "key,time", // other fields: value. noteCnt, tagCnt
});
db.version(4).stores({
  history: "id,keyword,status,time",
  notebook: "id,title,dictid,status,*tag,time",
  deletedNotebook: "id,title",
  tag: "name,status,time",
  meta: "key,time", // other fields: value. noteCnt, tagCnt
});
db.version(5).stores({
  history: "id,keyword,status,time",
  notebook: "id,title,dictid,status,*tag,time",
  deletedNotebook: "id,status,time",
  tag: "name,status,time",
  meta: "key,time", // other fields: value. noteCnt, tagCnt
});
db.version(6).stores({
  history: "id,keyword,status,time",
  notebook: "id,title,dictid,status,*tag,time",
  deletedNotebook: "id,status,time",
  tag: "name,status,time",
  userconfig: "profile,time,status", // other fields: data, changedKeys
  meta: "key,time", // other fields: value. noteCnt, tagCnt
});

/*
status:
* 0: local created / modified
* 1: already synced
*/

db.history.hook("reading", function (obj) {
  let { keyword, q, type, dict, page, offset } = obj;
  let text = keyword;
  if (dict) {
    if (q) {
      text = `「${q}」の検索結果 - ${dict}`;
    } else if (page != null && offset == null) {
      text = `ページ ${page} - ${dict}`;
    } else {
      text = `${keyword} - ${dict}`;
    }
  }
  obj.text = text;
  return obj;
});

db.history.hook("creating", creatingHook);
// db.history.hook("updating", updatingHook);
db.notebook.hook("creating", creatingHook);
db.meta.hook("creating", creatingHookTimeOnly);
db.meta.hook("updating", updatingHookTimeOnly);
db.tag.hook("creating", creatingHookTimeOnly);
db.tag.hook("updating", updatingHookTimeOnly);
db.userconfig.hook("creating", creatingHookTimeOnly);
db.userconfig.hook("updating", updatingHookTimeOnly);

function creatingHook(primKey, obj, transaction) {
  if (!obj.id) {
    obj.id = uuidv4();
  }
  if (obj.status === undefined) {
    obj.status = 0;
  }
  if (!obj.time) {
    obj.time = +new Date();
  }
}

function updatingHook(mods, primKey, obj, transaction) {
  if (!mods.time) {
    return { time: +new Date() };
  }
}

function creatingHookTimeOnly(primKey, obj, transaction) {
  if (!obj.time) {
    obj.time = +new Date();
  }
}

function updatingHookTimeOnly(mods, primKey, obj, transaction) {
  if (!mods.time) {
    return { time: +new Date() };
  }
}

async function countTagNote(tag) {
  return await db.notebook
    .where("tag")
    .equals(typeof tag == "object" ? tag.name : tag)
    .count();
}

async function shouldTagExists(tag) {
  return !!(await db.notebook
    .where("tag")
    .equals(typeof tag == "object" ? tag.name : tag)
    .first());
}

export async function putHistory(historyData, { cloud = false } = {}) {
  if (cloud) {
    historyData.status = 1;
  }
  await db.history.put(historyData);
  if (!cloud) {
    dbSyncHistoryDebounce();
  }
}

export async function putNote(
  noteData,
  {
    debug = false,
    merge = false,
    cloud = false,
    restore = false,
    checktime = false,
    quickMode = false,
  } = {}
) {
  let data = await db.transaction(
    "rw",
    db.tag,
    db.notebook,
    db.meta,
    async (tx) => {
      let note = { ...noteData };
      let time = +new Date();
      let existingNote;
      debug && console.log(new Date(), "putNote", noteData);

      note.tag = note.tag ? [...note.tag] : [];
      note.comment = note.comment || "";
      if (!quickMode && note.id) {
        existingNote = await db.notebook.get(note.id);
      }

      if (existingNote) {
        if (merge) {
          if (existingNote.comment) {
            note.comment = note.comment
              ? existingNote.comment + "\n\n" + note.comment
              : existingNote.comment;
          }
          if (existingNote.tag) {
            note.tag = note.tag.concat(existingNote.tag).filter(uniqueFilter);
          }
        }
        if (checktime && noteData.time && existingNote.time != noteData.time) {
          return {
            conflict: 1,
          };
        }
      }
      let id = await db.notebook.put({
        ...note,
        status: cloud ? 1 : existingNote && existingNote.status > 0 ? 2 : 0,
        time: (cloud || restore) && noteData.time ? noteData.time : time,
      });
      if (quickMode) {
        return;
      }
      let deleteTags = [],
        putTags = [];
      note = await db.notebook.get(id);
      let oldTag = existingNote ? existingNote.tag || [] : [];
      let addTagCnt = 0,
        updateTagCnt = 0;
      for (let i = 0; i < note.tag.length; i++) {
        let name = note.tag[i];
        let tag = await db.tag.get(name);
        if (!tag) {
          addTagCnt++;
          tag = {
            name,
            status: 0,
            time,
            noteCnt: await countTagNote(name),
          };
          putTags.push(tag);
        } else if (oldTag.indexOf(name) == -1) {
          updateTagCnt++;
          if (tag.noteCnt === undefined) {
            tag.noteCnt = await countTagNote(name);
          } else {
            tag.noteCnt++;
          }
          tag.time = time;
          putTags.push(tag);
        }
      }
      for (let i = 0; i < oldTag.length; i++) {
        let name = oldTag[i];
        if (note.tag.indexOf(name) == -1) {
          let tag = await db.tag.get(name);
          if (tag) {
            if (await shouldTagExists(tag)) {
              if (tag.noteCnt === undefined) {
                tag.noteCnt = await countTagNote(name);
              } else {
                tag.noteCnt--;
              }
              tag.time = time;
              putTags.push(tag);
            } else {
              deleteTags.push(name);
            }
          }
        }
      }
      if (putTags.length) {
        await db.tag.bulkPut(putTags);
      }
      if (deleteTags.length) {
        await db.tag.bulkDelete(deleteTags);
      }

      let updateMetas = [];
      let metaNoteCnt = await db.meta.get("noteCnt");
      let tagNoteCnt = await db.meta.get("tagCnt");
      if (!metaNoteCnt) {
        metaNoteCnt = {
          key: "noteCnt",
          value: await db.notebook.count(),
          time,
        };
        updateMetas.push(metaNoteCnt);
      } else if (!existingNote) {
        metaNoteCnt.value++;
        metaNoteCnt.time = time;
        updateMetas.push(metaNoteCnt);
      }
      if (!tagNoteCnt) {
        tagNoteCnt = {
          key: "tagCnt",
          value: await db.tag.count(),
          time,
        };
        updateMetas.push(tagNoteCnt);
      } else if (addTagCnt || deleteTags.length) {
        tagNoteCnt.value += addTagCnt - deleteTags.length;
        tagNoteCnt.time = time;
        updateMetas.push(tagNoteCnt);
      }
      if (updateMetas.length) {
        await db.meta.bulkPut(updateMetas);
      }

      return {
        note,
        insert: !existingNote,
        deleteTags,
        putTags,
        addTagCnt,
        updateTagCnt,
        updateMetas,
      };
    }
  );
  await dbSyncMeta({ notebookChanged: true });
  dbSyncDebounce();
  dbAnkiSyncDebounce();
  return data;
}

export async function deleteNote(id, { cloud = false } = {}) {
  if (typeof id == "object") {
    id = id.id;
  }
  let data = await db.transaction(
    "rw",
    db.tag,
    db.notebook,
    db.deletedNotebook,
    db.meta,
    async (tx) => {
      let note = await db.notebook.get(id);
      let time = +new Date();
      if (!note) {
        return;
      }
      await db.notebook.delete(id);
      let tags = note.tag || [];
      let deleteTags = [],
        putTags = [];
      for (let i = 0; i < tags.length; i++) {
        let tag = await db.tag.get(tags[i]);
        if (tag) {
          if (await shouldTagExists(tag)) {
            tag.noteCnt--;
            tag.time = time;
            putTags.push(tag);
          } else {
            deleteTags.push(tag.name);
          }
        }
      }
      if (deleteTags.length) {
        await db.tag.bulkDelete(deleteTags);
      }
      if (putTags.length) {
        await db.tag.bulkPut(putTags);
      }

      let updateMetas = [];
      let metaNoteCnt = await db.meta.get("noteCnt");
      let tagNoteCnt = await db.meta.get("tagCnt");
      if (!metaNoteCnt) {
        metaNoteCnt = {
          key: "noteCnt",
          value: await db.notebook.count(),
          time,
        };
        updateMetas.push(metaNoteCnt);
      } else {
        metaNoteCnt.value--;
        metaNoteCnt.time = time;
        updateMetas.push(metaNoteCnt);
      }
      if (!tagNoteCnt) {
        tagNoteCnt = {
          key: "tagCnt",
          value: await db.tag.count(),
          time,
        };
        updateMetas.push(tagNoteCnt);
      } else if (deleteTags.length) {
        tagNoteCnt.value -= deleteTags.length;
        tagNoteCnt.time = time;
        updateMetas.push(tagNoteCnt);
      }
      if (updateMetas.length) {
        await db.meta.bulkPut(updateMetas);
      }
      await db.deletedNotebook.put({ id, time, status: +!!cloud });
      return { id, deleteTags, putTags, updateMetas };
    }
  );
  await dbSyncMeta({ notebookChanged: true });
  dbSyncDebounce();
  dbAnkiSyncDebounce();
  return data;
}

export const SYNC_CODE_NOLOCK = 1;
export const SYNC_CODE_NOTOKEN = 2;

export const SYNC_CODE_MESSAGES = {
  0: "OK",
  1: "Another sync request is in process",
  2: "No valid tokens found",
  3: "Invalid google sheets file",
};

export function getSyncCodeMessage(code) {
  return `${SYNC_CODE_MESSAGES[code] || "Unknown error"} (${code})`;
}

export async function dbSyncMeta({ notebookChanged } = {}) {
  await db.transaction(
    "rw",
    db.notebook,
    db.deletedNotebook,
    db.meta,
    async (tx) => {
      let notSyncedNoteCnt = await db.notebook
        .where("status")
        .notEqual(1)
        .limit(100)
        .count();
      let notSyncedDeletedNoteCnt = await db.deletedNotebook
        .where("status")
        .equals(0)
        .limit(100)
        .count();
      let metas = [
        { key: "notSyncedNoteCnt", value: notSyncedNoteCnt },
        { key: "notSyncedDeletedNoteCnt", value: notSyncedDeletedNoteCnt },
      ];
      notebookChanged &&
        metas.push({ key: "notebookLastModifiedTime", value: +new Date() });
      db.meta.bulkPut(metas);
    }
  );
}

export async function dbUpdateNotebookMetas() {
  return await db.transaction(
    "rw",
    db.tag,
    db.meta,
    db.notebook,
    async (tx) => {
      let notes = await db.notebook.orderBy("time").reverse().toArray();
      let oldTags = await db.tag.orderBy("time").reverse().toArray();
      let tags = {};
      let deleteTags = [];
      for (let note of notes) {
        for (let tag of note.tag) {
          tags[tag] = tags[tag] || {
            name: tag,
            status: 0,
            time: note.time,
            noteCnt: 0,
          };
          tags[tag].noteCnt++;
        }
      }
      oldTags.forEach((tag) => {
        if (!tags[tag.name]) {
          deleteTags.push(tag.name);
        }
      });
      tags = Object.keys(tags).map((tag) => tags[tag]);
      let now = +new Date();
      await db.tag.bulkPut(tags);
      await db.tag.bulkDelete(deleteTags);
      await db.meta.bulkPut([
        {
          key: "noteCnt",
          value: notes.length,
          time: notes.length ? notes[0].time : now,
        },
        {
          key: "tagCnt",
          value: tags.length,
          time: tags.length ? tags[0].time : now,
        },
      ]);
    }
  );
}

export async function dbImportNotes(notes) {
  return await db.transaction(
    "rw",
    db.tag,
    db.meta,
    db.notebook,
    db.deletedNotebook,
    async (tx) => {
      notes = notes.map((note) => {
        note = { ...note };
        if (
          typeof note.title == "undefined" ||
          typeof note.content == "undefined"
        ) {
          return null;
        }
        if (note.tag && typeof note.tag == "string") {
          try {
            note.tag = JSON.parse(note.tag);
          } catch (e) {}
        }
        if (note.time && typeof note.time == "string") {
          note.time = parseInt(note.time) || 0;
        }
        note.tag = note.tag || [];
        return note;
      });
      notes = notes.filter((a) => a);
      let successCnt = notes.length,
        failureCnt = 0;
      try {
        await db.notebook.bulkPut(notes);
        await dbUpdateNotebookMetas();
      } catch (error) {
        failureCnt = error.failures ? error.failures.length : notes.length;
      }
      successCnt -= failureCnt;
      return { successCnt, failureCnt };
    }
  );
}

export async function dbSyncHistory({ refresh } = {}) {
  let apiUrl = ROOTPATH + "?api=4&type=3";
  let tokens = parseUserConfigJson(
    (await db.meta.get("googleTokens"))?.value,
    null
  );
  if (!tokens) {
    return;
  }
  try {
    let { access_token, refresh_token, expiry_date, appid } = tokens;
    let syncHistoryDataTime = await db.meta.get("syncHistoryDataTime");
    syncHistoryDataTime = syncHistoryDataTime ? syncHistoryDataTime.value : 0;
    let history = await db.history
      .where("status")
      .equals(0)
      .limit(50)
      .toArray();
    let request = {
      debug: 0,
      action: 2,
      history: history.map((data) => JSON.stringify(data)),
      historySince: syncHistoryDataTime,
      tokens: {
        access_token,
        refresh_token,
        expiry_date,
        appid,
      },
    };
    let data = await fetchJson(apiUrl, null, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
    if (data.code) {
      throwSyncError(0, getSyncCodeMessage(data.code));
    }
    await db.transaction("rw", db.notebook, db.history, db.meta, async (tx) => {
      for (let i = 0; i < history.length; i++) {
        await db.history.update(history[i].id, { status: 1 });
      }
      data.history = data.history
        .map((history) => {
          try {
            history = JSON.parse(history);
            history.status = 1;
            return history;
          } catch (e) {}
        })
        .filter((a) => a);
      await db.history.bulkPut(data.history);
      await db.meta.put({
        key: "syncHistoryDataTime",
        value: data.historyTime || 0,
      });
    });
    if (refresh) {
      refresh();
    }
  } catch (error) {}
}

export async function dbSync({ force, refresh } = {}) {
  let apiUrl = ROOTPATH + "?api=4&type=3";
  let { userConfig } = await dbGetUserConfigInfo();
  let minInterval = _d("syncMinInterval", userConfig);
  let { debugSync: debug, debugSyncApi: debugApi } = userConfig;
  let syncDataTime, syncHistoryDataTime, syncConfigDataTime;
  let tokens = parseUserConfigJson(
    (await db.meta.get("googleTokens"))?.value,
    null
  );
  await db.transaction(
    "rw",
    db.tag,
    db.meta,
    db.notebook,
    db.deletedNotebook,
    db.userconfig,
    async (tx) => {
      let inProcessSync = await db.meta.get("inProcessSync");
      if (!tokens) {
        throwSyncError(debug, "Can not sync, no valid tokens.");
      }
      debug && console.log(new Date(), "dbSync precheck", inProcessSync);
      if (
        force != 2 &&
        inProcessSync &&
        inProcessSync.value + 120000 >= +new Date()
      ) {
        throwSyncError(debug, "Another sync instance in process");
      }
      let cnt1 = await db.notebook.where("status").notEqual(1).limit(1).count();
      let cnt2 = await db.deletedNotebook
        .where("status")
        .equals(0)
        .limit(1)
        .count();
      let cnt3 = await db.userconfig
        .where("status")
        .notEqual(1)
        .limit(1)
        .count();
      if (
        !cnt1 &&
        !cnt2 &&
        !cnt3 &&
        tokens.syncConfigDataTime &&
        !force &&
        tokens.syncTime &&
        tokens.syncTime + minInterval >= +new Date()
      ) {
        throwSyncError(debug, "Already synced recently.");
      }
      await db.meta.put({ key: "inProcessSync", value: +new Date() });
      syncDataTime = await db.meta.get("syncDataTime");
      syncHistoryDataTime = await db.meta.get("syncHistoryDataTime");
      syncConfigDataTime = await db.meta.get("syncConfigDataTime");
      syncDataTime = syncDataTime ? syncDataTime.value : 0;
      syncHistoryDataTime = syncHistoryDataTime ? syncHistoryDataTime.value : 0;
      syncConfigDataTime = syncConfigDataTime ? syncConfigDataTime.value : 0;
    }
  );
  if (refresh) {
    refresh();
  }
  try {
    let { access_token, refresh_token, expiry_date, appid } = tokens;
    let deleteNotes = (
      await db.deletedNotebook.where("status").equals(0).limit(1000).toArray()
    ).map((note) => note.id);
    let updateNotes = await db.notebook
      .where("status")
      .anyOf(0, 2)
      .limit(1000)
      .toArray();
    let history = await db.history
      .where("status")
      .equals(0)
      .limit(1000)
      .toArray();
    let userconfig = await db.userconfig.where("status").equals(0).toArray();
    let notebookSyncedFlag = await db.meta.get("notebookSyncedFlag");
    let time = +new Date();
    let request = {
      debug: debug && debugApi ? 1 : 0,
      since: syncDataTime || 0,
      historySince: syncHistoryDataTime || 0,
      history: history.map((data) => JSON.stringify(data)),
      userconfig,
      userconfigSince: syncConfigDataTime || 0,
      noteSyncStrict: +!notebookSyncedFlag,
      deleteNotes,
      updateNotes,
      tokens: {
        access_token,
        refresh_token,
        expiry_date,
        appid,
      },
    };
    let data = await fetchJson(apiUrl, null, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
    if (data.code) {
      throwSyncError(debug, getSyncCodeMessage(data.code));
    }
    await db.transaction(
      "rw",
      db.notebook,
      db.history,
      db.deletedNotebook,
      db.userconfig,
      db.tag,
      db.meta,
      async (tx) => {
        let inProcessSync = await db.meta.get("inProcessSync");
        debug && console.log(new Date(), "dbSync p local db", inProcessSync);
        if (!inProcessSync) {
          throwSyncError(debug, "Sync canceled or reseted.");
        }
        // new userconfig sync mechanism
        let userConfigDatas = [];
        for (let i = 0; i < data.userconfig.length; i++) {
          let userconfig = data.userconfig[i];
          let localdata = await db.userconfig.get(userconfig.profile);
          if (!localdata || localdata.status == 1) {
            if (localdata) {
              let localUserConfig = parseUserConfigJson(localdata.data);
              notSyncUserConfigKeys.forEach((key) => {
                if (localUserConfig[key] != null) {
                  userconfig[key] = localUserConfig[key];
                }
              });
            }
            updateHash(userconfig);
            userConfigDatas.push(userconfig);
          }
        }
        await db.userconfig.bulkPut(userConfigDatas);
        await dbSyncUserConfigMetas();
        // --

        for (let i = 0; i < history.length; i++) {
          debug &&
            console.log(new Date(), "--set history to status 1", history[i].id);
          await db.history.update(history[i].id, { status: 1 });
        }
        await db.deletedNotebook.bulkPut(
          deleteNotes.map((id) => ({ id, time, status: 1 }))
        );
        for (let i = 0; i < updateNotes.length; i++) {
          debug &&
            console.log(
              new Date(),
              "--set note to status 1",
              updateNotes[i].title
            );
          await putNote(Object.assign({}, updateNotes[i], { status: 1 }), {
            cloud: true,
            checktime: true,
          });
          // await db.notebook.update(updateNotes[i], {status: 1});
        }
        if (data.updatedNotes.length + data.deletedNotes.length > 20) {
          data.updatedNotes.forEach((note) => (note.status = 1));
          await db.notebook.bulkPut(data.updatedNotes);
          await db.notebook.bulkDelete(data.deletedNotes);
          await db.deletedNotebook.bulkPut(
            data.deletedNotes.map((id) => ({ id, time, status: 1 }))
          );
          await dbUpdateNotebookMetas();
        } else {
          for (let i = 0; i < data.deletedNotes.length; i++) {
            debug &&
              console.log(
                new Date(),
                "--(from cloud) delete note",
                data.deletedNotes[i]
              );
            await deleteNote(data.deletedNotes[i], { cloud: true });
          }
          for (let i = 0; i < data.updatedNotes.length; i++) {
            debug &&
              console.log(
                new Date(),
                "--(from cloud) put note",
                data.updatedNotes[i]
              );
            await putNote(data.updatedNotes[i], { cloud: true });
          }
        }
        data.history = data.history
          .map((history) => {
            try {
              history = JSON.parse(history);
              history.status = 1;
              return history;
            } catch (e) {}
          })
          .filter((a) => a);
        await db.history.bulkPut(data.history);
        debug && console.log(new Date(), "dbSync finishing");
        let notebookSyncedFlag = await db.meta.get("notebookSyncedFlag");
        if (!notebookSyncedFlag) {
          let notSyncedNotes = await db.notebook
            .where("status")
            .equals(0)
            .limit(1);
          if (notSyncedNotes.length == 0) {
            await db.meta.put({
              key: "notebookSyncedFlag",
              value: +new Date(),
            });
          }
        }
        await db.meta.bulkPut([
          {
            key: "syncHistoryDataTime",
            value: data.historyTime || 0,
          },
          {
            key: "syncDataTime",
            value: data.time || 0,
          },
          {
            key: "syncConfigDataTime",
            value: data.userconfigTime || 0,
          },
        ]);
        debug && console.log(new Date(), "dbSync done processing local db");
      }
    );
    let googleTokens = Object.assign({}, tokens, data.tokens || {});
    googleTokens.dataFileUrl = data.dataFileUrl || "";
    googleTokens.syncTime = +new Date();
    await db.meta.put({
      key: "googleTokens",
      value: JSON.stringify(googleTokens),
    });
    await db.meta.delete("inProcessSync");
    if (debug) {
      console.log(new Date(), "sync finish");
    }
    if (refresh) {
      refresh();
    }
    return {
      changed: data.deletedNotes.length > 0 || data.updatedNotes.length > 0,
      historyChanged: data.history.length > 0,
    };
  } catch (error) {
    await db.meta.delete("inProcessSync");
    throwSyncError(debug, error);
  }
}

export async function dbResetSync() {
  await db.transaction(
    "rw",
    db.notebook,
    db.deletedNotebook,
    db.meta,
    async (tx) => {
      await db.meta.bulkDelete([
        "inProcessSync",
        "notebookSyncedFlag",
        "syncConfigDataTime",
        "syncHistoryDataTime",
        "syncDataTime",
      ]);
      await db.deletedNotebook.toCollection().delete();
      await db.notebook.where("status").aboveOrEqual(1).modify({ status: 0 });
      let googleTokens = parseUserConfigJson(
        (await db.meta.get("googleTokens"))?.value,
        null
      );
      if (googleTokens) {
        googleTokens.syncTime = null;
        await db.meta.put("googleTokens", {
          key: "googleTokens",
          value: JSON.stringify(googleTokens),
        });
      }
    }
  );
}

export async function dbAnkiSync({
  isBackground = true,
  forceSync = false,
} = {}) {
  let now = +new Date();
  let inProcessAnkiSyncValue;
  let result = {
    error: null,
    skip: 0,
    added: 0,
    deleted: 0,
    modified: 0,
    changed: 0,
    conflict: 0,
  };
  if (
    _c("ankiConnectStatus") == 0 ||
    (_c("ankiConnectStatus") == 1 && isBackground)
  ) {
    return result;
  }
  try {
    await db.transaction("rw", db.meta, async (tx) => {
      let inProcessAnkiSync = await db.meta.get("inProcessAnkiSync");
      let notebookLastModifiedTime = db.meta.get("notebookLastModifiedTime");
      let lastAnkiSyncTime = db.meta.get("lastAnkiSyncTime");
      if (inProcessAnkiSync && inProcessAnkiSync.value + 60000 >= now) {
        result.conflict = 1;
        throw new Error("Another anki sync instance in process");
      }
      if (
        isBackground &&
        !forceSync &&
        notebookLastModifiedTime &&
        lastAnkiSyncTime &&
        notebookLastModifiedTime.value < lastAnkiSyncTime.time
      ) {
        result.skip = 1;
        throw new Error("Sync skipped (All data already up to date)");
      }
      inProcessAnkiSyncValue = now;
      await db.meta.put({
        key: "inProcessAnkiSync",
        value: inProcessAnkiSyncValue,
      });
    });
    let deck = _c("ankiConnectDeck");
    let apiKey = _c("ankiConnectApiKey");
    await ankiRequest(
      {
        action: "createModel",
        version: 6,
        params: {
          modelName: ANKI_MODEL,
          inOrderFields: ["title", "content", "comment", "id", "time"],
          isCloze: false,
          cardTemplates: [
            {
              Front: "{{title}}",
              Back: "{{content}}\n\n{{comment}}",
              _id: "{{id}}",
              time: "{{time}}",
            },
          ],
        },
      },
      apiKey
    );
    await ankiRequest(
      {
        action: "createDeck",
        version: 6,
        params: {
          deck,
        },
      },
      apiKey
    );
    let notes = await db.notebook.orderBy("time").reverse().toArray();
    let deletedNotes = await db.deletedNotebook.toArray();
    let ankiNoteIds = await ankiRequest(
      {
        action: "findNotes",
        version: 6,
        params: {
          query: `deck:${deck}`,
        },
      },
      apiKey
    );
    let ankiNotes = await ankiRequest(
      {
        action: "notesInfo",
        version: 6,
        params: {
          notes: ankiNoteIds,
        },
      },
      apiKey
    );
    let newNotes = notes.filter((note) => {
      return !ankiNotes.find((ankiNote) => ankiNote.fields.id.value == note.id);
    });
    let deletedAnkiNotes = forceSync
      ? ankiNotes.filter((ankiNote) => {
          return !notes.find((note) => ankiNote.fields.id.value == note.id);
        })
      : ankiNotes.filter((ankiNote) => {
          return deletedNotes.find(
            (note) => ankiNote.fields.id.value == note.id
          );
        });
    if (newNotes.length) {
      await ankiRequest(
        {
          action: "addNotes",
          version: 6,
          params: {
            notes: newNotes.map((note) => ({
              options: {
                allowDuplicate: true,
              },
              deckName: deck,
              modelName: ANKI_MODEL,
              tags: note.tag.map((tag) => tag.replace(/\s/g, "_")),
              fields: {
                id: note.id,
                title: note.title,
                content: note.content,
                comment: note.comment,
                time: note.time.toString(),
              },
            })),
          },
        },
        apiKey
      );
    }
    if (deletedAnkiNotes.length) {
      await ankiRequest(
        {
          action: "deleteNotes",
          version: 6,
          params: {
            notes: deletedAnkiNotes.map((note) => note.noteId),
          },
        },
        apiKey
      );
    }
    let latestNotes = notes;
    let addTags = {};
    let removeTags = {};
    let modifiedCnt = 0;
    for (let i = 0; i < latestNotes.length; i++) {
      let note = latestNotes[i];
      let ankiNote = ankiNotes.find(
        (ankiNote) => ankiNote.fields.id.value == note.id
      );
      if (!ankiNote) {
        continue;
      }
      let modified = false;
      // older anki model do not have time field
      if (
        ankiNote.fields.time
          ? ankiNote.fields.time.value < note.time
          : ankiNote.fields.title.value !== note.title ||
            ankiNote.fields.content.value !== note.content ||
            ankiNote.fields.comment.value !== note.comment
      ) {
        modified = true;
        await ankiRequest(
          {
            action: "updateNoteFields",
            version: 6,
            params: {
              note: {
                id: ankiNote.noteId,
                fields: {
                  title: note.title,
                  content: note.content,
                  comment: note.comment,
                  time: note.time.toString(),
                },
              },
            },
          },
          apiKey
        );
      }
      if (!ankiNote.fields.time || ankiNote.fields.time.value < note.time) {
        let ankiTags = ankiNote.tags.sort();
        let noteTag = note.tag.map((tag) => tag.replace(/\s/g, "_")).sort();
        if (
          ankiTags.length != noteTag.length ||
          JSON.stringify(ankiTags) !== JSON.stringify(noteTag)
        ) {
          noteTag
            .filter((tag) => ankiTags.tags.indexOf(tag) == -1)
            .forEach((tag) => {
              addTags[tag] = addTags[tag] || [];
              addTags[tag].push(ankiNote.noteId);
              modified = true;
            });
          ankiTags
            .filter((tag) => noteTag.indexOf(tag) == -1)
            .forEach((tag) => {
              removeTags[tag] = removeTags[tag] || [];
              removeTags[tag].push(ankiNote.noteId);
              modified = true;
            });
        }
      }
      if (modified) {
        modifiedCnt++;
      }
    }
    // console.log("updateTags", addTags, removeTags)
    for (let tag of Object.keys(addTags)) {
      await ankiRequest(
        {
          action: "addTags",
          version: 6,
          params: {
            notes: addTags[tag],
            tags: tag,
          },
        },
        apiKey
      );
    }
    for (let tag of Object.keys(removeTags)) {
      await ankiRequest(
        {
          action: "removeTags",
          version: 6,
          params: {
            notes: removeTags[tag],
            tags: tag,
          },
        },
        apiKey
      );
    }
    let changed = newNotes.length + modifiedCnt + deletedAnkiNotes.length;
    if (!isBackground) {
      changed &&
        (await ankiRequest(
          {
            action: "sync",
            version: 6,
          },
          apiKey
        ));
    }
    result.added = newNotes.length;
    result.deleted = deletedAnkiNotes.length;
    result.modified = modifiedCnt;
    result.changed = changed;
  } catch (e) {
    if (!result.skip && !result.conflict) {
      result.error = e;
    }
  }
  try {
    !result.conflict &&
      (await db.transaction("rw", db.meta, async (tx) => {
        let inProcessAnkiSync = await db.meta.get("inProcessAnkiSync");
        if (
          inProcessAnkiSync &&
          inProcessAnkiSync.value == inProcessAnkiSyncValue
        ) {
          await db.meta.delete("inProcessAnkiSync");
        }
        if (!result.error) {
          await db.meta.put({ key: "lastAnkiSyncTime", value: now });
        }
      }));
  } catch (e) {}
  return result;
}

function throwSyncError(debug, error) {
  if (typeof error == "object") {
    error = error.toString();
  }
  if (debug) {
    console.log(new Date(), error);
  }
  throw error;
}

// function triggerServiceWorkerSync() {
//   if (window.__sw_registration__) {
//     setTimeout(serviceWorkerSync, 0);
//   }
// }

// function serviceWorkerSync() {
//   window.__sw_registration__.sync.register("cloudsync");
// }

// init userConfig or migrate from <= 1.2.13 userConfig system
export async function _initUserConfig() {
  try {
    await db.transaction("rw", db.userconfig, db.meta, async (tx) => {
      let userConfigProfile = await db.meta.get("userConfigProfile");
      if (userConfigProfile) {
        return;
      }
      let userConfig = await oldGetUserConfig(SITEID);
      if (userConfig.googleUserInfo) {
        await db.meta.bulkPut([
          {
            key: "googleUserInfo",
            value: JSON.stringify(userConfig.googleUserInfo),
          },
          {
            key: "googleTokens",
            value: JSON.stringify(userConfig.googleTokens),
          },
        ]);
        delete userConfig.googleUserInfo;
        delete userConfig.googleTokens;
      }
      updateHash(userConfig);
      await db.userconfig.put({
        profile: "default",
        status: 0,
        data: JSON.stringify(userConfig),
      });
      await db.meta.put({ key: "userConfigProfile", value: "default" });
      await db.meta.put({ key: "userConfigProfiles", value: '["default"]' });
    });
  } catch (e) {}
}

// check: compare and sync indexDb to DOM/localStorage
export async function dbGetUserConfigInfo(check = false) {
  let result = await db.transaction("r", db.userconfig, db.meta, async (tx) => {
    let userConfigProfile = await db.meta.get("userConfigProfile");
    if (!userConfigProfile) {
      // migrate from <= 1.2.13
      return 1;
    }
    userConfigProfile = userConfigProfile.value || "default";
    let userConfigProfiles = (await db.meta.get("userConfigProfiles")) || {};
    userConfigProfiles = parseUserConfigJson(userConfigProfiles.value, []);
    let userConfig = parseUserConfigJson(
      (await db.userconfig.get(userConfigProfile))?.data
    );
    if (
      check &&
      typeof window != "undefined" &&
      (userConfigProfile != window.__USERCONFIG_PROFILE__ ||
        (userConfig.$$hash &&
          window.__USERCONFIG__.$$hash != userConfig.$$hash) ||
        window.__USERCONFIG_PROFILES__.length != userConfigProfiles.length ||
        window.__USERCONFIG_PROFILES__.some(
          (value) => userConfigProfiles.indexOf(value) == -1
        ))
    ) {
      return 2;
    }
    return {
      userConfig,
      userConfigProfile,
      userConfigProfiles,
    };
  });
  if (result == 1) {
    await _initUserConfig();
    result = await dbGetUserConfigInfo();
  } else if (result == 2) {
    await dbApplyUserConfig();
    result = await dbGetUserConfigInfo();
  }
  return result;
}

export async function dbCreateUserConfigProfile(profile, fromProfile) {
  return await db.transaction("rw", db.userconfig, db.meta, async (tx) => {
    let userConfigProfiles = (await db.meta.get("userConfigProfiles")) || {};
    userConfigProfiles = parseUserConfigJson(userConfigProfiles.value, []);
    if (userConfigProfiles.indexOf(profile) != -1) {
      return;
    }
    userConfigProfiles.push(profile);
    await db.meta.put({
      key: "userConfigProfiles",
      value: JSON.stringify(userConfigProfiles),
    });
    await db.meta.put({
      key: "userConfigProfile",
      value: profile,
    });
    let userConfig = fromProfile
      ? parseUserConfigJson((await db.userconfig.get(fromProfile))?.data)
      : {};
    await db.userconfig.put({
      profile,
      status: 0,
      data: JSON.stringify(userConfig),
    });
    return { userConfig, userConfigProfiles, userConfigProfile: profile };
  });
}

export async function dbRemoveUserConfigProfile(profile) {
  return await db.transaction("rw", db.userconfig, db.meta, async (tx) => {
    let userConfigProfiles = (await db.meta.get("userConfigProfiles")) || {};
    userConfigProfiles = parseUserConfigJson(userConfigProfiles.value, []);
    let index = userConfigProfiles.indexOf(profile);
    if (index == -1) {
      return;
    }
    userConfigProfiles.splice(index, 1);
    await db.meta.put({
      key: "userConfigProfiles",
      value: JSON.stringify(userConfigProfiles),
    });
    await db.userconfig.delete(profile);

    let userConfigProfile =
      (await db.meta.get("userConfigProfile"))?.value || "default";
    if (userConfigProfile == profile) {
      return await dbSetUserConfigProfile(
        index < userConfigProfiles.length
          ? userConfigProfiles[index]
          : userConfigProfiles[0] || "default"
      );
    } else {
      return {
        userConfigProfiles,
      };
    }
  });
}

export async function dbSetUserConfigProfile(profile) {
  return await db.transaction("rw", db.userconfig, db.meta, async (tx) => {
    let userConfigProfiles = (await db.meta.get("userConfigProfiles")) || {};
    userConfigProfiles = parseUserConfigJson(userConfigProfiles.value, []);
    if (
      userConfigProfiles.indexOf(profile) == -1 ||
      profile == ((await db.meta.get("userConfigProfile"))?.value || "default")
    ) {
      return;
    }
    let userConfig = await db.userconfig.get(profile);
    if (!userConfig) {
      await db.userconfig.put({ profile, status: 0, data: "{}" });
      userConfig = {};
    } else {
      userConfig = parseUserConfigJson(userConfig.data);
    }
    await db.meta.put({
      key: "userConfigProfile",
      value: profile,
    });
    await dbApplyUserConfig();
    return { userConfig, userConfigProfiles, userConfigProfile: profile };
  });
}

export async function dbUpdateUserConfig({
  data,
  profile = "default",
  overwrite = false,
  apply = true,
  cloud = false,
}) {
  let result = await db.transaction(
    "rw",
    db.userconfig,
    db.meta,
    async (tx) => {
      let changedKeys = null;
      let userConfig = await db.userconfig.get(profile);
      if (!userConfig) {
        return;
      }
      let userConfigData = parseUserConfigJson(userConfig.data);
      if (data == null || overwrite) {
        if (cloud) {
          Object.keys(userConfigData).forEach((key) => {
            if (notSyncUserConfigKeys.indexOf(key) == -1) {
              delete userConfigData[key];
            }
          });
        } else {
          changedKeys = "*";
          userConfigData = {};
        }
      }
      if (data) {
        let dataKeys = Object.keys(data).filter((key) => !key.startsWith("$"));
        if (!cloud && userConfig.changedKeys != "*") {
          changedKeys = parseUserConfigJson(userConfig.changedKeys, []).concat(
            dataKeys
          );
        }
        for (let key of dataKeys) {
          if (data[key] == null) {
            delete userConfigData[key];
          } else {
            userConfigData[key] = data[key];
          }
        }
        updateHash(userConfigData);
      }
      userConfig.profile = profile;
      userConfig.data = JSON.stringify(userConfigData);
      if (changedKeys) {
        if (Array.isArray(changedKeys)) {
          changedKeys = [...new Set(changedKeys)].filter(
            (key) => notSyncUserConfigKeys.indexOf(key) == -1
          );
        }
        if (changedKeys == "*" || changedKeys.length) {
          userConfig.status = 0;
          userConfig.changedKeys = Array.isArray(changedKeys)
            ? JSON.stringify(changedKeys)
            : changedKeys;
        }
      }
      await db.userconfig.put(userConfig);
      if (apply) {
        return await dbApplyUserConfig();
      } else {
        return userConfigData;
      }
    }
  );
  dbSyncDebounce();
  return result;
}

export async function dbSyncUserConfigMetas() {
  await db.transaction("rw", db.userconfig, db.meta, async (tx) => {
    let allUserConfig = await db.userconfig.toArray();
    let profiles = allUserConfig.map((config) => config.profile);
    let metaProfile =
      (await db.meta.get("userConfigProfile"))?.value || "default";
    let metaProfiles = await db.meta.get("userConfigProfiles");
    metaProfiles = parseUserConfigJson(metaProfiles?.value, []);
    if (
      profiles.length != metaProfiles.length ||
      profiles.some((value) => metaProfiles.indexOf(value) == -1)
    ) {
      metaProfiles = profiles.sort();
      let i = metaProfiles.indexOf("default");
      if (i != 0) {
        if (i > 0) {
          metaProfiles.splice(i, 1);
        }
        metaProfiles.unshift("default");
      }
      await db.meta.put({
        key: "userConfigProfiles",
        value: JSON.stringify(metaProfiles),
      });
    }
    if (metaProfiles.indexOf(metaProfile) == -1) {
      await db.meta.put({
        key: "userConfigProfile",
        value: "default",
      });
    }
  });
}

// apply userConfigs to DOM
export async function dbApplyUserConfig() {
  let result = await db.transaction("r", db.userconfig, db.meta, async (tx) => {
    let userConfigProfile = await db.meta.get("userConfigProfile");
    if (!userConfigProfile) {
      return 1;
    }
    userConfigProfile = userConfigProfile.value || "default";
    let allUserConfig = await db.userconfig.toArray();
    let userConfig = {};
    for (let i = 0; i < allUserConfig.length; i++) {
      let profile = allUserConfig[i].profile;
      let data = parseUserConfigJson(allUserConfig[i].data);
      if (profile == userConfigProfile) {
        userConfig = data;
      }
      let localStorageKey = `${SITEID}_userConfig${
        profile != "default" ? "_" + profile : ""
      }`;
      let localStorageData = parseUserConfigJson(
        localStorage.getItem(localStorageKey),
        null
      );
      if (
        !localStorageData ||
        (data.$$hash && data.$$hash !== localStorageData.$$hash)
      ) {
        localStorage.setItem(localStorageKey, JSON.stringify(data));
      }
    }
    let userConfigProfiles = allUserConfig.map((config) => config.profile);
    localStorage.setItem(`${SITEID}_userConfigProfile`, userConfigProfile);
    localStorage.setItem(
      `${SITEID}_userConfigProfiles`,
      JSON.stringify(userConfigProfiles)
    );
    window.__USERCONFIG_PROFILE__ = userConfigProfile;
    window.__USERCONFIG_PROFILES__ = userConfigProfiles;
    window.__USERCONFIG__ = userConfig;
    return userConfig;
  });
  // migrate from <= old userConfig system
  if (result === 1) {
    await _initUserConfig();
    result = dbApplyUserConfig();
  }
  return result;
}

export const dbAnkiSyncDebounce = debounce(dbAnkiSync, 2000);
export const dbSyncDebounce = debounce(dbSync, 2000);
export const dbSyncHistoryDebounce = debounce(dbSyncHistory, 2000);
export default db;
