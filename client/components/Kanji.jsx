import React, { PureComponent, useEffect } from "react";
import { Subscription, fromEvent } from "rxjs";
import { throttleTime, switchMap } from "rxjs/operators";

const SIZE = 200;
const CNT = 10;

export default class Kanji extends PureComponent {
  data = [];
  touching = false;

  state = {
    candidates: []
  };

  componentWillUnmount() {
    this.moveSub && this.moveSub.unsubscribe();
    this.ctxsub && this.ctxsub.unsubscribe();
    this.pdsub && this.pdsub.unsubscribe();
    this.tssub && this.tssub.unsubscribe();
  }

  componentDidMount() {
    this.ctx = this.canvas.getContext("2d");
    this.ctx.lineWidth = 5;
    this.ctx.strokeStyle = "#000";
    this.ctx.lineCap = "round";

    // this.canvas.addEventListener("pointerdown", e => {
    //   console.log("raw_pointerdown");
    //   e.preventDefault();
    // });
    // this.canvas.addEventListener("pointerup", e => {
    //   console.log("raw_pointerup");
    // });
    // this.canvas.addEventListener("touchstart", e => {
    //   console.log("raw_touchstart");
    // });
    // this.canvas.addEventListener("touchmove", e => {
    //   console.log("raw_touchmove");
    // });
    // this.canvas.addEventListener("touchend", e => {
    //   console.log("raw_touchmove");
    // });
    // this.canvas.addEventListener("pointermove", e => {
    //   console.log("raw_pointermove");
    // });
    // return;

    this.ctxsub = fromEvent(this.canvas, "contextmenu").subscribe((e) => {
      e.preventDefault();
      this.moveSub && this.moveSub.unsubscribe();
    });

    this.pdsub = fromEvent(this.canvas, "pointerdown").subscribe(
      (e) => {
        // console.log("pointerdown", e);
        let { clientX: x, clientY: y } = e;
        if (!this.timerStart) {
          this.timerStart = Date.now();
        }
        this.updateRect();
        const stroke = [[], [], []];
        this.ctx.beginPath();
        x = x - this.hostRect.x;
        y = y - this.hostRect.y;
        this.ctx.moveTo(x, y);
        stroke[0].push(x);
        stroke[1].push(y);
        stroke[2].push(Date.now() - this.timerStart);
        this.moveSub = fromEvent(this.canvas, "pointermove").pipe(
            throttleTime(20),
            switchMap((e) => {
              // console.log("pointermove", e);
              let { clientX, clientY } = e;
              clientX = clientX - this.hostRect.x;
              clientY = clientY - this.hostRect.y;
              stroke[0].push(clientX);
              stroke[1].push(clientY);
              stroke[2].push(Date.now() - this.timerStart);
              this.ctx.lineTo(clientX, clientY);
              this.ctx.stroke();
              return fromEvent(this.canvas, "pointerup");
            })
          )
          .subscribe(() => {
            // console.log("pointerup");
            this.moveSub && this.moveSub.unsubscribe();
            this.data.push(stroke);
            this.sendData();
          });
      }
    );

    this.tssub = fromEvent(this.canvas, "touchstart").subscribe(
      (e) => {
        // console.log("touchstart", e);
        this.touching = true;
        e.preventDefault();
        let { clientX: x, clientY: y } = e.changedTouches[0];
        if (!this.timerStart) {
          this.timerStart = Date.now();
        }
        this.updateRect();
        const stroke = [[], [], []];
        this.ctx.beginPath();
        x = x - this.hostRect.x;
        y = y - this.hostRect.y;
        this.ctx.moveTo(x, y);
        stroke[0].push(x);
        stroke[1].push(y);
        stroke[2].push(Date.now() - this.timerStart);
        this.moveSub && this.moveSub.unsubscribe();
        this.moveSub = fromEvent(this.canvas, "touchmove").pipe(
            throttleTime(20),
            switchMap((e) => {
              // console.log("touchmove", e);
              let { clientX, clientY } = e.changedTouches[0];
              clientX = clientX - this.hostRect.x;
              clientY = clientY - this.hostRect.y;
              stroke[0].push(clientX);
              stroke[1].push(clientY);
              stroke[2].push(Date.now() - this.timerStart);
              this.ctx.lineTo(clientX, clientY);
              this.ctx.stroke();
              return fromEvent(this.canvas, "touchend");
            })
          )
          .subscribe(() => {
            // console.log("touchend");
            this.moveSub && this.moveSub.unsubscribe();
            this.data.push(stroke);
            this.sendData();
            this.touching = false;
          });
      }
    );
  }

  updateRect = () => {
    this.hostRect = this.canvas.getBoundingClientRect();
  };

  sendData = async () => {
    const data = {
      app_version: 0.4,
      api_level: "537.36",
      device:
        "5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36",
      input_type: 0,
      options: "enable_pre_space",
      requests: [
        {
          writing_guide: {
            writing_area_width: this.props.width || SIZE,
            writing_area_height: this.props.height || SIZE
          },
          pre_context: "",
          max_num_results: this.props.maxResults || 10,
          max_completions: 0,
          language: "ja",
          ink: this.data
        }
      ]
    };
    let res = await fetch(
      "https://inputtools.google.com/request?itc=ja-t-i0-handwrit&app=translate",
      {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      }
    );
    if (res.status != 200) {
      return console.log(`${res.status} Error`);
    }
    let result = await res.json();
    if (result[0] === "SUCCESS") {
      // console.log(result[1][0][1]);
      this.setState({
        candidates: [...new Set(result[1][0][1].map((a) => a[0]))]
      });
    } else {
      // console.error("something went wrong");
    }
  };
  render() {
    let { width = SIZE, height = SIZE } = this.props;
    let { candidates } = this.state;
    return (
      <div className="handwrite" style={{ width: width + 4 }}>
        <canvas
          ref={(el) => (this.canvas = el)}
          width={width}
          height={height}
        />
        <div className="handwrite-candidates">
          {Array.from(Array(CNT).keys()).map((i) => (
            <div
              key={i}
              onClick={this.onSelect}
              data-kanji={candidates[i] || ""}
              className="handwrite-candidate"
            >
              {candidates[i] || ""}
            </div>
          ))}
        </div>
        <div className="handwrite-tip">
          <button onClick={this.clear}>クリア</button>
          <button onClick={this.props.onBackKey} title="バックスペース">
            ←BS
          </button>
          <button onClick={this.props.onGoKey} title="GO">
            GO
          </button>
        </div>
        <div className="handwrite-title">
          <span>手書き入力</span>
        </div>
      </div>
    );
  }
  onSelect = (e) => {
    if (e.target.dataset.kanji && this.props.onSelect) {
      this.props.onSelect(e.target.dataset.kanji);
      this.clearDraw();
    }
  };
  clear = () => {
    this.clearDraw();
    this.setState({ candidates: [] });
  };
  clearDraw = () => {
    this.ctx.clearRect(
      0,
      0,
      this.props.width || SIZE,
      this.props.height || SIZE
    );
    if( this.moveSub ) {
      this.moveSub.unsubscribe();
      this.moveSub = null;
    }
    this.data = [];
  };
}
