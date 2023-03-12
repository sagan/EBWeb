const config = require("../config.loader");
const fetch = require("isomorphic-fetch");
const popupTools = require("popup-tools");
const queryString = require("query-string");
const { google } = require("googleapis");
const { fetchJson } = require("../client/functions");

const oauth2Client = new google.auth.OAuth2(
  config.GAPI_CLIENTID,
  config.GAPI_SECRET,
  (config.PUBLIC_URL || "http://localhost") + config.ROOTPATH + "?api=4&type=1"
);

const scopes = [
  "profile",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/spreadsheets"
];

/*
1. redirect to oauth2url
2. /callbackurl?code={authorizationCode}
3.
const {tokens} = await oauth2Client.getToken(code)


4. get new access token

const request = require('request')
request.post(
  'https://www.googleapis.com/oauth2/v4/token',
  {
      json: {
          "client_id"     : '',
          "client_secret" : '',
          "refresh_token" : '',
          "grant_type"    : 'refresh_token'
      }
  },
  (error, res, body) => {
      console.log(body)
  }
)

*/

const url = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent", // only with it to get refresh_token every time
  scope: scopes
});

async function googleAuth(query, body) {
  let {
    api,
    type,
    code,
    refresh_token,
    access_token,
    expiry_date,
    appid,
    ...otherParams
  } = query;

  if (body.tokens) {
    ({ refresh_token, access_token, expiry_date, appid } = body.tokens);
    delete body.tokens;
  }

  if (!type) {
    return {
      redirect: url
    };
  } else if (type == 1) {
    const { tokens } = await oauth2Client.getToken(code);
    tokens.appid = config.GAPI_CLIENTID;
    const userInfo = await googleapi(
      "https://www.googleapis.com/oauth2/v1/userinfo",
      { access_token: tokens.access_token }
    );
    return {
      body: popupTools.popupResponse({ tokens, userInfo })
    };
  } else if (type == 2) {
    let tokens = await refreshTokens({ refresh_token });
    return {
      body: { tokens }
    };
  } else if (type == 3) {
    // app script proxy
    let tokens, data;
    if (
      refresh_token &&
      expiry_date &&
      expiry_date < +new Date() + 300 * 1000
    ) {
      tokens = await refreshTokens({ refresh_token });
    }
    try {
      data = await fetchJson(config.GAPI_SCRIPT, otherParams, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokens ? tokens.access_token : access_token}`
        },
        body: JSON.stringify(body || {})
      });
    } catch (e) {
      console.log("errpr", e);
      if (e.toString().indexOf("status 401") != -1) {
        return {
          status: 401
        };
      }
      throw e;
    }
    if (tokens) {
      data.tokens = tokens;
    }
    return {
      body: data
    };
  }
}

module.exports = {
  googleAuth
};

async function refreshTokens({ refresh_token }) {
  let tokens = await fetchJson(
    "https://www.googleapis.com/oauth2/v4/token",
    {},
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        client_id: config.GAPI_CLIENTID,
        client_secret: config.GAPI_SECRET,
        refresh_token,
        grant_type: "refresh_token"
      })
    }
  );
  tokens.appid = config.GAPI_CLIENTID;
  if (tokens.expires_in !== undefined) {
    tokens.expiry_date = +new Date() + tokens.expires_in * 1000;
    delete tokens.expires_in;
  }
  return tokens;
}

async function googleapi(url, params, payload) {
  // console.log("googleapi", url, params);
  let res = await fetch(
    url +
      (url.indexOf("?") == -1 ? "?" : "&") +
      queryString.stringify(params || {}),
    {
      method: payload ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json"
      },
      body: payload ? JSON.stringify(payload) : null
    }
  );
  if (res.status != 200) {
    throw new Error(`${res.status} Error`);
  }
  res = await res.json();
  return res;
}
