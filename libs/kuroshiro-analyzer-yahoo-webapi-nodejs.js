const fetch = require("isomorphic-fetch");
const xml2js = require("xml2js");
const xmlParser = new xml2js.Parser({ explicitArray: false });

const API_URL = "http://jlp.yahooapis.jp/MAService/V2/parse";

// modified from "kuroshiro-analyzer-yahoo-webapi"
// https://developer.yahoo.co.jp/webapi/jlp/ma/v1/parse.html

/**
 * Yahoo WebAPI Analyzer
 */
class Analyzer {
  /**
   * Constructor
   * @param {string} [appId] Your Yahoo application ID.
   */
  constructor({ appId } = {}) {
    this._analyzer = null;
    this._appId = appId;
  }

  /**
   * Initialize the analyzer
   * @returns {Promise} Promise object represents the result of initialization
   */
  init() {
    return new Promise((resolve, reject) => {
      if (this._analyzer == null) {
        this._analyzer = "yahoo";
        resolve();
      } else {
        reject(new Error("This analyzer has already been initialized."));
      }
    });
  }

  /**
   * Parse the given string
   * @param {*} str input string
   * @returns {Promise} Promise object represents the result of parsing
   */
  parse(str = "") {
    const self = this;
    return new Promise((resolve, reject) => {
      fetch(API_URL + `?appid=${self._appId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: "1234-1",
          jsonrpc: "2.0",
          method: "jlp.maservice.parse",
          params: {
            q: str,
          },
        }),
      })
        .then((res) => {
          // console.log("yahoo api response", res.status)
          if (res.status != 200)
            throw new Error(`Server return error ${res.status}`);
          return res.json();
        })
        .then(
          (res) => {
            let tokens = res.result.tokens;
            if (!tokens) return resolve([]);
            return resolve(
              tokens.map((token) => ({
                surface_form: token[0],
                reading: token[1],
                pos: token[3],
              }))
            );
          },
          (error) => reject(error)
        );
    });
  }
}

module.exports = Analyzer;
