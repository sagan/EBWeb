const localforage = require("localforage");

// <= 1.2.13
async function oldGetUserConfig(siteid) {
  let userConfig = {};
  try {
    userConfig =
      JSON.parse(
        JSON.parse(await localforage.getItem("persist:state")).userConfig
      ) || {};
  } catch (e) {}

  if (Object.keys(userConfig).length == 0) {
    if (typeof window != "undefined" && window.localStorage) {
      try {
        userConfig =
          JSON.parse(localStorage.getItem(`${siteid}_userConfig`)) || {};
      } catch (e) {}
    } else {
      throw new Error("Must run once in browser to migrate userconfig");
    }
  }

  return userConfig;
}

module.exports = {
  oldGetUserConfig,
};
