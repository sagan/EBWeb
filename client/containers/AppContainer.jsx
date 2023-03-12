import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import App from "../components/App.jsx";
import {
  goHome,
  log,
  playSound,
  popstate,
  onDirectRequest,
  notebookUpdate,
  notebookDelete,
  notebookEdit,
  notebookPut,
  notebookEditEnd,
  toggleFurigana,
  livepreviewTriggerMouseOver,
  livepreviewTriggerMouseOut,
  livepreviewPopoverMouseOver,
  livepreviewPopoverMouseOut,
  livepreviewClose,
  livepreviewLoad,
  livepreviewCancel
} from "../actions";
import { getPageInfo } from "../selectors";

const mapStateToProps = (state) => {
  return {
    furiganaEnable: state.config.FURIGANA_ENABLE,
    playingSoundWordId: state.playingSoundWordId,
    playing: state.playing,
    noteEditing: state.notebook.editing,
    noteEditError: state.notebook.editError,
    info: getPageInfo(state),
    local: state.local,
    config: state.config,
    userConfig: state.userConfig,
    dicts: state.dicts,
    searchActualQ: state.searchActualQ,
    searchDict: state.searchDict,
    page: state.page,
    romaji: state.romaji,
    offset: state.offset,
    livepreview: state.livepreview,
    words: state.words,
    wordNotes: state.notebook.wordNotes
  };
};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      goHome,
      log,
      popstate,
      playSound,
      onDirectRequest,
      notebookUpdate,
      notebookDelete,
      notebookEdit,
      notebookPut,
      notebookEditEnd,
      toggleFurigana,
      livepreviewLoad,
      livepreviewClose,
      livepreviewCancel,
      livepreviewTriggerMouseOver,
      livepreviewTriggerMouseOut,
      livepreviewPopoverMouseOver,
      livepreviewPopoverMouseOut
    },
    dispatch
  );
};

const AppContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(App);

export default AppContainer;
