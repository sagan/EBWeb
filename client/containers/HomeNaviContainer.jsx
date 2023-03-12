import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import HomeNavi from "../components/HomeNavi.jsx";
import { parserShow } from "../actions";

const mapStateToProps = (state) => {
  return {
    config: state.config,
    parser: state.parser,
  };
};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ parserShow }, dispatch);
};

const HomeNaviContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(HomeNavi);

export default HomeNaviContainer;
