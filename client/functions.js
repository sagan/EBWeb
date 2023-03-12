const path = require("path");
const queryString = require("query-string");
const fetch = require("isomorphic-fetch");
const htmlspecialchars = require("htmlspecialchars");
const { defaultUserConfig, _c } = require("./userConfig");

const hepburn = require("../libs/hepburn");
const {
  REGEX_HIRAGANA,
  REGEX_ENGLISH,
  REGEX_NON_ENGLISH,
} = require("./language_functions");

const REGEX_TO_GIONNGO = /^(([\u3040-\u309F]|[\u30A0-\u30FF])+)（と）$/i;
const REGEX_PARSE_TITLE =
  /([^【】〖〗{}（）〔〕()]*?)(【(.*?)】|〖(.*?)〗|{(.*?)}|（(.*?)）|〔(.*?)〕|\((.*?)\))/gi;
const REGEX_PARSE_TITLE_ENGLISH = /^([-,.:;!?\sa-zA-Z0-9]+?)\s*\/[^\/]+\/$/;

const TYPES = {
  0: "prefix",
  1: "suffix",
  2: "exact",
};

const TYPES_REVERSE = {
  prefix: 0,
  suffix: 1,
  exact: 2,
};

function __user_config_effect__(userConfig, userConfigLocal) {
  if (window.__MATCH_MEDIAS__) {
    window.__MATCH_MEDIAS__.forEach(function (match) {
      match.removeListener(window.__MATCH_MEDIA_CB__);
    });
  }
  window.__MATCH_MEDIAS__ = [];
  window.__MATCH_MEDIA_CB__ = matchMediaCb;
  var forcePCMode =
    userConfigLocal.forcePCMode !== undefined
      ? userConfigLocal.forcePCMode
      : userConfig.forcePCMode;
  var pcModeMinWidth =
    userConfigLocal.pcModeMinWidth !== undefined
      ? userConfigLocal.pcModeMinWidth
      : userConfig.pcModeMinWidth;
  var forcePCMode2MinWidth =
    userConfigLocal.forcePCMode2MinWidth !== undefined
      ? userConfigLocal.forcePCMode2MinWidth
      : userConfig.forcePCMode2MinWidth;
  var furiganaMode =
    userConfigLocal.furiganaMode !== undefined
      ? userConfigLocal.furiganaMode
      : userConfig.furiganaMode || 0;
  var colorScheme =
    userConfigLocal.colorScheme !== undefined
      ? userConfigLocal.colorScheme
      : userConfig.colorScheme || 0;
  matchMediaCb();
  if (forcePCMode != 1 && forcePCMode != 3) {
    window.__MATCH_MEDIAS__.push(
      window.matchMedia("(min-width: " + (pcModeMinWidth || 1024) + "px)")
    );
    if (forcePCMode == 2) {
      window.__MATCH_MEDIAS__.push(
        window.matchMedia("(min-width: " + (forcePCMode2MinWidth || 0) + "px)"),
        window.matchMedia(" (min-aspect-ratio: 14/9)")
      );
    } else if (forcePCMode == 4) {
      window.__MATCH_MEDIAS__.push(
        window.matchMedia(" (min-aspect-ratio: 14/9)")
      );
    }
  }
  window.__MATCH_MEDIAS__.forEach(function (match) {
    match.addListener(matchMediaCb);
  });
  document.body.dataset.deviceId = userConfig.deviceId || "";
  document.body.classList.remove("g-furigana", "g-no-furigana");
  if (furiganaMode <= 1) {
    document.body.classList.add("g-furigana");
  } else {
    document.body.classList.add("g-no-furigana");
  }

  if (userConfig.multiDictsAlwaysUse) {
    document.body.classList.add("g-mdau");
  } else {
    document.body.classList.remove("g-mdau");
  }
  if (userConfig.multiDictsAlwaysUse == 2) {
    document.body.classList.add("g-mdau-lw");
  } else {
    document.body.classList.remove("g-mdau-lw");
  }
  if (userConfig.multiDictsShortcutsHideDefault) {
    document.body.classList.add("g-mdshd");
  } else {
    document.body.classList.remove("g-mdshd");
  }

  document.body.dataset.userConfigProfile =
    window.__USERCONFIG_PROFILE__ || "default";
  if (
    !window.__USERCONFIG_PROFILES__ ||
    window.__USERCONFIG_PROFILES__.length <= 1
  ) {
    document.body.classList.add("g-noucps");
  } else {
    document.body.classList.remove("g-noucps");
  }

  function matchMediaCb() {
    var pcMode = true;
    var darkMode = false;
    var hasEnoughWidth = true;
    var hasLandscapeEnoughWidth = true;
    var isLandscape = true;
    var standaloneMode = window.matchMedia(
      "(display-mode: standalone)"
    ).matches;
    if (
      (!colorScheme &&
        window.matchMedia("(prefers-color-scheme: dark)").matches) ||
      colorScheme == 1
    ) {
      darkMode = true;
    }
    if (forcePCMode == 3) {
      pcMode = false;
    } else if (forcePCMode != 1) {
      hasEnoughWidth = window.matchMedia(
        "(min-width: " + (pcModeMinWidth || 1024) + "px)"
      ).matches;
      isLandscape = window.matchMedia("(min-aspect-ratio: 14/9)").matches;
      switch (forcePCMode) {
        case 2:
          hasLandscapeEnoughWidth = window.matchMedia(
            "(min-width: " + (forcePCMode2MinWidth || 0) + "px)"
          ).matches;
          pcMode = isLandscape ? hasLandscapeEnoughWidth : hasEnoughWidth;
          break;
        case 4:
          pcMode = !isLandscape ? false : hasEnoughWidth;
          break;
        default:
          pcMode = hasEnoughWidth;
          break;
      }
    }
    document.body.classList.remove("g-nojs");
    document.body.classList.remove("g-auto", "g-pv", "g-mv");
    if (pcMode) {
      document.body.classList.add("g-pv");
    } else {
      document.body.classList.add("g-mv");
    }
    if (darkMode) {
      document.body.classList.add("g-dark");
    } else {
      document.body.classList.remove("g-dark");
    }
    if (standaloneMode) {
      document.body.classList.add("g-sa");
    } else {
      document.body.classList.remove("g-sa");
    }
  }
}

function __get_state_css__(userConfig) {
  var css = "";
  if (userConfig) {
    if (
      userConfig.contentWidth !== undefined &&
      userConfig.contentWidth !== "__"
    ) {
      var maxWidth = "";
      if (typeof userConfig.contentWidth == "number") {
        maxWidth =
          (userConfig.contentWidth || defaultUserConfig.contentWidth) + "px";
      } else if (userConfig.contentWidth == "full") {
        maxWidth = "none";
      }
      if (maxWidth) {
        css +=
          ".g-pv article.single-dict { max-width: " +
          maxWidth +
          " !important; }\n";
      }
    }
    if (userConfig.columnWidth && userConfig.columnWidth !== "__") {
      css +=
        "article.single-dict .dict-content { column-width: " +
        (typeof userConfig.columnWidth == "number"
          ? userConfig.columnWidth + "px"
          : userConfig.columnWidth) +
        "; }\n";
    }
    if (userConfig.css) {
      css += userConfig.css;
    }
    if (userConfig.sitename) {
      css +=
        "body.g-pv h1#sitetitle { font-size: " +
        "min(max(calc( ( 20vw - 10px ) / " +
        userConfig.sitename.length +
        " ), 1em), 2em)" +
        "; }\n";
    }
  }
  return css;
}

// todo: correctly process "ドイツ-がっこうてつがく【―学校哲学】" style title (in 大辞林)
// generate page title and other meta
function getPageMeta(config, dicts, { local, q, dict, page, offset }, words) {
  let title = config.SITENAME,
    description = config.DESCRIPTION,
    keywords = config.KEYWORDS,
    sitename = config.SITENAME;

  let index = dicts.indexOf(dict);

  if (local) {
    switch (local) {
      case "history":
        title = `使用履歴 - ${sitename}`;
        break;
      case "notebook":
        title = `単語帳 - ${sitename}`;
        break;
      case "cloud":
        title = `クラウド - ${sitename}`;
        break;
      default:
        break;
    }
  } else {
    if (q) {
      if (index) {
        title = `「${q}」の検索結果 - ${sitename} ${dict}`;
      } else {
        title = `「${q}」の検索結果 - ${sitename}`;
      }
      description = `${dict}で「${q}」を検索した結果です。`;
      keywords = `${q},辞書,辞典,国語辞典,国語辞書`;
    } else if (page != null) {
      if (offset != null) {
        if (words.length > 0) {
          let wordInfo = parseEbTitle(words[0].heading);
          let wordTitleText = eb2textpurge(words[0].heading);
          if (index) {
            title = `${wordTitleText} - ${sitename} ${dict}`;
          } else {
            title = `${wordTitleText} - ${sitename}`;
          }
          keywords = `${wordInfo.keyword},${wordInfo.hiragana},${wordTitleText},${dict}`;
          description = eb2textpurge(words[0].text).replace(/\r?\n/g, " ");
          if (description.length > 70) {
            description = description.slice(0, 67) + "...";
          }
        }
      } else {
        title = `${dict} ページ ${page} - ${sitename}`;
        keywords = `${dict},辞書,辞典,国語辞典,国語辞書`;
        description = `${dict}のページ${page}の内容です。`;
      }
    } else {
      if (index) {
        title = `${sitename} ${dict}`;
        keywords = `${dict},辞書,辞典,国語辞典,国語辞書`;
        description = `${dict}の内容を無料で閲覧する。`;
      }
    }
  }

  // console.log("getPageMeta", dicts, dict, q, title);
  return { title, description, keywords };
}

function eb2textpurge(text) {
  return text
    .replace(
      /\[\/?(decoration|emphasis|subscript|superscript|reference|keyword|mono|image|wav).*?\]/g,
      ""
    )
    .replace(/\{\{(h|z)([a-f0-9]{4,})\}\}/gi, "") // clear gaiji
    .trim();
}

function eb2textclean(text, removeGaiji) {
  text = text
    .replace(/\[\/?(decoration|emphasis|keyword).*?\]/g, "")
    .replace(
      /\[(reference|subscript|superscript|mono|image|wav).*?\][\s\S]*?\[\/\1.*?\]/g,
      ""
    );
  if (removeGaiji) {
    text = text.replace(/\{\{(h|z)([a-f0-9]{4,})\}\}/gi, "");
  }
  text = text.trim();
  return text;
}

function wordId(word) {
  return encodeURIComponent(eb2textpurge(word.heading).replace(/ /g, "_"));
}

function wordDictId(word, dict) {
  return `${word.page}_${word.offset}`;
}

// eb text 2 html
// input: bbcode style
// keyword,reference
function ebtext2html(text, baseurl, dict) {
  // let s = text.replace(/\r?\n/g, "<br />");
  let s = text.replace(
    /\[(\/)?(decoration|emphasis|subscript|superscript|keyword)\]/g,
    _replacer
  );
  s = s.replace(
    /\[reference\]([\s\S]*?)\[\/reference page=(\d+),offset=(\d+)\]/g,
    referehce_replacer
  );
  s = s.replace(
    /\[image format=([a-zA-Z0-9]+),inline=(\d+),page=(\d+),offset=(\d+)\]([\s\S]*?)\[\/image\]/g,
    image_replacer
  );
  s = s.replace(
    /\[mono width=(\d+),height=(\d+)\]([\s\S]*?)\[\/mono page=(\d+),offset=(\d+)\]/g,
    mono_replacer
  );
  s = s.replace(
    /\[wav page=(\d+),offset=(\d+),endpage=(\d+),endoffset=(\d+)\]([\s\S]*?)\[\/wav\]/g,
    wav_replacer
  );
  s = s.replace(/\{\{(h|z)([a-f0-9]{4,})\}\}/gi, gaiji_image_replacer);
  return s;

  function gaiji_image_replacer(match, type, q) {
    return `<img class="inline gaiji gaiji-${type}" src="${baseurl}${encodeURIComponent(
      dict
    )}/binary/gaiji_${type == "z" ? 1 : 0}_${q}.png" />`;
  }

  function referehce_replacer(match, text, page, offset) {
    return `<a href="${baseurl}${encodeURIComponent(
      dict
    )}/content/${page}_${offset}">${text}</a>`;
  }

  function image_replacer(match, binary, inline, page, offset, text) {
    inline = parseInt(inline);
    let delimeter = inline ? "" : "\n";
    let text2 = text.replace(/\{\{(h|z)([a-f0-9]{4,})\}\}/gi, "");
    return `${text}${delimeter}<img title="${stripHtmlTag(text2)}" class="${
      inline ? "inline" : ""
    }" src="${baseurl}${encodeURIComponent(
      dict
    )}/binary/${page}_${offset}.${binary}" />${delimeter}`;
  }

  function mono_replacer(match, width, height, text, page, offset) {
    let delimeter = "\n";
    return `${text}${delimeter}<img title="${stripHtmlTag(
      text
    )}" src="${baseurl}${encodeURIComponent(
      dict
    )}/binary/mono_${page}_${offset}_${width}_${height}.bmp" />${delimeter}`;
  }

  function wav_replacer(match, page, offset, endpage, endoffset, text) {
    let delimeter = " ";
    return `${text}${delimeter}<audio controls preload="none" title="${stripHtmlTag(
      text
    )}"><source src="${baseurl}${encodeURIComponent(
      dict
    )}/binary/${page}_${offset}_${endpage}_${endoffset}.wav" type="audio/wav"><source src="${baseurl}${encodeURIComponent(
      dict
    )}/binary/${page}_${offset}_${endpage}_${endoffset}.mp3" type="audio/mpeg"></audio>${delimeter}`;
  }
}

function getCanonicalUrlSearch(state, defaultDict) {
  let { local, tag, q, romaji, type, dict, page, offset, dicts, dictid, id } =
    state;

  if (dictid) {
    let info = dictid.split("_");
    if (info.length == 3) {
      dict = info[0];
      page = info[1];
      offset = info[2];
    }
  }

  if (local) {
    let qs = queryString.stringify({ tag });
    return `${encodeURIComponent(local)}/` + (qs ? `?${qs}` : "");
  }

  if (romaji != null) {
    q = normalizeQ(q, romaji);
  }
  if (dicts && dicts.length) {
    if (!defaultDict) {
      defaultDict = dicts[0];
    }
    if (dict && dict.indexOf("_") == -1 && dicts.indexOf(dict) == -1) {
      dict = dicts[0];
    }
  }
  if (!TYPES[type]) {
    type = 0;
  }
  if (dict) {
    dict = dict.replace(/[+]/g, "_");
  }

  let params = {};
  if (!romaji) {
    params.romaji = 0;
  }
  if (type) {
    params.type = type;
  }
  let paramKeys = Object.keys(params);
  let paramStr = paramKeys.length
    ? "?" + paramKeys.map((key) => `${key}=${params[key]}`).join("&")
    : "";

  if (id) {
    return `${encodeURIComponent(dict)}/content/${id}`;
  } else if (page != null) {
    if (offset != null) {
      return `${encodeURIComponent(dict)}/content/${page}_${offset}`;
    } else {
      return `${encodeURIComponent(dict)}/page/${page}`;
    }
  } else if (q) {
    return `${encodeURIComponent(dict)}/${TYPES[type]}/${encodeURIComponent(
      q
    )}`;
  } else {
    if (dict && dict !== defaultDict) {
      return `${encodeURIComponent(dict)}/` + paramStr;
    }
  }
  return paramStr;
}

// parse getCanonicalUrlSearch output
function parseSitePath(relativePath) {
  let params = {};
  let match = relativePath.match(
    /^([^\/]+)\/((prefix|suffix|exact|content|page|binary)\/(.*))?$/
  );
  if (match) {
    params.dict = decodeURIComponent(match[1]);
    if (match[2]) {
      if (match[3] == "content") {
        let [page, offset] = match[4].split("_").map(parseFloat);
        params.page = page;
        params.offset = offset;
      } else if (match[3] == "page") {
        params.page = parseInt(match[4]);
      } else if (match[3] == "binary") {
        let type = path.extname(match[4]);
        let basename = path.basename(match[4], type);
        let _params = basename.split("_").filter((a) => a);
        type = type.slice(1);
        if (type && _params.length) {
          if (!_params[0].match(/^\d+$/)) {
            params.binary = _params[0];
            _params = _params.slice(1);
          } else {
            switch (type) {
              case "mp3":
                params.binary = "wav";
                break;
              default:
                // wav, bmp, jpg
                params.binary = type;
                break;
            }
          }
          switch (params.binary) {
            case "gaiji": //png. type,q
              params.type = parseInt(_params[0]);
              params.q = _params[1];
              break;
            case "mono": //bmp. page,offset,width,height
              params.page = parseInt(_params[0]);
              params.offset = parseInt(_params[1]);
              params.width = parseInt(_params[2]);
              params.height = parseInt(_params[3]);
              break;
            case "wav":
            case "mp3": // page,offset,endpage,endoffset
              params.page = parseInt(_params[0]);
              params.offset = parseInt(_params[1]);
              params.endpage = parseInt(_params[2]);
              params.endoffset = parseInt(_params[3]);
              break;
            default:
              // page,offset
              params.page = parseInt(_params[0]);
              params.offset = parseInt(_params[1]);
              break;
          }
        }
      } else {
        params.type = TYPES_REVERSE[match[3]];
        params.q = decodeURIComponent(match[4]);
      }
    }
  }
  if (
    params.dict == "history" ||
    params.dict == "notebook" ||
    params.dict == "cloud"
  ) {
    params.local = params.dict;
    delete params.dict;
  }
  return params;
}

const _tags = {
  decoration: ["<b>", "</b>"],
  emphasis: ["<em>", "</em>"],
  subscript: ["<sub>", "</sub>"],
  superscript: ["<sup>", "</sup>"],
  keyword: ["<mark>", "</mark>"],
};

function _replacer(match, closing, tag) {
  return _tags[tag][closing ? 1 : 0];
}

function normalizeQ(q, romaji) {
  if (!q) return "";
  q = q.replace(/-/g, "").slice(0, 128).trim();
  if (!romaji) return q;
  return romajiConvert(q);
}

function romajiConvert(q) {
  let newq = hepburn.toHiragana(hepburn.cleanRomaji(q));
  if (newq.match(/[a-z]/i)) {
    return q;
  }
  return newq;
}

function getQueryRomaji(q, defaultQ = 1) {
  if (defaultQ == 0) {
    return 0;
  }
  return normalizeQ(q, 0) == normalizeQ(q, 1) ? 1 : 0;
}

function stripHtmlTag(str) {
  return str.replace(/<\/?[^>]+(>|$)/g, "");
}

// ドイツ‐あやめ【ドイツ菖蒲】 => ドイツ菖蒲
function parseEbTitle(title) {
  let text = eb2textclean(title, true);

  while (true) {
    let replacedTxt = text.replace(
      /([\u3040-\u309F]|[\u30A0-\u30FF])([-‐])([\u3040-\u309F]|[\u30A0-\u30FF])/,
      "$1$3"
    );
    if (replacedTxt == text) {
      break;
    }
    text = replacedTxt;
  }

  let hiragana = "",
    kannji = "",
    keyword;
  let match,
    lastIndex = 0,
    reverseMode;

  if ((match = REGEX_PARSE_TITLE_ENGLISH.exec(text))) {
    keyword = match[1];
    return { hiragana, kannji, keyword, text, lang: "en" };
  }

  if ((match = REGEX_TO_GIONNGO.exec(text))) {
    keyword = hiragana = match[1];
    return { hiragana, kannji, keyword, text };
  }

  do {
    match = REGEX_PARSE_TITLE.exec(text);
    if (match) {
      let part2 =
        match[3] || match[4] || match[5] || match[6] || match[7] || match[8];
      if (reverseMode == null) {
        reverseMode = match[1] && !REGEX_HIRAGANA.test(match[1]);
      }
      // console.log("match", match[1] || "-", part2 || "-", reverseMode)
      if (reverseMode) {
        hiragana += part2.replace(/\‐/g, "");
        kannji += match[1].split("・")[0];
      } else {
        hiragana += match[1].replace(/\‐/g, "");
        kannji += part2.split("・")[0];
      }
      lastIndex = REGEX_PARSE_TITLE.lastIndex;
    }
  } while (match);
  REGEX_PARSE_TITLE.lastIndex = 0;

  if (reverseMode) {
    kannji += text.slice(lastIndex);
  } else {
    hiragana += text.slice(lastIndex);
  }

  if (kannji.match(REGEX_ENGLISH) && kannji.match(REGEX_NON_ENGLISH)) {
    keyword = hiragana;
  } else {
    keyword = kannji || hiragana;
  }

  return { hiragana, kannji, keyword, text };
}

async function fetchJson(url, params, options = {}) {
  if (params) {
    url += (url.indexOf("?") == -1 ? "?" : "&") + queryString.stringify(params);
  }
  let res = await fetch(url, options);
  if (res.status != 200 && res.status != 0) {
    // ie polyfill fetch set res.status to 0
    throw new Error(`Server return status ${res.status}`);
  }
  // let data = await res.text();
  // console.log("fetchJson data: ", data);
  // return JSON.parse(data);
  return await res.json();
}

// https://foosoft.net/projects/anki-connect/
async function ankiRequest(data, key, addr) {
  if (key) {
    data.key = key;
  }
  let req = await fetch(addr || _c("ankiConnectAddr"), {
    method: "POST",
    mode: "cors",
    body: JSON.stringify(data),
  });
  let res = await req.json();
  // console.log("--", res);
  if (res.error && res.error.indexOf(" name already exists") == -1) {
    throw new Error(`AnkiConnect error: ${res.error}`);
  }
  return res.result;
}

function sleep(miliseconds) {
  return new Promise((resolve) => setTimeout(resolve, miliseconds));
}

const debounce = (func, delay) => {
  let inDebounce;
  return function () {
    const context = this;
    const args = arguments;
    clearTimeout(inDebounce);
    inDebounce = setTimeout(() => func.apply(context, args), delay);
  };
};

function wordGlobalId(word, dict) {
  if (typeof word != "object") {
    return word;
  }
  return `${dict}_${wordDictId(word, dict)}`;
}

function getWordNote({ word, dict }) {
  let dictid = wordGlobalId(word, dict);
  let wordInfo = parseEbTitle(word.heading);
  let noteData = {
    dictid,
    title: wordInfo.keyword,
    heading: wordInfo.text,
    content: eb2textpurge(word.text),
    comment: "",
    tag: [],
  };
  return noteData;
}

function uniqueFilter(value, index, self) {
  return self.indexOf(value) === index;
}

function cancelEvent(e) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }
}

function checkEventModifierKey(e, key) {
  return (
    (key == "Control" && e.ctrlKey) ||
    (key == "Alt" && e.altKey) ||
    (key == "Shift" && e.shiftKey)
  );
}

function updateArrayState(state, updates, deletes, pk) {
  updates = updates || [];
  deletes = deletes || [];
  pk = pk || "id";
  if (updates.length || deletes.length) {
    state = state.slice();
    updates.forEach((update) => {
      let i = state.findIndex((item) => item[pk] === update[pk]);
      if (i == -1) {
        state.unshift(update);
      } else {
        state.splice(i, 1, update);
      }
    });
    deletes.forEach((pkValue) => {
      let i = state.findIndex((item) => item[pk] === pkValue);
      if (i != -1) {
        state.splice(i, 1);
      }
    });
  }
  return state;
}

function datePlusDays(date, plusdays = 0) {
  return new Date(date.getTime() + 86400 * 1000 * plusdays);
}

function formatTime(
  time,
  { plusdays = 0, date = false, noseconds = false } = {}
) {
  if (time == undefined) {
    time = new Date();
  } else if (typeof time != "object") {
    time = new Date(time);
  }
  if (plusdays) {
    time = datePlusDays(time, plusdays);
  }
  let year = 1900 + time.getYear();
  let month = (1 + time.getMonth()).toString().padStart(2, "0");
  let day = time.getDate().toString().padStart(2, "0");
  let hours = time.getHours().toString().padStart(2, "0");
  let minutes = time.getMinutes().toString().padStart(2, "0");
  let seconds = time.getSeconds().toString().padStart(2, "0");
  return date
    ? `${year}-${month}-${day}`
    : noseconds
    ? `${year}-${month}-${day} ${hours}:${minutes}`
    : `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function parseUrl(
  addr,
  { protocol = "http:", hostname = "localhost", href = "", port = 80 } = {}
) {
  if (!addr) {
    return href || protocol + "//" + hostname + ":" + port;
  }
  {
    addr = addr.trim();
    if (addr.match(/^\d+$/g)) {
      // port
      addr = protocol + "//" + hostname + ":" + addr;
    } else if (addr.indexOf("://") != -1) {
      // full url
      // do nothing
    } else if (addr.indexOf(":") != -1) {
      // hostname:port
      addr = protocol + "//" + addr;
    } else {
      // hostname
      addr = protocol + "//" + addr + ":" + port;
    }
    return addr;
  }
}

function multiDictsArray2String(dicts) {
  dicts = dicts.filter((dict) => dict && dict != "_");
  let str = dicts.join("_");
  if (dicts.length < 2) {
    str += "_";
  }
  return str;
}

function multiDictsString2Array(str, fixedLen = 0) {
  let dicts = str.split("_").filter((dict) => dict);
  while (dicts.length < fixedLen) {
    dicts.push("_");
  }
  return dicts;
}

module.exports = {
  TYPES,
  TYPES_REVERSE,
  __user_config_effect__,
  __get_state_css__,
  multiDictsArray2String,
  multiDictsString2Array,
  checkEventModifierKey,
  updateArrayState,
  debounce,
  cancelEvent,
  uniqueFilter,
  parseUrl,
  sleep,
  getPageMeta,
  wordId,
  wordDictId,
  wordGlobalId,
  getWordNote,
  eb2textpurge,
  eb2textclean,
  ebtext2html,
  stripHtmlTag,
  normalizeQ,
  romajiConvert,
  getQueryRomaji,
  parseEbTitle,
  getCanonicalUrlSearch,
  parseSitePath,
  formatTime,
  datePlusDays,
  ankiRequest,
  fetchJson,
};
