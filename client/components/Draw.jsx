import React from "react";
import { getCanonicalUrlSearch } from "../functions";
import { REGEX_KANNJI } from "../language_functions";

const DMAK_DATA_URI = "https://mbilbille.github.io/dmak/kanji/";

const SPEEDS = [1, 2, 3];
const SPEED_VALUES = {
  1: 0.015,
  2: 0.01,
  3: 0.005,
};

export default class Draw extends React.Component {
  constructor(props) {
    super(props);
    this.draw = this.draw.bind(this);
    this.loadAll = this.loadAll.bind(this);
    this.state = {
      drawers: [],
    };
  }
  componentDidMount() {
    this.setState({ drawers: this.loadAll(this.props.text) });
  }
  componentDidUpdate(prevProps, prevState, snapshot) {
    if (
      prevProps.text != this.props.text ||
      prevProps.drawSpeed != this.props.drawSpeed
    ) {
      this.setState({ drawers: this.loadAll(this.props.text) });
    }
  }
  render() {
    // const Dmak = window.Dmak;
    const { rootPath, kannjiDict, text, set } = this.props;
    return (
      <>
        <p className="msg">
          <span>
            {!!text && (
              <span>
                「
                <span className="draw-chars">
                  {Array.from(text).map((c, i) => {
                    let kannjiLink = !!kannjiDict && REGEX_KANNJI.test(c);
                    return (
                      <a
                        href={
                          kannjiLink &&
                          `${rootPath}${getCanonicalUrlSearch({
                            dict: kannjiDict,
                            type: 2,
                            q: c,
                          })}`
                        }
                        key={i}
                        role="button"
                        onClick={(e) => {
                          if (!kannjiLink) {
                            e.preventDefault();
                          }
                          this.draw(i);
                        }}
                      >
                        {c}
                      </a>
                    );
                  })}
                </span>
                」の
              </span>
            )}
            漢字筆順を書きます：
          </span>
          <span className="right">
            {SPEEDS.map((drawSpeed) => (
              <a
                key={drawSpeed}
                title={`${drawSpeed}xの速度で漢字の筆順を書く`}
                className={`icon ${
                  this.props.drawSpeed != drawSpeed ? "not-active" : "active"
                }`}
                onClick={(e) => set({ drawSpeed })}
              >
                <img
                  className="inline"
                  src={`${rootPath}icons/${drawSpeed}x.png`}
                />
              </a>
            ))}
            <span
              role="button"
              className="last"
              aria-label="漢字筆順を閉める"
              title="閉める [alt-shift-x]"
              accessKey="x"
              onClick={(e) => set({ drawStatus: 0 })}
            >
              &times;
            </span>
          </span>
        </p>
        <div className="draw-content">
          {Array.from(text).map((c, i) => (
            <div
              key={i}
              id={`draw-content-${i}`}
              onClick={(e) => this.draw(i)}
              className="draw-content-char"
            />
          ))}
        </div>
      </>
    );
  }

  loadAll(text) {
    return Array.from(text).map((c, i) => {
      document.getElementById(`draw-content-${i}`).innerHTML = "";
      return new Dmak(c, {
        element: `draw-content-${i}`,
        autoplay: true,
        step: SPEED_VALUES[this.props.drawSpeed],
        uri: DMAK_DATA_URI,
        stroke: {
          animated: {
            drawing: false,
            erasing: false,
          },
        },
      });
    });
  }
  draw(i) {
    if (this.state.drawers[i]) {
      this.state.drawers[i].options.step = SPEED_VALUES[this.props.drawSpeed];
      this.state.drawers[i].options.stroke.animated.drawing = true;
      this.state.drawers[i].erase();
      this.state.drawers[i].render();
    }
  }
}
