module.exports = {
  SITENAME: "EBWeb",
  SHORTNAME: "EBWeb",
  CACHE_AGE: 86400,
  SHORT_CACHE_AGE: 120,
  MAX_DEFAULT: 100,
  MAX_CAP: 100,
  MAX_CAP2: 50,
  SITEID: "", // used as localStorage key and others. Should not change in production site.
  DEFAULTDICT: "", // The default dict. If not set, will use the first one in dicts list as default.
  DATE: "",
  OLD_STORAGE_KEY: "",
  REDIRECT_NON_CANONICAL_URL: 1,
  PROXY: 1,
  KEYWORDS: "",
  DESCRIPTION: "",
  IBM_CLOUD_APIKEY: "", // for IBM translate
  IBM_TRANSLATOR_API_URL: "", // IBM Language Translator-7p free API
  ROOTPATH: "/", // The "pathname" part of public URL of the site. eg: "/dict/"
  PUBLIC_URL: "", // The "origin" part of public URL of the site. eg:  "https://sakura-paris.org"
  REALROOT: "/", // If program running behind a reverse proxy (eg. nginx), the root path that program sees.
  // API_ENDPOINT: "https://sakura-paris.org/dict/", // connect to remote api (should be used for dev/test only)
  EBCLIENT_BIN: "./binary/ebclient", // path to ebclient binary. if both API_ENDPOINT and EBCLIENT_BIN are set, the later win.
  EBCLIENT_DICT_PATH: "./data-dicts", // path to eb dicts dir
  HOME_HTML: "",
  FOOTER_TEXT: ``,
  HOME_FOOTER_TEXT: ``,
  // GA: "UA-12345-1", // set to enable google analytics
  YAHOO_APPID: "", // yahoo.co.jp appid, for use Yahoo japanese morphological analyzer WebAPI
  DICTINFO: {
    audioDict: "NHK日本語発音アクセント辞典",
    audioDictEn: "研究社新英和中辞典",
    kannjiDict: "学研漢和大字典",
    dicts: [
      {
        // appendix: "kojien4-2.2.tar.gz/kojien/appendix", (rename to furoku)
        name: "広辞苑第六版",
        id: "広辞苑",
        alias: "",
        gaijiMap: "KOJIEN.json",
      },
      {
        name: "三省堂　スーパー大辞林",
        id: "大辞林",
        alias: "",
        gaijiMap: "DAIJIRIN.json",
      },
      {
        name: "大辞泉",
        id: "大辞泉",
        alias: "",
        gaijiMap: "DAIJISEN.json",
      },
      {
        name: "ハイブリッド新辞林",
        id: "ハイブリッド新辞林",
        alias: "新辞林",
      },
      {
        name: "古語辞典",
        id: "学研古語辞典",
        alias: "古語",
        gaijiMap: "super_gakugei.json",
      },
      {
        name: "ＮＨＫ　日本語発音アクセント辞典",
        id: "NHK日本語発音アクセント辞典",
        alias: "発音",
        gaijiMap: "",
      },
      {
        name: "国語大辞典",
        id: "日本国語大辞典",
        alias: "日国",
        gaijiMap: "",
      },
      {
        name: "学研国語大辞典",
        id: "学研国語大辞典",
        alias: "学国",
        gaijiMap: "super_gakugei.json",
      },
      {
        name: "明鏡国語辞典　第二版",
        id: "明鏡国語辞典",
        alias: "明鏡",
        gaijiMap: "MEIKYOU2.json",
      },
      {
        name: "新明解国語辞典　第五版",
        id: "新明解国語辞典",
        alias: "新明解",
        gaijiMap: "SHINNMEIKAI5.json",
      },
      {
        name: "学研漢和大字典",
        id: "学研漢和大字典",
        alias: "漢和",
        gaijiMap: "super_gakugei.json",
      },
      {
        name: "中日大辞典（大修館）",
        id: "中日大辞典",
        alias: "中日",
        gaijiMap: "DXGCJDIC.json",
      },
      {
        name: "講談社日中",
        id: "講談社日中辞典",
        alias: "日中",
        gaijiMap: "DXGCJDIC.json",
      },
      {
        name: "小学館２",
        id: "小学館中日・日中辞典",
        alias: "中日日中",
        gaijiMap: "",
      },
      {
        name: "牛津双解英漢",
        id: "牛津英汉双解词典",
        alias: "英中",
        gaijiMap: "OXfull.json",
      },
      {
        name: "漢英字典",
        id: "漢英字典",
        alias: "漢英",
        gaijiMap: "",
      },
      {
        name: "英辞郎１０８",
        id: "英辞郎",
        alias: "",
        gaijiMap: "",
      },
      {
        name: "ＮＥＷ斎藤和英大辞典",
        id: "斎藤和英大辞典",
        alias: "和英",
        gaijiMap: "",
      },
      {
        name: "ジーニアス英和〈第３版〉・和英〈第２版〉辞典",
        id: "ジーニアス英和和英辞典",
        alias: "和英2",
        gaijiMap: "GENIUS.json",
      },
      {
        name: "研究社　新英和（第７版）・和英（第５版）中辞典",
        id: "研究社新英和中辞典",
        alias: "英和",
        gaijiMap: "KENE7J5.json",
      },
      {
        name: "ジーニアス英和大辞典",
        id: "ジーニアス英和大辞典",
        alias: "英和2",
        gaijiMap: "GENIUS_DAIEIWA.json",
      },
      {
        name: "研究社　新編英和活用大辞典",
        id: "研究社新編英和活用大辞典",
        alias: "英和3",
        gaijiMap: "",
      },
      {
        name: "研究社　リーダーズ英和辞典　第３版",
        id: "研究社リーダーズ英和辞典",
        alias: "英和4",
        gaijiMap: "Readers3.json",
      },
      {
        name: "ロイヤル英文法改訂新版",
        id: "ロイヤル英文法",
        alias: "英文法",
        gaijiMap: "",
      },
      {
        name: "Ｃｏｌｌｉｎｓ　ＣＯＢＵＩＬＤ　Ｅｎｇｌｉｓｈ　Ｄｉｃｔｉｏｎａｒｙ",
        id: "Collins Cobuild English Dictionary",
        alias: "英英",
      },
      {
        name: "三省堂　必携類語実用辞典",
        id: "三省堂類語辞典",
        alias: "類語",
        gaijiMap: "ruigo.json",
      },
      {
        name: "角川類語新辞典",
        id: "角川類語新辞典",
        alias: "類語2",
        gaijiMap: "",
      },
      {
        name: "日本語大シソーラス−類語検索大辞典",
        id: "日本語大シソーラス類語検索大辞典",
        alias: "類語3",
        gaijiMap: "",
      },
      {
        name: "三省堂　必携故事ことわざ・慣用句辞典",
        id: "三省堂慣用句辞典",
        alias: "慣用句",
        gaijiMap: "",
      },
      {
        name: "学研　用例でわかる慣用句辞典",
        id: "学研慣用句辞典",
        alias: "慣用句2",
        gaijiMap: "",
      },
      {
        name: "学研　用例でわかる故事ことわざ辞典",
        id: "学研故事ことわざ辞典",
        alias: "ことわざ",
        gaijiMap: "",
      },
      {
        name: "日本大百科",
        id: "日本大百科",
        alias: "百科",
        gaijiMap: "",
      },
      {
        name: "マグローヒル科学技術用語大辞典−第３版−",
        id: "マグローヒル科学技術用語大辞典",
        alias: "科学",
        gaijiMap: "",
      },
      {
        name: "日外３５万語科学技術用語大辞典",
        id: "日外35万語科学技術用語大辞典",
        alias: "科学2",
        gaijiMap: "",
      },
      {
        name: "南山堂医学大辞典第１８版ＥＰＷＩＮＧ版",
        id: "南山堂医学大辞典",
        alias: "医学",
        gaijiMap: "",
      },
      {
        name: "２５万語医学用語大辞典　英和／和英",
        id: "日外25万語医学用語大辞典",
        alias: "医外",
        gaijiMap: "",
      },
      {
        name: "理化学辞典第５版",
        id: "岩波理化学辞典",
        alias: "理化",
        gaijiMap: "RIKAGAKU.json",
      },
      {
        name: "自由国民社　法律用語辞典",
        id: "自由国民社法律用語辞典",
        alias: "法律",
        gaijiMap: "",
      },
      {
        name: "心理学辞典",
        id: "心理学辞典",
        alias: "心理",
        gaijiMap: "",
      },
    ],
    multiShortcuts: [
      [
        "薦",
        "広辞苑_小学館中日・日中辞典_三省堂類語辞典",
        "管理人のお薦め辞典セットを使用する",
      ],
      ["国", "広辞苑_明鏡国語辞典_新明解国語辞典", "国語辞典セットを使用する"],
      ["語", "大辞林_大辞泉_日本国語大辞典", "ほかの国語辞典セットを使用する"],
      [
        "学",
        "学研古語辞典_学研国語大辞典_学研漢和大字典",
        "学研辞典セットを使用する",
      ],
      [
        "中",
        "講談社日中辞典_小学館中日・日中辞典_中日大辞典",
        "中国語辞典セットを使用する",
      ],
      [
        "英",
        "英辞郎_研究社新英和中辞典_研究社新編英和活用大辞典",
        "英和・和英辞典セットを使用する",
      ],
      [
        "和",
        "ジーニアス英和和英辞典_斎藤和英大辞典_研究社リーダーズ英和辞典",
        "ほかの和英・英和辞典セットを使用する",
      ],
      [
        "類",
        "三省堂類語辞典_角川類語新辞典_日本語大シソーラス類語検索大辞典",
        "類語辞典セットを使用する",
      ],
      [
        "諺",
        "学研故事ことわざ辞典_三省堂慣用句辞典_学研慣用句辞典",
        "ことわざ辞典セットを使用する",
      ],
      ["百", "広辞苑_大辞林_日本大百科", "百科辞典セットを使用する"],
      [
        "科",
        "日外35万語科学技術用語大辞典_マグローヒル科学技術用語大辞典_岩波理化学辞典",
        "科学技術辞典セットを使用する",
      ],
      [
        "医",
        "南山堂医学大辞典_日外25万語医学用語大辞典_心理学辞典",
        "医学辞典セットを使用する",
      ],
    ],
  },
};
