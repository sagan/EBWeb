import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import History from "../components/History.jsx";
import {
  historyQ,
  historyQuery,
  historyRefresh,
  notebookTags,
  googleSync,
} from "../actions";
import { getMetaValues } from "../selectors/index.js";

const mapStateToProps = (state) => {
  return {
    userConfig: state.userConfig,
    metaValues: getMetaValues(state),
    config: state.config,
    history: state.history,
  };
};

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    { historyQ, historyQuery, historyRefresh, notebookTags, googleSync },
    dispatch
  );

const HistoryPage = connect(mapStateToProps, mapDispatchToProps)(History);

export default HistoryPage;
