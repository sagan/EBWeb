/*
https://developers.google.com/apps-script/guides/web

doPost(e) / doGet(e)
e.parameter
e.postData.contents
e.postData.type
e.postData.length

Logger.log(string)
*/

/*
appsscript.json

  "oauthScopes": [
    "profile",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive.readonly"
  ],

*/

let lock = LockService.getUserLock();

const fields = [
  "stime",
  "id",
  "title",
  "dictid",
  "status",
  "tag",
  "time",
  "heading",
  "content",
  "comment",
];
const userconfigFields = ["stime", "profile", "time", "data", "status"];
const dataHeader = [fields];
const userconfigDataHeader = [userconfigFields];

function getDataFile() {
  let files = DriveApp.searchFiles(
    `parents in "root" and title = "SoraDict" and mimeType = "${MimeType.GOOGLE_SHEETS}"`
  );
  let spreadsheet;
  if (files.hasNext()) {
    spreadsheet = SpreadsheetApp.open(files.next());
  } else {
    lock.waitLock(5000);
    spreadsheet = SpreadsheetApp.create("SoraDict");
    let sheets = spreadsheet.getSheets();
    let metaSheet;
    if (sheets.length == 0) {
      spreadsheet.insertSheet(0);
      spreadsheet.insertSheet(1);
      spreadsheet.insertSheet(2);
      metaSheet = spreadsheet.insertSheet(3);
    } else if (sheets.length == 1) {
      spreadsheet.insertSheet(1);
      spreadsheet.insertSheet(2);
      metaSheet = spreadsheet.insertSheet(3);
    } else if (sheets.length == 2) {
      spreadsheet.insertSheet(2);
      metaSheet = spreadsheet.insertSheet(3);
    } else if (sheets.length == 3) {
      metaSheet = spreadsheet.insertSheet(3);
    } else {
      metaSheet = sheets[sheets.length - 1];
    }
    sheets = spreadsheet.getSheets();
    let sheet = sheets[0];
    let userconfigSheet = sheets[2];
    sheet
      .getRange(1, 1, dataHeader.length, fields.length)
      .setValues(dataHeader);
    userconfigSheet
      .getRange(1, 1, userconfigDataHeader.length, userconfigFields.length)
      .setValues(userconfigDataHeader);

    metaSheet.getRange("A1").setValue("SoraDictAppData");
    metaSheet.getRange("B1").setValue("3");
    lock.releaseLock();
  }
  return spreadsheet;
}

function checkFile(spreadsheet) {
  let sheets = spreadsheet.getSheets();
  if (
    sheets.length < 2 ||
    sheets[sheets.length - 1].getRange("A1").getValue() != "SoraDictAppData"
  ) {
    return 3;
  }
  let code = 0;
  if (sheets[sheets.length - 1].getRange("B1").getValue() != 3) {
    lock.waitLock(5000);
    sheets = spreadsheet.getSheets();
    let version = sheets[sheets.length - 1].getRange("B1").getValue();
    // upgrade from old file format versions
    if (version != 3) {
      switch (version) {
        case "":
        case null:
        case undefined:
        case 1:
        case "1": // sheets: words,meta
          let historySheet = spreadsheet.insertSheet(1); // insert history sheet
          sheets.splice(1, 0, historySheet);
        case 2:
        case "2": // words,history,meta
          let sheet = sheets[0];
          sheet
            .getRange(1, 1, dataHeader.length, fields.length)
            .setValues(dataHeader);
          let userconfigSheet = spreadsheet.insertSheet(2);
          userconfigSheet
            .getRange(
              1,
              1,
              userconfigDataHeader.length,
              userconfigFields.length
            )
            .setValues(userconfigDataHeader);
          sheets.splice(2, 0, userconfigSheet);
          sheets[sheets.length - 1].getRange("B1").setValue("3");
          // current version 3:
          // words, history, userconfig, meta
          break;
        default:
          code = 3;
          break;
      }
    }
    lock.releaseLock();
  }
  if (sheets.length < 4) {
    code = 3;
  }
  return code;
}

function sync(spreadsheet, request, readonly) {
  let dataFileUrl = spreadsheet.getUrl();
  if (request.action == 1) {
    return { dataFileUrl };
  }
  let sheets = spreadsheet.getSheets();
  let sheet, historySheet, userconfigSheet, dataUpdated, userconfigUpdated;
  sheet = sheets[0];
  historySheet = sheets[1];
  userconfigSheet = sheets[2];

  let data =
    !request.action && sheet.getLastRow() > 1
      ? sheet.getRange(2, 1, sheet.getLastRow() - 1, fields.length).getValues()
      : [];
  let stime = Math.max(
    +new Date(),
    data.length ? (parseInt(data[data.length - 1][0]) || 0) + 1 : 0
  );
  let response = {
    code: 0,
    time: 0,
    dataFileUrl,
    userconfigTime: 0,
    userconfig: [],
    history: [],
    historyTime: 0,
    updatedNotes: [],
    deletedNotes: [],
  };
  let cloudNewDataIndex = binarySearchLt(
    data,
    [request.since || 0],
    null,
    null,
    "0"
  );
  let newData = cloudNewDataIndex != -1 ? data.slice(cloudNewDataIndex) : [];
  newData.forEach((data) => {
    if (data[4] == 3) {
      response.deletedNotes.push(data[1]);
    } else {
      response.updatedNotes.push({
        id: data[1],
        title: data[2],
        dictid: data[3],
        status: data[4],
        tag: data[5] ? data[5].split(/\n/) : [],
        time: data[6],
        heading: data[7],
        content: data[8],
        comment: data[9],
      });
    }
  });

  let userconfigData = [];
  if (request.userconfig) {
    userconfigData =
      userconfigSheet.getLastRow() > 1
        ? userconfigSheet
            .getRange(
              2,
              1,
              userconfigSheet.getLastRow() - 1,
              userconfigFields.length
            )
            .getValues()
        : [];
    let cloudNewUserconfigIndex = binarySearchLt(
      userconfigData,
      [request.userconfigSince ? request.userconfigSince : 0],
      null,
      null,
      "0"
    );
    let newUserconfigData =
      cloudNewUserconfigIndex != -1
        ? userconfigData.slice(cloudNewUserconfigIndex)
        : [];
    if (request.userconfig.length) {
      userconfigUpdated = true;
      request.userconfig.forEach((userconfig) => {
        let i = userconfigData.findIndex((row) => row[1] == userconfig.profile);
        if (i != -1) {
          userconfigData.splice(i, 1);
          let j = newUserconfigData.findIndex(
            (row) => row[1] == userconfig.profile
          );
          if (j != -1) {
            newUserconfigData.splice(j, 1);
          }
        }
        userconfigData.push([
          stime++,
          userconfig.profile,
          userconfig.time,
          userconfig.data,
          1,
        ]);
      });
    }
    response.userconfig = newUserconfigData.map((data) => ({
      profile: data[1],
      time: data[2],
      data: data[3],
      status: 1,
    }));
    response.userconfigTime = userconfigData.length
      ? userconfigData[userconfigData.length - 1][0]
      : 0;
  }

  let historyData =
    historySheet.getLastRow() > 0
      ? historySheet.getRange(1, 1, historySheet.getLastRow(), 2).getValues()
      : [];
  if (!readonly) {
    if (historyData.length > 2000) {
      historyData = historyData.slice(historyData.length - 1000);
      historySheet.clear();
      historySheet
        .getRange(1, 1, historyData.length, historyData[0].length)
        .setValues(historyData);
    }
  }

  if (request.history) {
    let cloudNewHistoryIndex = binarySearchLt(
      historyData,
      [request.historySince ? request.historySince : 0],
      null,
      null,
      "0"
    );
    let newHistoryData =
      cloudNewHistoryIndex != -1 ? historyData.slice(cloudNewHistoryIndex) : [];
    response.history = newHistoryData.map((data) => data[1]);
    response.historyTime = historyData.length
      ? historyData[historyData.length - 1][0]
      : 0;
    if (readonly) {
      request.history.forEach((data) => {
        historySheet.appendRow([+new Date(), data]);
      });
    } else {
      let now = +new Date();
      let requestHistoryData = request.history.map((data) => [now, data]);
      if (requestHistoryData.length) {
        historySheet
          .getRange(
            1 + historyData.length,
            1,
            requestHistoryData.length,
            requestHistoryData[0].length
          )
          .setValues(requestHistoryData);
        response.historyTime = now;
      }
    }
  }

  if (!readonly) {
    (request.deleteNotes || []).forEach((id) => {
      let i = data.findIndex((row) => row[1] == id);
      let deletedNote;
      if (i != -1 && data[i][4] != 3) {
        deletedNote = data[i];
        data.splice(i, 1);
      }
      i = response.updatedNotes.findIndex((note) => note.id == id);
      if (i != -1) {
        response.updatedNotes.splice(i, 1);
      }
      if (deletedNote) {
        deletedNote[0] = stime++;
        deletedNote[4] = 3;
        data.push(deletedNote);
        dataUpdated = true;
      }
    });
    (request.updateNotes || []).forEach((note) => {
      if (request.noteSyncStrict || note.status != 0) {
        let i = data.findIndex((row) => row[1] == note.id);
        if (i != -1) {
          data.splice(i, 1);
        }
        i = response.updatedNotes.findIndex((_note) => _note.id == note.id);
        if (i != -1) {
          response.updatedNotes.splice(i, 1);
        }
      }
      data.push([
        stime++,
        note.id,
        note.title,
        note.dictid,
        1,
        note.tag ? note.tag.join("\n") : "",
        note.time,
        note.heading,
        note.content,
        note.comment,
      ]);
      dataUpdated = true;
    });
  }
  response.time = data.length ? data[data.length - 1][0] : 0;
  if (userconfigUpdated && !readonly) {
    userconfigSheet
      .getRange(2, 1, userconfigData.length, userconfigFields.length)
      .setValues(userconfigData);
  }
  if (dataUpdated && !readonly) {
    sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
  }
  if (request.debug) {
    response.data = data;
    response.request = request;
  }
  if ((dataUpdated || userconfigUpdated) && !readonly) {
    SpreadsheetApp.flush();
  }
  return response;
}

function doGet(e) {
  let spreadsheet = getDataFile();
  let code = checkFile(spreadsheet);
  if (code) {
    return { code };
  }
  let response = sync(spreadsheet, e.parameter, true);
  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function doPost(e) {
  let request = JSON.parse(e.postData.contents);
  let spreadsheet = getDataFile();
  let code = checkFile(spreadsheet);
  if (code) {
    return { code };
  }
  let readonly =
    (!request.history || request.history.length <= 40) &&
    (request.action == 1 ||
      request.action == 2 ||
      ((!request.userconfig || request.userconfig.length == 0) &&
        (!request.deleteNotes || request.deleteNotes.length == 0) &&
        (!request.updateNotes || request.updateNotes.length == 0) &&
        !request.historyClear));
  try {
    if (!readonly) {
      lock.waitLock(5000);
    }
  } catch (e) {
    return ContentService.createTextOutput(
      JSON.stringify({
        code: 1, // fail to get lock
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
  let response = sync(spreadsheet, request, readonly);
  lock.releaseLock();
  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function binarySearchLt(array, item, start, end, field) {
  function compare(o1, o2) {
    if (o1[field] <= o2[field]) {
      return -1;
    }
    return 1;
  }
  let from = start == null ? 0 : start;
  let to = (end == null ? array.length : end) - 1;
  while (from <= to) {
    if (compare(array[from], item) > 0) {
      return from;
    }
    const middle = (from + to) >>> 1;
    const compareResult = compare(array[middle], item);
    if (compareResult < 0) {
      from = middle + 1;
    } else {
      to = middle - 1;
      if (to >= 0 && compare(array[to], item) < 0) {
        return middle;
      }
    }
  }
  return -1;
}
