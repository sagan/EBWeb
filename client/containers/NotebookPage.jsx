import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import Notebook from "../components/Notebook.jsx";
import {
  updateUserConfig,
  fetchMeta,
  playSound,
  googleSync,
  notebookAnkiConnect,
  notebookAnkiSync,
  notebookModal,
  notebookExport,
  notebookImport,
  notebookEdit,
  notebookCreate,
  notebookQ,
  notebookQuery,
  notebookRefresh,
  notebookTags,
  notebookToggle,
} from "../actions";
import { getMetaValues } from "../selectors";

const mapStateToProps = (state) => {
  return {
    modal: state.notebook.modal,
    playingSoundWordId: state.playingSoundWordId,
    playing: state.playing,
    metaValues: getMetaValues(state),
    config: state.config,
    notebook: state.notebook,
    userConfig: state.userConfig,
  };
};

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      fetchMeta,
      playSound,
      googleSync,
      notebookAnkiConnect,
      notebookAnkiSync,
      notebookModal,
      notebookExport,
      notebookImport,
      notebookEdit,
      notebookCreate,
      notebookQ,
      notebookQuery,
      notebookTags,
      notebookRefresh,
      notebookToggle,
      updateUserConfig,
    },
    dispatch
  );

const NotebookPage = connect(mapStateToProps, mapDispatchToProps)(Notebook);

export default NotebookPage;
