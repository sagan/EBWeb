const config = require("../config.loader");

const htmlspecialchars = require("htmlspecialchars");
const Kuroshiro = require("kuroshiro").default;
const fetch = require("isomorphic-fetch");
const xml2js = require("xml2js");
const YahooWebAnalyzer = require("../libs/kuroshiro-analyzer-yahoo-webapi-nodejs");
const {
  REGEX_JAPANESE,
  REGEX_ENGLISH,
} = require("../client/language_functions");

const {
  getStrType,
  toRawHiragana,
  isKatakana,
  isKanji,
  toRawKatakana,
} = require("kuroshiro/lib/util");

const YAHOO_JAPANESE_ANALYZE_API = "http://jlp.yahooapis.jp/MAService/V2/parse";
const YAHOO_JAPANESE_CORRECT_API =
  "https://jlp.yahooapis.jp/KouseiService/V1/kousei";
// https://developer.yahoo.co.jp/webapi/jlp/jim/v2/conversion.html
const YAHOO_JAPANESE_KANAKANJI_API =
  "https://jlp.yahooapis.jp/JIMService/V2/conversion";
// https://developer.yahoo.co.jp/webapi/jlp/kousei/v2/kousei.html
const YAHOO_JAPANESE_FIX_API =
  "https://jlp.yahooapis.jp/KouseiService/V2/kousei";
const xmlParser = new xml2js.Parser({ explicitArray: false });

let kuroshiro;
let yahooApiAppId = "";

async function initJapaneseAnalyzer({ yahooAppId }) {
  if (!kuroshiro) {
    yahooApiAppId = yahooAppId;
    kuroshiro = new Kuroshiro();
    await kuroshiro.init(
      new YahooWebAnalyzer({
        appId: yahooAppId,
      })
    );
  }
  return kuroshiro;
}

async function kuroshiroConvert(str, options) {
  return await kuroshiro.convert(str, { to: "hiragana", mode: "furigana" });
}

// https://developer.yahoo.co.jp/webapi/jlp/ma/v1/parse.html
const IGNORE_WORD_TYPES = [
  "特殊",
  "未定義語",
  // "接頭辞",
  // "助動詞",
  // "助詞",
  // "接尾辞",
  // "接続詞"
];

async function furiganaAnalyzeTextOnly(str, options) {
  let tokens = await analyzeJapaneseText(str, options);
  let result = "";
  for (let i = 0; i < tokens.length; i++) {
    if (
      !tokens[i][2].match(REGEX_ENGLISH) &&
      IGNORE_WORD_TYPES.indexOf(tokens[i][3]) == -1
    ) {
      let title = tokens[i][2];
      if (tokens[i][1] && tokens[i][1] != tokens[i][2]) {
        title += ` (${tokens[i][1]})`;
      }
      title += ` (${tokens[i][3]})`;
      result += `<span ${
        options.lp != null
          ? options.lp == 1
            ? `data-lp="1" `
            : `data-nolp="1" `
          : ""
      }data-word="${htmlspecialchars(
        tokens[i][2]
      )}" data-word-type="${htmlspecialchars(
        tokens[i][3]
      )}" data-word-reading="${htmlspecialchars(
        tokens[i][1]
      )}" title="${title}">${tokens[i][0]}</span>`;
    } else {
      result += tokens[i][0];
    }
  }
  return result;
}

async function furiganaWithAnalyzeText(str, options = {}) {
  let tokens = await analyzeJapaneseText(str, options);
  let notations = [];
  let flag;
  for (let i = 0; i < tokens.length; i++) {
    const strType = getStrType(tokens[i][0]);
    switch (strType) {
      case 0:
        notations.push([
          tokens[i][0], // surface, 形態素の表記
          1,
          toRawHiragana(tokens[i][1]),
          tokens[i][1], // reading, 形態素の読みがな
          tokens[i][2], // base, 形態素の基本形表記
          0,
          tokens[i][3], // pos, 形態素の品詞
          tokens[i][1],
        ]);
        break;
      case 1:
        let pattern = "";
        let isLastTokenKanji = false;
        const subs = []; // recognize kanjis and group them
        for (let c = 0; c < tokens[i][0].length; c++) {
          if (isKanji(tokens[i][0][c])) {
            if (!isLastTokenKanji) {
              // ignore successive kanji tokens (#10)
              isLastTokenKanji = true;
              pattern += "(.*)";
              subs.push(tokens[i][0][c]);
            } else {
              subs[subs.length - 1] += tokens[i][0][c];
            }
          } else {
            isLastTokenKanji = false;
            subs.push(tokens[i][0][c]);
            pattern += isKatakana(tokens[i][0][c])
              ? toRawHiragana(tokens[i][0][c])
              : tokens[i][0][c];
          }
        }
        const reg = new RegExp(`^${pattern}$`);
        const matches = reg.exec(toRawHiragana(tokens[i][1]));
        flag = 1;
        if (matches) {
          let pickKanji = 1;
          for (let c1 = 0; c1 < subs.length; c1++) {
            if (isKanji(subs[c1][0])) {
              notations.push([
                subs[c1],
                1,
                matches[pickKanji],
                toRawKatakana(matches[pickKanji]),
                tokens[i][2],
                flag++,
                tokens[i][3],
                tokens[i][1],
              ]);
              pickKanji += 1;
            } else {
              notations.push([
                subs[c1],
                2,
                toRawHiragana(subs[c1]),
                toRawKatakana(subs[c1]),
                tokens[i][2],
                flag++,
                tokens[i][3],
                tokens[i][1],
              ]);
            }
          }
        } else {
          notations.push([
            tokens[i][0],
            1,
            toRawHiragana(tokens[i][1]),
            tokens[i][1],
            tokens[i][2],
            flag++,
            tokens[i][3],
            tokens[i][1],
          ]);
        }
        break;
      case 2:
        flag = 1;
        for (let c2 = 0; c2 < tokens[i][0].length; c2++) {
          notations.push([
            tokens[i][0][c2],
            2,
            toRawHiragana(tokens[i][1][c2]),
            tokens[i][1][c2],
            tokens[i][2],
            flag++,
            tokens[i][3],
            tokens[i][1],
          ]);
        }
        break;
      case 3:
        flag = 1;
        for (let c3 = 0; c3 < tokens[i][0].length; c3++) {
          notations.push([
            tokens[i][0][c3],
            3,
            tokens[i][0][c3],
            tokens[i][0][c3],
            tokens[i][2],
            flag++,
            tokens[i][3],
            tokens[i][1],
          ]);
        }
        break;
      default:
        throw new Error("Unknown strType");
    }
  }
  let result = "";
  for (let n5 = 0; n5 < notations.length; n5++) {
    let flag =
      notations[n5][4] &&
      !notations[n5][4].match(REGEX_ENGLISH) &&
      IGNORE_WORD_TYPES.indexOf(notations[n5][6]) == -1;
    if (flag && notations[n5][5] <= 1) {
      let title = `${notations[n5][4]} (${notations[n5][6]})`;
      // baseform word
      result += `<span ${
        options.lp != null
          ? options.lp == 1
            ? `data-lp="1" `
            : `data-nolp="1" `
          : ""
      }${
        options.title == 1 ? `title="${htmlspecialchars(title)}" ` : ""
      }data-word="${htmlspecialchars(
        notations[n5][4]
      )}" data-word-type="${htmlspecialchars(
        notations[n5][6]
      )}" data-word-reading="${htmlspecialchars(notations[n5][7])}">`;
    }
    if (notations[n5][1] !== 1) {
      result += notations[n5][0];
    } else {
      result += `<ruby>${notations[n5][0]}<rp>(</rp><rt>${notations[n5][2]}</rt><rp>)</rp></ruby>`;
    }
    if (
      flag &&
      (notations[n5][5] == 0 ||
        n5 == notations.length - 1 ||
        notations[n5][5] >= notations[n5 + 1][5])
    ) {
      result += `</span>`;
    }
  }
  return result;
}

async function analyzeJapaneseText(str, options) {
  let res = await fetch(
    YAHOO_JAPANESE_ANALYZE_API + `?appid=${yahooApiAppId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // old 1.0 API
      // body: `response=surface,reading,pos,baseform,feature&results=ma&sentence=${encodeURIComponent(
      //   str
      // )}`,
      body: JSON.stringify({
        id: "1234-1",
        jsonrpc: "2.0",
        method: "jlp.maservice.parse",
        params: {
          q: str,
        },
      }),
    }
  );
  if (res.status != 200) {
    throw new Error(`${res.status} Error`);
  }

  res = await res.json();
  // console.log("analyze rersult ", res.result.tokens);
  let words = res.result.tokens;
  if (!Array.isArray(words)) {
    words = words ? [words] : [];
  }
  return words;
}

async function fixJapanese(q, options) {
  let res = await fetch(YAHOO_JAPANESE_FIX_API + `?appid=${yahooApiAppId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: "1",
      jsonrpc: "2.0",
      method: "jlp.kouseiservice.kousei",
      params: {
        q,
      },
    }),
  });
  if (res.status != 200) {
    throw new Error(`${res.status} Error`);
  }
  res = await res.json();
  if (res.error) {
    throw new Error(res.error.code + ": " + res.error.message);
  }
  return res.result.suggestions;
}

async function kanaKannji(str, options) {
  let res = await fetch(
    YAHOO_JAPANESE_KANAKANJI_API + `?appid=${yahooApiAppId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: "1",
        jsonrpc: "2.0",
        method: "jlp.jimservice.conversion",
        params: {
          q: str,
          format: "hiragana",
          mode: "kanakanji",
          option: [
            "hiragana",
            "katakana",
            "alphanumeric",
            "half_katakana",
            "half_alphanumeric",
          ],
          dictionary: ["base", "name", "place", "zip", "symbol"],
          results: 999,
        },
      }),
    }
  );
  if (res.status != 200) {
    throw new Error(`${res.status} Error`);
  }
  res = await res.json();
  if (res.error) {
    throw new Error(res.error.code + ": " + res.error.message);
  }
  return res.result.segment;
}

async function translate(str, options) {
  if (!config.IBM_CLOUD_APIKEY) {
    throw new Error("Not available because api key not found");
  }
  let isJa = REGEX_JAPANESE.test(str),
    source = isJa ? "ja" : "en",
    target = isJa ? "en" : "ja";
  if (options.target && options.target != source) {
    target = options.target;
  }
  let res = await fetch(
    config.IBM_TRANSLATOR_API_URL + "/v3/translate?version=2018-05-01",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization:
          "Basic " +
          Buffer.from("apikey" + ":" + config.IBM_CLOUD_APIKEY).toString(
            "base64"
          ),
      },
      body: JSON.stringify({
        text: str,
        source,
        target,
      }),
    }
  );
  if (res.status != 200) {
    throw new Error(`${res.status} Error`);
  }
  res = await res.json();
  return {
    source,
    target,
    translation: res.translations[0].translation,
  };
}

async function correctJapaneseText(str, options) {
  let res = await fetch(YAHOO_JAPANESE_CORRECT_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `appid=${yahooApiAppId}&sentence=${encodeURIComponent(str)}`,
  });
  if (res.status != 200) {
    throw new Error(`${res.status} Error`);
  }

  res = await res.text();
  res = await new Promise((resolve, reject) => {
    xmlParser.parseString(res, (err, resObj) => {
      if (err) return reject(err);
      let words = resObj.ResultSet.Result;
      if (!Array.isArray(words)) {
        words = words ? [words] : [];
      }
      resolve(words);
    });
  });
  return res;
}

module.exports = {
  translate,
  kanaKannji,
  fixJapanese,
  initJapaneseAnalyzer,
  furiganaAnalyzeTextOnly,
  furiganaWithAnalyzeText,
  kuroshiroConvert,
  analyzeJapaneseText,
  correctJapaneseText,
};
