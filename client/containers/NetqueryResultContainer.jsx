import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import NetqueryResult from "../components/NetqueryResult.jsx";
import {
  netquery,
  netqueryChangeSource,
  closeNetquery,
  netqueryTogglePin
} from "../actions";

const mapStateToProps = state => {
  return {
    rootPath: state.config.ROOTPATH,
    searchDict: state.searchDict,
    netqueryQ: state.netqueryQ,
    netqueryResult: state.netqueryResult,
    netqueryStatus: state.netqueryStatus,
    netquerySourceIndex: state.netquerySourceIndex,
    netqueryPin: state.netqueryPin,
    netqueryError: state.netqueryError
  };
};

const mapDispatchToProps = dispatch => {
  return bindActionCreators(
    { netquery, netqueryChangeSource, closeNetquery, netqueryTogglePin },
    dispatch
  );
};

const NetqueryResultContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(NetqueryResult);

export default NetqueryResultContainer;
