const { REGEX_ENGLISH_FULL } = require("./language_functions");
const { TYPES_REVERSE } = require("./functions.js");

function isElementInViewport(el) {
  var rect = el.getBoundingClientRect();

  return (
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.left <
      (window.innerWidth ||
        document.documentElement.clientWidth) /* or $(window).width() */ &&
    rect.top <
      (window.innerHeight ||
        document.documentElement.clientHeight) /* or $(window).height() */
  );
}

function fixFocus(el, mode) {
  switch (mode) {
    case "always":
      return focusIfInVP(el, true);
      break;
    case "none":
      break;
    default:
      return focusIfInVP(el);
  }
}

function focusIfInVP(el, includeMobile) {
  if (typeof el == "string") {
    el = document.querySelector(el);
  }
  // disable for mobile devices which has soft keyboard
  if (!el || (!includeMobile && isMobile())) {
    return;
  }
  if (el && isElementInViewport(el)) {
    el.focus();
    el.selectionStart = el.selectionEnd = el.value.length;
  }
}

function isMobile() {
  return (
    (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/.test(
      window.navigator.userAgent
    ) &&
      "ontouchstart" in window) ||
    isMobileView()
  );
}

function isMobileView() {
  return document.body.classList.contains("g-mv");
}

const INNER_LINK_REGEX = /^(.+)\/content\/(\d+)_(\d+)$/;
const INNER_SEARCH_LINK_REGEX = /^(.+)\/(exact|prefix|suffix)\/(.*)$/;
const IGNORE_WORD_TYPES = [
  "特殊",
  "接頭辞",
  "助動詞",
  "助詞",
  "接尾辞",
  "接続詞",
];
function getLivepreviewEventInfo(ev, { rootPath, userConfig, dicts }) {
  let el = ev.target,
    i = 0,
    linkEl = null,
    wordEl = null,
    info = {};
  while (el && i++ < 5) {
    if (el.tagName == "DIV" || el.tagName == "P") {
      break;
    }
    if (
      el.tagName == "A" &&
      !el.classList.contains("word-permalink") &&
      el.dataset.nolp != 1
    ) {
      linkEl = el;
      break;
    } else if (
      el.tagName == "SPAN" &&
      el.dataset.word &&
      el.dataset.nolp != 1
    ) {
      if (IGNORE_WORD_TYPES.indexOf(el.dataset.wordType) == -1) {
        wordEl = el;
      }
    }
    el = el.parentNode;
  }
  if (linkEl) {
    let hrefAttr = el.getAttribute("href");
    if (!hrefAttr || !hrefAttr.startsWith(rootPath)) {
      return;
    }
    let match;
    if ((match = hrefAttr.slice(rootPath.length).match(INNER_LINK_REGEX))) {
      info.type = 1;
      info.el = linkEl;
      info.params = {
        dict: decodeURIComponent(match[1]),
        offset: parseInt(match[3]),
        page: parseInt(match[2]),
      };
    } else if (
      (match = hrefAttr
        .slice(rootPath.length)
        .match(INNER_SEARCH_LINK_REGEX)) &&
      (match[2] == "exact" || linkEl.dataset.lp == 1)
    ) {
      info.type = 2;
      info.el = linkEl;
      let dict = decodeURIComponent(match[1]);
      let q = decodeURIComponent(match[3]);
      // let multiIndex = dict.indexOf("_");
      // if (multiIndex != -1) {
      //   dict = dict.slice(0, multiIndex);
      // }
      info.params = {
        dict,
        max: 8,
        q,
        type: TYPES_REVERSE[match[2]],
      };
      info.meta = {
        word: q,
        wordReading: linkEl.dataset.wordReading || "",
      };
    } else {
      return;
    }
  } else if (wordEl) {
    info.type = 3;
    info.el = wordEl;
    info.params = {
      dict: userConfig.livepreviewDict || dicts[0],
      max: 6,
      q: info.el.dataset.word,
      type: 2,
    };
    info.meta = {
      word: info.el.dataset.word,
      wordReading: info.el.dataset.wordReading,
    };
  } else {
    return;
  }
  return info;
}

function getClickEventA(ev) {
  let el = ev.target,
    i = 0;
  while (el && el.tagName != "A" && i++ < 5) {
    el = el.parentNode;
  }
  return el && el.tagName == "A" ? el : null;
}

const PREFERED_JA_VOICES = ["Google 日本語", "Google 日本人"];

function browserPlaySpeech(text, voiceURI) {
  if (!window.speechSynthesis) return null;
  let lang = "ja-JP";
  if (text.match(REGEX_ENGLISH_FULL)) {
    lang = "en-US";
  }
  let voices = Array.from(speechSynthesis.getVoices()).filter(
    (v) => v.lang == lang
  );
  let voice;
  let s = new SpeechSynthesisUtterance(text);
  s.lang = lang;

  if (voiceURI != null) {
    voice = voices.find((v) => v.voiceURI == voiceURI);
    if (voice && !voice.localService && !window.navigator.onLine) {
      voice = null; // we are offline, can not use online tts engine
    }
  } else if (text.length < 10000) {
    // chrome has problem when read long text using network tts
    voice = voices.find(
      (v) =>
        PREFERED_JA_VOICES.indexOf(v.voiceURI) != -1 &&
        (window.navigator.onLine || v.localService)
    );
  }
  if (voice) {
    s.voice = voice;
  }

  // quick fix for chrome play long text using online tts middleway stop
  // https://stackoverflow.com/questions/21947730/chrome-speech-synthesis-with-longer-texts
  s.addEventListener("start", resumeSpeechInfinity);
  s.addEventListener("end", clearSpeechInfinity);
  speechSynthesis.speak(s);

  return s;
}

let speechTimeoutResumeInfinity;
function resumeSpeechInfinity() {
  window.speechSynthesis.resume();
  speechTimeoutResumeInfinity = setTimeout(resumeSpeechInfinity, 1000);
}

function clearSpeechInfinity() {
  clearTimeout(speechTimeoutResumeInfinity);
}

function downloadAsFile(content, filename, contentType) {
  if (!contentType) contentType = "application/octet-stream";
  var a = document.createElement("a");
  var blob = new Blob([content], { type: contentType });
  a.href = window.URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

function gotoTop({ scrollTop, scrollTop2 } = {}) {
  // console.log("gotoTop", scrollTop, scrollTop2);
  document.documentElement.scrollTop = document.body.scrollTop = scrollTop || 0;
  document.querySelector("#main-content").scrollTop = scrollTop2 || 0;
}

function gotoBottom() {
  document.documentElement.scrollTop = document.body.scrollTop =
    document.documentElement.scrollHeight || document.body.scrollHeight;
  document.querySelector("#main-content").scrollTop =
    document.querySelector("#main-content").scrollHeight;
}

function toggleFullScreen(el) {
  if (!document.fullscreenElement) {
    (el && !el.target ? el : document.documentElement).requestFullscreen();
    return 1;
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
  return 0;
}

module.exports = {
  gotoTop,
  gotoBottom,
  isMobile,
  isMobileView,
  fixFocus,
  focusIfInVP,
  getClickEventA,
  toggleFullScreen,
  getLivepreviewEventInfo,
  downloadAsFile,
  browserPlaySpeech,
};
