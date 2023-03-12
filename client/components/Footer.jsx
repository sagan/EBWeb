import React, { PureComponent } from "react";
import ReactTooltip from "react-tooltip";
import HomeFooter from "./HomeFooter.jsx";
import { _c, _d } from "../userConfig.js";

export default class Footer extends PureComponent {
  render() {
    let {
      className,
      date,
      footerText,
      homeFooterText,
      logdata,
      updateUserConfig,
      userConfig,
    } = this.props;
    return (
      <footer className={className || ""}>
        <div className="footer-content">
          <div className="footer-main">
            Powered by&nbsp;
            <a href="https://github.com/sagan/EBWeb">EBWeb</a>
            &nbsp;
            <span
              data-for={`${className}-footer-version-tooptip`}
              data-tip={date ? `${date}` : `commit ${__COMMIT_HASH__}`}
            >
              {__ROOTVERSION__}
            </span>
            .
            {!!footerText && (
              <span className="footer-text">
                &nbsp;
                <span
                  dangerouslySetInnerHTML={{
                    __html: footerText,
                  }}
                />
              </span>
            )}
            &nbsp;
            <select
              className="needjs ui-mode-switcher"
              value={_d("multiDictsAlwaysUse")}
              onChange={async (e) => {
                let value = e.target.value;
                if (value.startsWith("c_")) {
                  await updateUserConfig({
                    colorScheme: parseInt(value.slice(2)),
                  });
                } else {
                  await updateUserConfig({
                    multiDictsAlwaysUse: parseInt(value),
                  });
                }
              }}
            >
              <option value="" disabled="disabled">
                UI 選択
              </option>
              <option value="0">標準 UI</option>
              <option value="1">一括検索</option>
              <option value="2">簡素化</option>
              <option value="c" disabled="disabled">
                カラー
              </option>
              <option value="c_0">auto{!_d("colorScheme") && " *"}</option>
              <option value="c_1">dark{_d("colorScheme") == 1 && " *"}</option>
              <option value="c_2">light{_d("colorScheme") == 2 && " *"}</option>
            </select>
            <script
              dangerouslySetInnerHTML={{
                __html: `<!--//--><![CDATA[//><!--
(function() {
  var multiDictsAlwaysUse = window.__USERCONFIG__.multiDictsAlwaysUse;
  if( multiDictsAlwaysUse ) {
    var selectors = document.querySelectorAll(".ui-mode-switcher");
    for(var i = 0; i < selectors.length; i++) {
      selectors[i].value = multiDictsAlwaysUse;
    }
  }
  var colorScheme = window.__USERCONFIG__.colorScheme;
  var context = document.currentScript ? document.currentScript.parentNode : document;
  if( colorScheme ) {
    var options = context.querySelectorAll('.ui-mode-switcher option[value="c_' + colorScheme + '"]');
    for(var i = 0; i < options.length; i++) {
      options[i].innerHTML = colorScheme == 1 ? "dark *" : "light *";
    }
    options = context.querySelectorAll('.ui-mode-switcher option[value="c_0"]');
    for(var i = 0; i < options.length; i++) {
      options[i].innerHTML = "auto";
    }
  }
})()
//--><!]]>`,
              }}
            />
          </div>
          <div className="footer-right"></div>
        </div>
        <ReactTooltip
          id={`${className}-footer-version-tooptip`}
          effect="solid"
        />
        <HomeFooter homeFooterText={homeFooterText} />
        {!!logdata && <div className="logdata">{logdata}</div>}
      </footer>
    );
  }
}
