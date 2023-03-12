import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import WordsNavi from "../components/WordsNavi.jsx";
import {
  parserShow,
  goToWord,
  netquery,
  analyze,
  openDraw,
  onLoadMore,
  onDirectRequest,
} from "../actions";
import { getPageInfo, getWordIds, searchDictsSelector } from "../selectors";

const mapStateToProps = (state) => {
  return {
    local: state.local,
    words: state.words,
    wordIds: getWordIds(state),
    info: getPageInfo(state),
    searchActualQ: state.searchActualQ,
    dict: state.dict,
    defaultDict:
      state.userConfig.defaultDict ||
      state.config.DEFAULTDICT ||
      state.dicts[0],
    searchDict: state.searchDict,
    searchDicts: searchDictsSelector(state),
    searching: state.searching,
    nextPageMarker: state.nextPageMarker,
    loadingMore: state.loadingMore,
    rootPath: state.config.ROOTPATH,
    analyzeQ: state.analyzeQ,
    analyzeStatus: state.analyzeStatus,
    netqueryQ: state.netqueryQ,
    netqueryStatus: state.netqueryStatus,
    furiganaEnable: state.config.FURIGANA_ENABLE,
  };
};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      parserShow,
      goToWord,
      netquery,
      analyze,
      openDraw,
      onLoadMore,
      onDirectRequest,
    },
    dispatch
  );
};

const WordsNaviContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(WordsNavi);

export default WordsNaviContainer;
