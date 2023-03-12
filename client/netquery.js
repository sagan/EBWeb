const { fetchJson } = require("./functions");

const netquery_sources = [
  {
    name: "Google",
    icon: "google",
    url: "https://www.google.co.jp/search?q=%s",
    type: "google",
  },
  {
    name: "Wikipedia (ja)",
    icon: "wikipedia",
    url: "https://ja.wikipedia.org/wiki/%s",
    apiUrl: "https://ja.wikipedia.org/w/api.php",
    type: "mediawiki",
  },
  {
    name: "Wiktionary (ja)",
    icon: "wiktionary",
    url: "https://ja.wiktionary.org/wiki/%s",
    apiUrl: "https://ja.wiktionary.org/w/api.php",
    type: "mediawiki",
  },
  {
    name: "DuckDuckGo",
    url: "https://duckduckgo.com/?q=%s",
    icon: "duckduckgo",
    type: "duckduckgo",
  },
  {
    name: "Jisho",
    url: "https://jisho.org/search/%s",
    icon: "jisho",
    type: "jisho",
  },
  {
    name: "翻訳ツール",
    url: "https://www.ibm.com/demos/live/watson-language-translator/self-service/home",
    icon: "translate",
    type: "translate",
  },
];

const netquery_sourceFuncs = {
  google: netquery_google,
  mediawiki: netquery_mediawiki,
  duckduckgo: netquery_duckduckgo,
  translate: netquery_translate,
  jisho: netquery_jisho,
};

const langs = {
  ja: "日本語",
  en: "英語",
  zh: "中国語",
  fr: "フランス語",
  de: "ドイツ語",
  ru: "ルシア語",
};

async function netquery_jisho(source, keyword, { config }) {
  let res = await fetchJson(`${config.ROOTPATH}proxy/jisho_api`, { keyword });
  if (res.meta.status != 200) {
    throw new Error(`Jisho.org api error. meta.status: ${res.meta.status}`);
  }
  let result = {
    source: "Jisho",
    title: `「${keyword}」をJisho.orgで検索する結果`,
    html: res.data
      .slice(0, 5)
      .map(
        (item) => `<div>
      <h3>${
        !item.japanese
          ? item.slug
          : item.japanese
              .map(({ word, reading }) =>
                word && reading
                  ? `<ruby>${word}<rp>(</rp><rt>${reading}</rt><rp>)</rp></ruby>`
                  : `<span>${word || reading}</span>`
              )
              .join(", ")
      }</h3>
      <div><ol>${item.senses
        .map(
          (sense) =>
            `<li>${
              !sense.parts_of_speech.length
                ? ""
                : `(${sense.parts_of_speech.join(", ")}) `
            }${sense.english_definitions.join("; ")}${
              !sense.tags.length ? "" : ` <sub>(${sense.tags.join(", ")})</sub>`
            }</li>`
        )
        .join("")}</ol></div>
    </div>`
      )
      .join(""),
  };
  return result;
}

async function netquery_google(source, q, { config }) {
  let res = await fetchJson(`${config.ROOTPATH}?api=5&gl=jp&hl=ja`, { q });
  let result = {
    source: "Google",
    title: `「${q}」をGoogleで検索する結果`,
    html: res.items
      .slice(0, 5)
      .map(
        (item) => `<div>
      <h3><a href="${item.link}">${item.htmlTitle}</a></h3>
      <div>${item.htmlSnippet}</div>
    </div>`
      )
      .join(""),
  };
  return result;
}

async function netquery_translate(source, q, { config }) {
  let res = await fetch(`${config.ROOTPATH}?api=2&type=3`, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
    },
    body: q,
  });
  res = await res.json();
  let result = {
    source: "IBM言語変換API",
    title: `「${q}」を${langs[res.target]}に翻訳した結果`,
    html: res.translation,
  };
  return result;
}

/*
apiUrl: https://ja.wikipedia.org/w/api.php
exchars: max 1200
docs: https://www.mediawiki.org/wiki/Extension:TextExtracts
*/
async function netquery_mediawiki(source, q, options) {
  let data = await fetchJson(
    source.apiUrl +
      "?format=json&indexpageids&action=query&exchars=1000&pilicense=any&pithumbsize=300&prop=extracts|pageimages&redirects=1&origin=*",
    {
      titles: q,
    }
  );
  if (data.query.pageids.length == 0 || data.query.pageids[0] == "-1") {
    return null; // no result
  }
  let page = data.query.pages[data.query.pageids[0]];
  let result = {
    title: page.title,
    html: page.extract,
    subtitle: "",
    url: source.url.replace("%s", encodeURIComponent(page.title)),
    source: source.name,
  };
  if (page.thumbnail) {
    Object.assign(result, {
      image: page.thumbnail.source,
      imageWidth: page.thumbnail.width,
      imageHeight: page.thumbnail.height,
    });
  }
  return result;
}

async function netquery_duckduckgo(source, q, options) {
  let data = await fetchJson(
    `https://api.duckduckgo.com/?format=json&t=ebweb`,
    { q }
  );
  if (!data.Heading) {
    return null;
  }

  let html;
  if (data.Abstract) {
    html = data.Abstract;
  } else {
    let topics = data.RelatedTopics;
    if (topics.length && topics[0].Topics) {
      // duckduckgo api disambiguation pages (Type=='D')
      topics = topics[0].Topics;
    }
    html =
      "<ul>" +
      topics.slice(0, 5).map((topic) => `<li>${topic.Result}</li>`) +
      "</ul>";
  }

  let result = {
    title: data.Heading,
    html,
    source: data.AbstractSource,
    image: data.Image
      ? (data.Image.startsWith("/") ? "https://duckduckgo.com" : "") +
        data.Image
      : "",
    imageWidth: data.ImageWidth,
    imageHeight: data.ImageHeight,
    url:
      data.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
  };
  return result;
}

async function netquery_request(source, q, options) {
  return await netquery_sourceFuncs[source.type](source, q, options);
}

module.exports = {
  netquery_sources,
  netquery_request,
  netquery_sourceFuncs,
};
