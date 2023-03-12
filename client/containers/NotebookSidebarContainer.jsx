import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import NotebookSidebar from "../components/NotebookSidebar.jsx";
import {
  updateUserConfig,
  fetchMeta,
  notebookModal,
  notebookQ,
  notebookQuery,
  notebookTags,
  notebookTagFilter,
  notebookRefresh,
  notebookPrev,
  notebookNext,
  notebookFirst,
} from "../actions";
import { getMetaValues } from "../selectors";

const mapStateToProps = (state) => {
  return {
    metaValues: getMetaValues(state),
    userConfig: state.userConfig,
    notebook: state.notebook,
  };
};

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      updateUserConfig,
      fetchMeta,
      notebookModal,
      notebookQ,
      notebookQuery,
      notebookTags,
      notebookTagFilter,
      notebookRefresh,
      notebookPrev,
      notebookNext,
      notebookFirst,
    },
    dispatch
  );

const NotebookSidebarContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(NotebookSidebar);

export default NotebookSidebarContainer;
