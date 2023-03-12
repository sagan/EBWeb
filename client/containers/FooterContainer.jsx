import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import Footer from "../components/Footer.jsx";
import { updateUserConfig } from "../actions";

const mapStateToProps = (state) => {
  return {
    logdata: state.logdata,
    userConfig: state.userConfig,
    date: state.config.DATE,
    rootPath: state.config.ROOTPATH,
    footerText: state.config.FOOTER_TEXT,
    homeFooterText: state.config.HOME_FOOTER_TEXT,
  };
};

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ updateUserConfig }, dispatch);

const FooterContainer = connect(mapStateToProps, mapDispatchToProps)(Footer);

export default FooterContainer;
