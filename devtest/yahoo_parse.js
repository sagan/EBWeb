const fetch = require("node-fetch");
const xml2js = require("xml2js");
const xmlParser = new xml2js.Parser({ explicitArray: false });

const config = require("../config.loader");

// https://developer.yahoo.co.jp/webapi/jlp/ma/v1/parse.html

const API_URL = "http://jlp.yahooapis.jp/MAService/V1/parse";

(async () => {
  let str;
  str = "<span>彼</span>は成長しつつある。";

  let res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: `appid=${
      config.YAHOO_APPID
    }&response=surface,reading,pos,baseform,feature&results=ma&sentence=${encodeURIComponent(
      str
    )}`
  });

  res = await res.text();

  xmlParser.parseString(res, (err, resObj) => {
    console.log("result", JSON.stringify(resObj.ResultSet.ma_result, null, 2));
  });
})();

/*
"花が咲いている"
result {
  "total_count": "5",
  "filtered_count": "5",
  "word_list": {
    "word": [
      {
        "surface": "花",
        "reading": "はな",
        "pos": "名詞",
        "baseform": "花",
        "feature": "名詞,名詞,*,花,はな,花"
      },
      {
        "surface": "が",
        "reading": "が",
        "pos": "助詞",
        "baseform": "が",
        "feature": "助詞,格助詞,*,が,が,が"
      },
      {
        "surface": "咲い",
        "reading": "さい",
        "pos": "動詞",
        "baseform": "咲く",
        "feature": "動詞,カ五,連用タ接続,咲い,さい,咲く"
      },
      {
        "surface": "て",
        "reading": "て",
        "pos": "助詞",
        "baseform": "て",
        "feature": "助詞,接続助詞,*,て,て,て"
      },
      {
        "surface": "いる",
        "reading": "いる",
        "pos": "助動詞",
        "baseform": "いる",
        "feature": "助動詞,助動詞一段,基本形,いる,いる,いる"
      }
    ]
  }
}

走った
result {
  "total_count": "2",
  "filtered_count": "2",
  "word_list": {
    "word": [
      {
        "surface": "走っ",
        "reading": "はしっ",
        "pos": "動詞",
        "baseform": "走る",
        "feature": "動詞,ラ五,連用タ接続,走っ,はしっ,走る"
      },
      {
        "surface": "た",
        "reading": "た",
        "pos": "助動詞",
        "baseform": "た",
        "feature": "助動詞,助動詞た,基本形,た,た,た"
      }
    ]
  }
}

*/