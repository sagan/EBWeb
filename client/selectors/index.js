import { createSelector } from "reselect";
import { parseEbTitle, wordId, getCanonicalUrlSearch } from "../functions";
import { parseUserConfigJson } from "../userConfig";

const defaultMetaValues = {
  notSyncedNoteCnt: 0,
  notSyncedDeletedNoteCnt: 0,
  noteCnt: 0,
  tagCnt: 0,
};

const getMetaValues = createSelector(
  [(state) => state.meta.data],
  (metadata) => {
    let values = Object.assign({}, defaultMetaValues);
    metadata.forEach(({ key, value }) => {
      if (key && value !== undefined) {
        values[key] = value;
      }
    });
    ["googleUserInfo", "googleTokens"].forEach((key) => {
      values[key] = values[key] ? parseUserConfigJson(values[key], null) : null;
    });
    return values;
  }
);

const wordsEmpty = createSelector(
  [(state) => state.searchDict, (state) => state.words],
  (dict, words) => {
    if (dict.indexOf("_") != -1) {
      return words.every((w) => !w.length);
    } else {
      return !words.length;
    }
  }
);

const getDictNames = createSelector(
  [(state) => state.config.DICTINFO.dicts],
  (dicts) =>
    dicts.reduce((res, dict) => {
      res[dict.id || dict.name] = dict.alias || dict.id;
      return res;
    }, {})
);

const currentDictsSelector = createSelector([(state) => state.dict], (dict) => {
  return dict.split(/[+_]/).filter((a) => a);
});

const searchDictsSelector = createSelector(
  [(state) => state.searchDict],
  (dict) => {
    return dict.split(/[+_]/).filter((a) => a);
  }
);

const getWordIds = createSelector(
  [(state) => state.words],
  (words, searchDicts) => {
    let ids = {};
    let prefix = "";

    if (Array.isArray(words[0])) {
      return words.map((dictWords, i) => {
        prefix = i + "_";
        return dictWords.map(mapper);
      });
    } else {
      return words.map(mapper);
    }

    function mapper(word, i) {
      let id = prefix + wordId(word);
      if (!ids[id]) {
        ids[id] = 1;
      } else {
        id += "-" + ids[id]++;
      }
      return id;
    }
  }
);

const getPageInfo = createSelector(
  [
    (state) => state.words,
    (state) => state.searchType,
    (state) => state.searchActualQ,
    (state) => state.page,
    (state) => state.offset,
    (state) => state.dicts,
    (state) => state.searchDict,
    (state) => state.config,
  ],
  (words, type, q, page, offset, dicts, dict, config) => {
    let url =
      config.PUBLIC_URL +
      config.ROOTPATH +
      getCanonicalUrlSearch({ q, type, page, offset, dict, dicts });
    let pagination = "",
      keyword = "",
      pageType = "",
      prev = null,
      next = null;
    if (page != null) {
      if (offset != null) {
        pageType = "content";
        if (words.length == 1) {
          keyword = parseEbTitle(words[0].heading).keyword;
        }
      } else {
        pageType = "page";
        if (page > 0) {
          pagination = `${dict} ページ ${page}`;
          prev = {
            href:
              config.ROOTPATH + getCanonicalUrlSearch({ dict, page: page - 1 }),
            title: `ページ ${page - 1}`,
          };
          next = {
            href:
              config.ROOTPATH + getCanonicalUrlSearch({ dict, page: page + 1 }),
            title: `ページ ${page + 1}`,
          };
        }
      }
    } else if (q) {
      keyword = q;
      pageType = "search";
    }
    return { keyword, type: pageType, prev, next, url, pagination };
  }
);

export {
  currentDictsSelector,
  searchDictsSelector,
  getMetaValues,
  wordsEmpty,
  getDictNames,
  getPageInfo,
  getWordIds,
};
