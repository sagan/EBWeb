const Kuroshiro = require("kuroshiro");
// const YahooWebAnalyzer = require("kuroshiro-analyzer-yahoo-webapi");
const YahooWebAnalyzer = require("../libs/kuroshiro-analyzer-yahoo-webapi-nodejs");
const config = require("../config.loader");

let analyzer = new YahooWebAnalyzer({
  appId: config.YAHOO_APPID
});

let kuroshiro = new Kuroshiro(analyzer);

(async () => {
  await kuroshiro.init(analyzer);
  let result = await kuroshiro.convert(
    `<p title="">

Deutschland ドイツ)中部ヨーロッパのゲルマン民族を中心とする国家。古代にはゲルマニアと称した。中世、神聖ローマ帝国の一部をなしたが、封建諸侯が割拠。16世紀以降、宗教改革・農民戦争・三十年戦争・ナポレオン軍侵入などを経て国民国家の形成に向かい、1871年プロイセンを盟主とするドイツ帝国が成立。のち第一次大戦に敗れて（ワイマール）共和国になったが、1933年ナチスが独裁政権を樹立して侵略政策を強行、第二次大戦を誘発、45年降伏、49年東西に分裂。90年ドイツ連邦共和国として統一。言語はドイツ語で、新教徒が旧教徒よりやや多い。


    </p>`,
    { to: "hiragana", mode: "furigana" }
  );
  console.log("result", result);
})();
