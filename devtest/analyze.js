const fetch = require("isomorphic-fetch");
const { YAHOO_APPID } = require("../config.loader.js");

let str = `リクエストURLが変わります`;

const YAHOO_JAPANESE_ANALYZE_API = "http://jlp.yahooapis.jp/MAService/V1/parse";
const yahooApiAppId = YAHOO_APPID;

(async () => {
  let res = await fetch(YAHOO_JAPANESE_ANALYZE_API + `?appid=${yahooApiAppId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `appid=${yahooApiAppId}&response=surface,reading,pos,baseform,feature&results=ma&sentence=${encodeURIComponent(
      str
    )}`,
  });
  if (res.status != 200) {
    throw new Error(`${res.status} Error`);
  }

  res = await res.text();
  console.log("status: ", res.status);
  console.log("data", JSON.stringify(res, null , 4));
})();
