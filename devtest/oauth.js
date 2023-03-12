/*
https://github.com/enhancv/popup-tools
*/

popupTools.popup(
  "/dict/?api=4",
  "OAuth2",
  {
    //width: 400, height: 100
  },
  function(err, data) {
    console.log("--", err, data);
  }
);
