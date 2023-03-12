import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import Cloud from "../components/Cloud.jsx";
import { getMetaValues } from "../selectors";
import {
  syncUserConfigFromPersistence,
  fetchMeta,
  cloudPage,
  googleOpenDataFile,
  googleSignin,
  googleSignout,
  googleResetSync,
  googleTestScript,
  googleSync,
} from "../actions";

const mapStateToProps = (state) => {
  return {
    metaValues: getMetaValues(state),
    config: state.config,
    cloud: state.cloud,
    meta: state.history,
  };
};

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      syncUserConfigFromPersistence,
      fetchMeta,
      cloudPage,
      googleOpenDataFile,
      googleSignin,
      googleSignout,
      googleResetSync,
      googleTestScript,
      googleSync,
    },
    dispatch
  );

const CloudPage = connect(mapStateToProps, mapDispatchToProps)(Cloud);

export default CloudPage;
