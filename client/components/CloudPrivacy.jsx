import React from "react";

export default function CloudPrivacy({}) {
  return (
    <>
      <h3>プライバシーポリシー</h3>
      <div>
        こちらで当サービスのクラウド・同期機能についてのプライバシーポリシーをご紹介いたします。
      </div>
      <p>
        This sync service does NOT collect, analyze, record or persist any
        "personal data" in our own servers.
      </p>
      <p>
        The sync service uses the users' own Google Drive to store their
        personal data. Consult the&nbsp;
        <a className="external" href="https://policies.google.com/privacy">
          Google privacy policy
        </a>
        &nbsp;for how Google handle these data.
      </p>
      <p>
        All network traffic in the sync service are being transfered encrypted.
      </p>
      <p>We respect and protect our users' privacy seriously.</p>
    </>
  );
}
