import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import Parser from "../components/Parser.jsx";
import {
  parserClear,
  parserInput,
  parserClose,
  parserExecute,
  parserTab,
  parserToggleLpMode,
  updateUserConfig,
} from "../actions";

const mapStateToProps = (state) => {
  return {
    parser: state.parser,
    userConfig: state.userConfig,
  };
};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      parserClose,
      parserClear,
      parserInput,
      parserExecute,
      parserTab,
      parserToggleLpMode,
      updateUserConfig,
    },
    dispatch
  );
};

const ParserContainer = connect(mapStateToProps, mapDispatchToProps)(Parser);

export default ParserContainer;
