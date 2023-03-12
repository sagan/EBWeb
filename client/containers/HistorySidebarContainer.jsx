import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import HistorySidebar from "../components/HistorySidebar.jsx";
import {
  updateUserConfig,
  historyQ,
  historyQuery,
  historyClear,
  historyRefresh,
  historyPrev,
  historyNext,
  historyFirst,
} from "../actions";

const mapStateToProps = (state) => {
  return {
    userConfig: state.userConfig,
    history: state.history,
  };
};

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      updateUserConfig,
      historyRefresh,
      historyClear,
      historyQ,
      historyQuery,
      historyFirst,
      historyPrev,
      historyNext,
    },
    dispatch
  );

const HistorySidebarContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(HistorySidebar);

export default HistorySidebarContainer;
