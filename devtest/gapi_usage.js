gapi.load("client", function() {
  gapi.client
    .init({
      apiKey: "",
      // Your API key will be automatically added to the Discovery Document URLs.
      // discoveryDocs: ["https://people.googleapis.com/$discovery/rest"],
      // clientId and scope are optional if auth is not required.
      clientId: "",
      scope: "profile https://www.googleapis.com/auth/spreadsheets"
    })
    .then(function() {
      // gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
      // Handle the initial sign-in state.
      gapi.auth2
        .getAuthInstance()
        .currentUser.get()
        .getBasicProfile()
        .getName();

      gapi.auth2
        .getAuthInstance()
        .currentUser.get()
        .getAuthResponse();
      updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    });
});

function updateSigninStatus(isSignedIn) {
  console.log("status", isSignedIn);
}

function requestOffline() {
  gapi.auth2
    .getAuthInstance()
    .grantOfflineAccess({
      scope: "profile https://www.googleapis.com/auth/spreadsheets"
    })
    .then((resp) => {
      console.log("result", resp);
    });
}

function handleAuthClick() {
  gapi.auth2
    .getAuthInstance()
    .signIn()
    .then((user) => {
      // return user.grantOfflineAccess({
      //   scope: "profile https://www.googleapis.com/auth/spreadsheets"
      // });
    });
}

function handleSignoutClick() {
  gapi.auth2.getAuthInstance().signOut();
}

/*

纯客户端无法获取到 refresh_token. 其 offlineAccess 是通过浏览器登录Google账户和隐藏的iframe实现的。

配合后端程序获取 refresh_token, 保存到前端。使用时调用后端接口获取 access_token 再保存到前端。用 Google CORS API 使用。

If you haven't solved your issue yet, you can get an authorization code from gapi.auth2.getAuthInstance().currentUser.get().grantOfflineAccess(). Then using the auth code, you can send it to your backend and exchange it for a refresh_token from google.


gapi.auth2.getAuthInstance().currentUser.get().reloadAuthResponse();

https://developers.google.com/identity/sign-in/web/reference


*/
