import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import CloudSidebar from "../components/CloudSidebar.jsx";
import { getMetaValues } from "../selectors";
import { updateUserConfig, cloudPage } from "../actions";

const mapStateToProps = (state) => {
  return {
    metaValues: getMetaValues(state),
    userConfig: state.userConfig,
    page: state.cloud.page,
    config: state.config,
    meta: state.history
  };
};

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ updateUserConfig, cloudPage }, dispatch);

const CloudSidebarPage = connect(
  mapStateToProps,
  mapDispatchToProps
)(CloudSidebar);

export default CloudSidebarPage;
