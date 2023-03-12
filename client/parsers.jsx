import ParserKanaKanji from "./components/ParserKanaKanji.jsx";
import ParserDefault from "./components/ParserDefault.jsx";
import ParserFix from "./components/ParserFix.jsx";

const parser = {
  title: "分析",
  desc: "日本語の形態素を分析する",
  placeholder: "日本語を入力してください。",
  Component: ParserDefault,
};

const translator = {
  title: "翻訳",
  desc: "日本語をほかの言語に翻訳する",
  placeholder: "日本語を入力してください。",
  Component: ParserDefault,
};

const fix = {
  title: "校正",
  desc: "日本語文の校正作業を支援します",
  placeholder: "日本語文章を校正する。",
  Component: ParserFix,
};

const kanakannji = {
  title: "かな漢字変換",
  desc: "かな・ローマを漢字に変換する",
  placeholder: "仮名・ローマ字のみを入力してください。",
  Component: ParserKanaKanji,
};

const parsers = [parser, translator, fix, kanakannji];

export default parsers;
