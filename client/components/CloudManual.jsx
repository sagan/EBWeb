import React from "react";

export default function CloudManual({}) {
  return (
    <>
      <h3>クラウド・同期機能についての説明・FAQ</h3>
      <div>
        <h4>同期機能とは / What's the sync service?</h4>
        <p>
          The sync service (同期機能) is an optional feature that our site are
          providing. Using this service, you can safely store your notes(単語帳)
          and other personal data to the "Cloud" and sync them accross all your
          devices and browsers.
        </p>
        <h4>Where's my data in the cloud?</h4>
        <p>
          The sync service stores the data in the user's own&nbsp;
          <a className="external" href="https://www.google.com/drive/">
            Google Drive
          </a>
          &nbsp; as an&nbsp;
          <a className="external" href="https://www.google.com/sheets/about/">
            Google spreadsheet
          </a>
          &nbsp;file. The data file is located in the root folder of your Google
          Drive with the name "Soradict".
        </p>
        <h4>How does the sync service work?</h4>
        <p>
          It uses the standard Google Oauth2 API to request your permission to
          access your Google Drive. To setup the sync service, you need to log
          in to your Google Account and grant the required permissions to us
          following the below steps:
        </p>
        <ol>
          <li>
            Click the "Googleアカウントでログイン" (Login with Google account)
            button in the cloud / sync page.
          </li>
          <li>
            In the popup window, log in to your Google account (if not already),
            and authorize our app "Sora" following the instructions.
          </li>
          <li>That's all.</li>
        </ol>
        <p>
          Your data are now safely synced with your own Google Drive. You can
          check the sync status in the cloud / sync page. The initial
          (first-time) sync happens immediately and may take take some time to
          complete, depending on how much notes you have already created in the
          local and cloud. Afterwards, the sync process is triggered
          automatically each time you add / modify / delete your notes or other
          personal data. It is also periodly started to fetch the new data in
          the cloud that your other devices uploaded. You can also manually
          start a sync in the cloud / sync page at any time.
        </p>
        <h4>Is my personal data safe in the cloud and during sync?</h4>
        <p>Short answer: Yes.</p>
        <p>Detailed explaination:</p>
        <p>
          Under the hood, the sync service got the "refresh_token", which is the
          very permanent credential in Google API that can be used to access
          your Google Drive, via the OAuth2 procedure and then store it in your
          browser's local storage (
          <a
            className="external"
            href="https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage"
          >
            localStorage
          </a>
          &nbsp;and&nbsp;
          <a
            className="external"
            href="https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API"
          >
            IndexedDB
          </a>
          ), which is also where your personal data (notes and others) are
          stored. Afterwards, every time it need to sync data with Google Drive,
          it sends the data and refresh_token to our backend server, which then
          use them directly to sync with Google Drive on behalf of you and send
          the result back to your browser. Our server does not record or store
          your personal data and / or refresh_token, they only stay on our
          server memory for a brief period of time (usually milliseconds) during
          the initial OAuth procedure and / or every sync process afterwards. We
          do not, can't and will never access your Google Drive except syncing
          your data on behalf of you.
        </p>
        <p>
          All data transfered in sync process between your browser and our
          server, and those between our server and Google Servers, are encrypted
          using HTTPS protocol. No one else can see or sniff them.
        </p>
        <p>
          Conclusion: Your personal data are safely stored in your own Google
          Drive. No one else but you, besides our sync service, which works on
          behalf of you, can access your data.
        </p>
        <h4>
          Why do my personal data / refresh_token need to be sent to the backend
          server to sync?
        </h4>
        <div>
          It's due to technical limitations. Currently, our backend server is
          using a&nbsp;
          <a
            className="external"
            href="https://developers.google.com/apps-script"
          >
            Google Apps Script
          </a>
          &nbsp;to do the sync stuff on behalf of you. Due to some&nbsp;
          <a
            className="external"
            href="https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS"
          >
            CORS
          </a>
          &nbsp;limitations, the Google Apps script can not be executed directly
          from your browser at this time. We are still exploring other options.
          In the future, the sync service may use the&nbsp;
          <a
            className="external"
            href="https://github.com/google/google-api-javascript-client"
          >
            Google JavaScript client API
          </a>
          &nbsp;to directly sync the data between your browser and Google
          servers, without our server in the middle.
        </div>
        <h4>What permissions does the sync service need?</h4>
        <p>
          The sync service request the following permissions (
          <a
            className="external"
            href="https://developers.google.com/identity/protocols/oauth2/scopes"
          >
            Google OAuth2 scope
          </a>
          ) during the authorization procedure:
        </p>
        <ul>
          <li>
            View your basic profile info ("profile"): To display your name and
            avatar in our app.
          </li>
          <li>
            See, edit, create, and delete your spreadsheets in Google Drive
            ("https://www.googleapis.com/auth/spreadsheets"): To create and
            access the Google Spreedsheet that serves as sync data file.
          </li>
          <li>
            View and manage Google Drive files and folders that you have opened
            or created with this app
            ("https://www.googleapis.com/auth/drive.file"): To read and write
            the sync data file in your Google Drive.
          </li>
          <li>
            See and download all your Google Drive files
            ("https://www.googleapis.com/auth/drive.readonly"): This permission
            is required due to technical limitations. Currently, the Google Apps
            script that our server is using requires this permission to&nbsp;
            <a
              className="external"
              href="https://developers.google.com/apps-script/reference/drive/drive-app#getfiles"
            >
              list
            </a>
            &nbsp;your Google Drive files to find the sync data file.
          </li>
        </ul>
      </div>
    </>
  );
}
