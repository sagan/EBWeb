const config = require("../config.loader");
const fetch = require("isomorphic-fetch");

(async () => {
  let access_token = "";
  let res = await fetch(config.GAPI_SCRIPT, {
    headers: {
      Authorization: `Bearer ${access_token}`
    }
  });
  let data = await res.json();
  console.log(data);
})();
