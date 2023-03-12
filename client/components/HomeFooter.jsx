import React, { PureComponent } from "react";

export default class HomeFooter extends PureComponent {
  render() {
    let { homeFooterText } = this.props;
    return (
      <div className="home-footer">
        {!!homeFooterText && (
          <div
            className="home-footer-text"
            dangerouslySetInnerHTML={{
              __html: homeFooterText,
            }}
          ></div>
        )}
      </div>
    );
  }
}
