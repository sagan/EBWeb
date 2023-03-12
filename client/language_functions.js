// REFERENCE UNICODE TABLES:
// http://www.rikai.com/library/kanjitables/kanji_codes.unicode.shtml
// http://www.tamasoft.co.jp/en/general-info/unicode.html
//
// TEST EDITOR:
// http://www.gethifi.com/tools/regex
//
// UNICODE RANGE : DESCRIPTION
//
// 3000-303F : punctuation
// 3040-309F : hiragana
// 30A0-30FF : katakana
// FF00-FFEF : Full-width roman + half-width katakana
// 4E00-9FEA : Common and uncommon kanji
// 3400-4DFF : CJK Unified Ideographs Extension A, https://ja.wikipedia.org/wiki/CJK統合漢字
//
// Non-Japanese punctuation/formatting characters commonly used in Japanese text
// 2605-2606 : Stars
// 2190-2195 : Arrows
// u203B     : Weird asterisk thing

const REGEX_HIRAGANA = /[\u3040-\u309F]|[\u30A0-\u30FF]|[\uFF00-\uFFEF]/;
const REGEX_JAPANESE =
  /[\u3040-\u309F]|[\u30A0-\u30FF]|[\uFF00-\uFFEF]|[\u4E00-\u9FEA]|[\u3400-\u4DFF]/;
const REGEX_JAPANESE_FULL =
  /^([\u3000-\u303F]|[\u3040-\u309F]|[\u30A0-\u30FF]|[\uFF00-\uFFEF]|[\u4E00-\u9FEA]|[\u3400-\u4DFF])+$/;
const REGEX_KANNJI = /([\u4E00-\u9FEA]|[\u3400-\u4DFF])/;
const REGEX_ENGLISH = /[a-zA-Z0-9]/;
const REGEX_ENGLISH_FULL = /^[-a-zA-Z0-9\s,.;'"!?]+$/;
const REGEX_NON_ENGLISH = /[^-a-zA-Z0-9\s,.;'"!?]/;

const VERB_SUFFIX_FORMATS = {
  います: "う",
  いません: "う",
  いたい: "う",
  わない: "う",
  きます: "く",
  きません: "く",
  きたい: "く",
  かない: "く",
  します: "す",
  しません: "す",
  したい: "す",
  さない: "す",
  ちます: "つ",
  ちません: "つ",
  ちたい: "つ",
  たない: "つ",
  にます: "ぬ",
  にません: "ぬ",
  にたい: "ぬ",
  なない: "ぬ",
  びます: "ぶ",
  びません: "ぶ",
  びたい: "ぶ",
  ばない: "ぶ",
  みます: "む",
  みません: "む",
  みたい: "む",
  まない: "む",
  ります: "る",
  りません: "る",
  りたい: "る",
  らない: "る",

  // あかさたなはまら各行规则动词被动、使役、使役被动结尾
  われる: "う",
  われます: "う",
  われない: "う",
  われません: "う",
  わせる: "う",
  わせます: "う",
  わせない: "う",
  わせません: "う",
  わされます: "う",
  わされる: "う",
  わされない: "う",
  わされません: "う",
  かれる: "く",
  かれます: "く",
  かれない: "く",
  かれません: "く",
  かせる: "く",
  かせます: "く",
  かせない: "く",
  かせません: "く",
  かされる: "く",
  かされます: "く",
  かされない: "く",
  かされません: "く",

  される: "す",
  されます: "す",
  されない: "す",
  されません: "す",
  させる: "す",
  させます: "す",
  させない: "す",
  させません: "す",
  さされる: "す",
  さされます: "す",
  さされない: "す",
  さされません: "す",

  たれる: "つ",
  たれます: "つ",
  たれない: "つ",
  たれません: "つ",
  たせる: "つ",
  たせます: "つ",
  たせない: "つ",
  たせません: "つ",
  たされる: "つ",
  たさます: "つ",
  たさない: "つ",
  たさません: "つ",

  なれる: "ぬ",
  なれます: "ぬ",
  なれない: "ぬ",
  なれません: "ぬ",
  なせる: "ぬ",
  なせます: "ぬ",
  なせない: "ぬ",
  なせません: "ぬ",
  なされる: "ぬ",
  なされます: "ぬ",
  なされない: "ぬ",
  なされません: "ぬ",

  ばれる: "ぶ",
  ばれます: "ぶ",
  ばれない: "ぶ",
  ばれません: "ぶ",
  ばせる: "ぶ",
  ばせます: "ぶ",
  ばせない: "ぶ",
  ばせません: "ぶ",
  ばされる: "ぶ",
  ばされます: "ぶ",
  ばされない: "ぶ",
  ばされません: "ぶ",

  まれる: "む",
  まれます: "む",
  まれない: "む",
  まれません: "む",
  ませる: "む",
  ませます: "む",
  ませない: "む",
  ませません: "む",
  まされる: "む",
  まされます: "む",
  まされない: "む",
  まされません: "む",

  られる: "る",
  られます: "る",
  られない: "る",
  られません: "る",
  らせる: "る",
  らせます: "る",
  らせない: "る",
  らせません: "る",
  らされる: "る",
  らされます: "る",
  らされない: "る",
  らされません: "る",
};

const GUESS_WORD_ORIGINAL_RULES = [
  {
    regex: /‐/g,
    stop: true,
  },
  {
    // generate:
    // "/(.+)(" + Object.keys(VERB_SUFFIX_FORMATS).sort((a,b) => b.length - a.length).join("|") + ")$/"
    regex:
      /(.+)(わされません|かされません|さされません|なされません|ばされません|まされません|らされません|われません|わせません|わされます|わされない|かれません|かせません|かされます|かされない|されません|させません|さされます|さされない|たれません|たせません|たさません|なれません|なせません|なされます|なされない|ばれません|ばせません|ばされます|ばされない|まれません|ませません|まされます|まされない|られません|らせません|らされます|らされない|いません|きません|しません|ちません|にません|びません|みません|りません|われます|われない|わせます|わせない|わされる|かれます|かれない|かせます|かせない|かされる|されます|されない|させます|させない|さされる|たれます|たれない|たせます|たせない|たされる|たさます|たさない|なれます|なれない|なせます|なせない|なされる|ばれます|ばれない|ばせます|ばせない|ばされる|まれます|まれない|ませます|ませない|まされる|られます|られない|らせます|らせない|らされる|います|いたい|わない|きます|きたい|かない|します|したい|さない|ちます|ちたい|たない|にます|にたい|なない|びます|びたい|ばない|みます|みたい|まない|ります|りたい|らない|われる|わせる|かれる|かせる|される|させる|たれる|たせる|なれる|なせる|ばれる|ばせる|まれる|ませる|られる|らせる)$/,
    replace: (match, a, b) => a + (VERB_SUFFIX_FORMATS[b] || "る"),
    stop: true,
  },
  {
    regex:
      /(.+)(させられます|させられない|させられる|されます|されない|される|られます|られない|られる|させます|させない|させる|ます|ない|ません|ませんでした|ました|たい)$/,
    replace: (match, a, b) => a + "る",
    stop: true,
  },
  {
    regex:
      /(.+)(っぽい|くなかった|くない|かった|かれ|まる|める|そう|さ|め|く)$/,
    replace: (match, a, b) => a + "い",
  },
  // https://ja.wiktionary.org/wiki/カテゴリ:日本語_接頭辞
  {
    regex: /^(お|ご|御|準|元|非|不|反|名|過|再)(.+)/,
    replace: (match, a, b) => b,
  },
  // https://ja.wiktionary.org/wiki/カテゴリ:日本語_接尾辞
  {
    regex:
      /(.+)(させて|られて|されて|しません|しました|になる|にする|しない|っぽい|します|した|したい|しなかった|しなさい|しろ|しよう|ちゃん|だった|する|さん|くん|さま|です|とも|的|化|性|式|状|力|層|内|外|並|人|軍|派|国|帝国|共和国|主義|語|氏|君|様|上|に|へ|の|を|で|だ|が|は|な|ら|たち|共|者)$/,
    replace: (match, a, b) => a,
    stop: true,
  },
  {
    regex: /(え|け|せ|て|ね|へ|べ|め|れ)(た|て)$/,
    replace: (match, a, b) => a + "る",
  },
];

const wordTypes = {
  形容詞: 1,
  形容動詞: 2,
  感動詞: 3,
  副詞: 4,
  連体詞: 5,
  接続詞: 6,
  接頭辞: 7,
  接尾辞: 8,
  名詞: 9,
  動詞: 10,
  助詞: 11,
  助動詞: 12,
  //"特殊": 13, // 句読点、カッコ、記号など）
};

function guessWordOriginal(word) {
  let result = [];
  let guess;
  for (let i = 0; i < GUESS_WORD_ORIGINAL_RULES.length; i++) {
    guess = word.replace(
      GUESS_WORD_ORIGINAL_RULES[i].regex,
      GUESS_WORD_ORIGINAL_RULES[i].replace || ""
    );
    // console.log("test", GUESS_WORD_ORIGINAL_RULES[i], guess)
    if (word != guess) {
      result.push(guess);
      if (GUESS_WORD_ORIGINAL_RULES[i].stop) {
        break;
      }
    }
  }
  result = result.filter((v, i, a) => a.indexOf(v) === i); // unique
  return result;
}

module.exports = {
  wordTypes,
  guessWordOriginal,
  REGEX_HIRAGANA,
  REGEX_JAPANESE,
  REGEX_JAPANESE_FULL,
  REGEX_KANNJI,
  REGEX_ENGLISH,
  REGEX_ENGLISH_FULL,
  REGEX_NON_ENGLISH,
};
