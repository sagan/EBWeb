const fs = require("fs");
const path = require("path");
const child_process = require("child_process");
const readline = require("readline");
const queryString = require("query-string");
const fetch = require("isomorphic-fetch");
const config = require("../config.loader");
const { normalizeQ, parseEbTitle } = require("../client/functions");
const { REGEX_ENGLISH_FULL } = require("../client/language_functions");

let dicts;
let dicts_backend;
let dicts_using;
let dict_names = {};
let ebclient_cp;
let processing_query;
const queries = [];
const gaijiMaps = {};
let alternate = null;

process.on("SIGINT", cleanExit); // catch ctrl-c
process.on("SIGTERM", cleanExit); // catch kill
process.on("SIGHUP", cleanExit);
process.on("SIGQUIT", cleanExit);

try {
  alternate = require("../GAIJI/alternate.json");
} catch (e) {}

config.DICTINFO.dicts.forEach((dict) => {
  dict_names[dict.id || dict.name] = dict.name;
  if (dict.gaijiMap) {
    gaijiMaps[dict.id || dict.name] = require(`../GAIJI/${dict.gaijiMap}`);
  }
});

function cleanExit() {
  if (ebclient_cp) {
    ebclient_cp = void ebclient_cp.kill();
  }
  process.exit();
}

async function getEbclientCp() {
  if (!ebclient_cp) {
    dicts = dicts_backend = dicts_using = null;
    ebclient_cp = child_process.spawn(config.EBCLIENT_BIN, [
      config.EBCLIENT_DICT_PATH,
    ]);

    let status = 0; // 0 intial(wait); 1 read text line; 2 read binary meta; 3 read binary
    let buffers = [];
    let buffers_len = 0;
    let binary_len = 0;

    await Promise.race([
      new Promise((resolve, reject) => {
        let rl = readline.createInterface({
          input: ebclient_cp.stdout,
        });
        rl.once("line", (data) => {
          rl.close();
          console.log("dicts", data);
          dicts_backend = JSON.parse(data);
          ebclient_cp.stderr.setEncoding("utf8");
          ebclient_cp.stderr.on("data", (log) => {
            console.log("Backend error: ", log);
          });
          ebclient_cp.stdout.on("readable", () => {
            let data;
            while (true) {
              if (status == 0) {
                // initial
                data = ebclient_cp.stdout.read(1);
                if (data == null) {
                  break;
                }
                if (data[0] == 0) {
                  status = 2;
                } else {
                  status = 1;
                  ebclient_cp.stdout.unshift(data);
                }
              } else if (status == 1) {
                // read text
                data = ebclient_cp.stdout.read();
                if (data == null) {
                  break;
                }
                let index = data.indexOf(10); // \n
                if (index == -1) {
                  buffers.push(data);
                  buffers_len += data.byteLength;
                } else {
                  buffers.push(data.slice(0, index));
                  buffers_len += index;
                  ebclient_cp.stdout.unshift(data.slice(index + 1));
                  query_result(Buffer.concat(buffers, buffers_len).toString());
                  buffers = [];
                  buffers_len = 0;
                  status = 0;
                }
              } else if (status == 2) {
                // read binary meta
                data = ebclient_cp.stdout.read(5); // status(1) + len(4)
                if (data == null) {
                  break;
                }
                if (data[0] != 0) {
                  // error
                  query_result(null);
                  status = 0;
                } else {
                  binary_len = data.readInt32LE(1);
                  status = 3;
                }
              } else if (status == 3) {
                data = ebclient_cp.stdout.read(binary_len);
                if (data == null) {
                  break;
                }
                query_result(data);
                status = 0;
                binary_len = 0;
              }
            }
          });
          resolve();
        });
      }),
      new Promise((resolve, reject) =>
        setTimeout(() => reject("timeout"), 3000)
      ),
    ]);

    ebclient_cp.on("exit", () => {
      console.log("exit");
      ebclient_cp = null;
    });
    ebclient_cp.on("error", ebclientErrorHandle);
    ebclient_cp.stdin.on("error", ebclientErrorHandle);
    ebclient_cp.stdout.on("error", ebclientErrorHandle);
  }
  return ebclient_cp;
}

function ebclientErrorHandle(err) {
  console.log("ebclient error", err);
  ebclient_cp.stdin.end();
  ebclient_cp = void ebclient_cp.kill("SIGKILL");
  queries.forEach(({ reject }) => reject(new Error("Internal Server Error")));
  queries.length = 0;
}

async function query_client(params) {
  return new Promise((resolve, reject) => {
    queries.push({ params, resolve, reject });
    setTimeout(() => resolve([]), 5000);

    if (!processing_query) process_next_query();
  });
}

async function process_next_query() {
  processing_query = queries.shift();
  if (processing_query) {
    let {
      index,
      type,
      max,
      marker,
      q,
      page,
      offset,
      binary,
      width,
      height,
      endpage,
      endoffset,
    } = processing_query.params;
    let requestStr;
    if (binary) {
      if (binary == "mono") {
        requestStr = `b ${index} ${page} ${offset} ${width} ${height}\n`;
      } else if (binary == "gaiji") {
        requestStr = `g ${index} ${type} ${q}\n`;
      } else if (binary == "wav" || binary == "mp3") {
        requestStr = `d ${index} ${page} ${offset} ${endpage} ${endoffset}\n`;
      } else {
        requestStr = `c ${index} ${page} ${offset}\n`;
      }
    } else if (page != null) {
      if (offset != null) {
        requestStr = `a ${index} ${page} ${offset}\n`;
      } else {
        requestStr = `i ${index} ${page}\n`;
      }
    } else {
      requestStr = `${index} ${type} ${max} ${marker || 0},${q}\n`;
    }
    (await getEbclientCp()).stdin.write(requestStr);
  }
}

function query_result(rawdata) {
  // console.log("query result: ", rawdata);
  if (processing_query) {
    if (rawdata == null) {
      processing_query.resolve(null);
    } else if (Buffer.isBuffer(rawdata)) {
      if (processing_query.params.binary == "mp3") {
        processing_query.resolve(wavToMp3(rawdata));
      } else {
        processing_query.resolve(rawdata);
      }
    } else {
      try {
        let data = {
          words: null,
          nextPageMarker: "",
        };
        let words = [];
        let parsedData = JSON.parse(rawdata);
        if (parsedData.length) {
          if (parsedData.length % 4 == 1) {
            data.nextPageMarker = parsedData.pop();
            data.words = words;
          }
          for (let i = 0; i < parsedData.length; i += 4) {
            words.push({
              heading: parsedData[i],
              text: parsedData[i + 1],
              page: parsedData[i + 2],
              offset: parsedData[i + 3],
            });
          }
        }
        processing_query.resolve(data.words ? data : words);
      } catch (e) {
        console.log("backend error", JSON.stringify(e), rawdata);
        processing_query.resolve([]);
      }
    }
  }
  process_next_query();
}

// server side code
async function getDicts() {
  if (!dicts) {
    try {
      if (!config.EBCLIENT_BIN) {
        dicts_backend = await fetch(config.API_ENDPOINT + "?api=1").then(
          (res) => res.json()
        );
      } else {
        await getEbclientCp();
      }
      dicts = (dicts_backend || []).map((dict) => {
        let d = config.DICTINFO.dicts.find((d) => d.name == dict);
        return d ? d.id || d.name : dict;
      });
      dicts_using = config.DICTINFO.dicts.map((dict) => dict.id || dict.name);
    } catch (e) {}
  }
  return dicts_using;
}

async function _query(params) {
  let {
    q,
    dict,
    type,
    max,
    marker,
    romaji,
    page,
    offset,
    binary,
    width,
    height,
    endpage,
    endoffset,
  } = params;
  if (!dicts) await getDicts();

  if (alternate) {
    q = Array.from(q)
      .map((c) => alternate[c] || c)
      .join("");
  }

  params = {
    q,
    dict,
    type,
    marker,
    max: max || 100,
    romaji,
    page,
    offset,
    binary,
    width,
    height,
    endpage,
    endoffset,
  };

  let result;
  if (config.EBCLIENT_BIN) {
    params.index = (dicts_backend || []).indexOf(dict_names[dict]);
    params.q = normalizeQ(q, romaji);
    result = await query_client(params);
  } else {
    result = await fetch(
      config.API_ENDPOINT +
        `?api=1&` +
        queryString.stringify(
          Object.assign(params, {
            dict: dict_names[dict],
          })
        )
    );
    let contentType = result.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") != -1) {
      result = await result.json();
    } else {
      result = await result.buffer(); // node-fetch extension
    }
  }

  if (result && !Buffer.isBuffer(result)) {
    let words;
    if (Array.isArray(result)) {
      words = result;
    } else if (typeof result == "object" && result.words) {
      words = result.words;
    }
    if (words && gaijiMaps[dict]) {
      words.forEach((item) => {
        item.heading = convertGaiji(item.heading, gaijiMaps[dict]);
        item.text = convertGaiji(item.text, gaijiMaps[dict]);
      });
    }
  }

  return result;
}

async function query(params) {
  // directly get a word voice
  if (params.q && (params.binary == "wav" || params.binary == "mp3")) {
    let dict = config.DICTINFO.audioDict;
    let isEn = REGEX_ENGLISH_FULL.test(params.q);
    if (config.DICTINFO.audioDictEn && isEn) {
      dict = config.DICTINFO.audioDictEn;
    }
    if (!dict) {
      return null;
    }
    let titleInfo = parseEbTitle(normalizeQ(params.q, params.romaji));
    let resultWord = null;
    if (
      !titleInfo.keyword ||
      !titleInfo.hiragana ||
      titleInfo.keyword == titleInfo.hiragana ||
      isEn
    ) {
      let result = await _query({
        dict,
        q: titleInfo.keyword || titleInfo.hiragana || titleInfo.text,
        type: 2,
        max: 1,
      });
      resultWord = Array.isArray(result) ? result[0] : result.words[0];
    } else {
      let resultKeyword = await _query({
        dict,
        q: titleInfo.keyword,
        type: 2,
        max: 10,
      });
      let resultHiragana = await _query({
        dict,
        q: titleInfo.hiragana,
        type: 2,
        max: 10,
      });
      if (!Array.isArray(resultKeyword)) {
        resultKeyword = resultKeyword.words;
      }
      if (!Array.isArray(resultHiragana)) {
        resultHiragana = resultHiragana.words;
      }
      resultWord =
        resultKeyword.find((w) =>
          resultHiragana.some(
            (_w) => w.page == _w.page && w.offset == _w.offset
          )
        ) ||
        resultKeyword[0] ||
        resultHiragana[0];
    }
    if (resultWord) {
      let match = resultWord.text.match(
        /\[wav page=(\d+),offset=(\d+),endpage=(\d+),endoffset=(\d+)\]([\s\S]*?)\[\/wav\]/
      );
      if (match) {
        return await _query({
          dict,
          binary: params.binary,
          q: "",
          page: match[1],
          offset: match[2],
          endpage: match[3],
          endoffset: match[4],
        });
      }
    }
    return undefined;
  } else if (params.dict.startsWith("_")) {
    return [];
  } else if (params.dict.match(/[+_]/)) {
    let searchDicts = params.dict.split(/[+_]/).filter((a) => a);
    let markers = params.marker ? params.marker.split("|") : null;
    if (searchDicts.length > 3) {
      return [];
    }
    let results = {};
    let words = [];
    let nextPageMarkers = [];
    for (let i = 0; i < searchDicts.length; i++) {
      let _result =
        !markers || markers[i]
          ? await _query(
              Object.assign({}, params, {
                dict: searchDicts[i],
                marker: markers ? markers[i] : null,
              })
            )
          : [];
      words.push(Array.isArray(_result) ? _result : _result.words);
      nextPageMarkers.push(
        Array.isArray(_result) ? "" : _result.nextPageMarker
      );
    }
    results.words = words;
    results.nextPageMarker = nextPageMarkers.find((a) => a)
      ? nextPageMarkers.join("|")
      : "";
    return results;
  }
  return await _query(params);
}

function convertGaiji(str, map) {
  return str.replace(/\{\{(h|z)([a-f0-9]{4,})\}\}/gi, (match, type, key) => {
    // console.log('found', key);
    return map[key] || match;
  });
}

function wavToMp3(wavdata) {
  // cat input.wav | ffmpeg -i -  -f mp3 - > test.mp3
  const ffmpegProcess = child_process.spawn(
    "ffmpeg",
    "-i - -f mp3 -".split(" ")
  );
  ffmpegProcess.on("error", () => {});
  ffmpegProcess.stdin.end(wavdata);
  return ffmpegProcess.stdout;
}

module.exports = {
  getEbclientCp,
  getDicts,
  query,
};
