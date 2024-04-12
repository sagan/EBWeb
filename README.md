# EBWeb

EBWeb is an full-fledged web app for Japanese dictionaries with a lot of unique features.

Features:

- [EPWING](https://en.wikipedia.org/wiki/EPWING) 形式の電子辞書データに対応。(using [ebclient](https://github.com/sagan/ebclient) as the backend)
- 単語発音：ネイティブと合成(TTS)発音両方にも対応。
- 音声入力：音声で検索キーワードを入力（Chrome のみに対応）。
- 辞典内容に振り仮名(ルビ)を付け、日本語形態素を解析する。
- 辞典内容を朗読。
- 検索キーワードのネットでの解釈を表示。
- 検索キーワードの日本語形態素を解析。
- 検索キーワードの漢字の筆順をアニメーションで書きます。
- 一括検索：複数の辞典の検索結果を同時に表示。
- ライブプレビュー：リンクまた辞典内容の日本語形態素にカーソルを合わせると、その単語の辞典内容の要約が表示されます。
- レスポンシブウェブデザイン：スマホまたタブレットパソコンにも完全対応。
- PWA (Progressive Web Apps)に対応。Service Worker 技術を利用して、オフライン動作をも対応している。
- 手書き入力: 手書きで検索キーワードを入力することができます。
- 利用履歴機能：検索履歴を閲覧することができます。
- 単語帳(ノート)機能：お気に入りの単語を単語帳に追加して、永久保存することができます。
- クラウド同期機能：単語帳・設定・最近の使用履歴をネットに永久保存して、ほかの端末と同期したりすることができます。
- Anki 同期機能：単語帳を [Anki](https://apps.ankiweb.net/) に同期することができます。
- 豊富な設定項目：すべての機能はカスタマイズ可能。Custom CSS / JavaScript に完全対応。
- API を提供：The software provides a simple & easy HTTP API.

Some features use third-party (free) APIs and require corresponding API credentials configured:

- [Yahoo Japan テキスト解析 Web API](https://developer.yahoo.co.jp/webapi/jlp/) (`YAHOO_APPID` config)
- [IBM Watson Language Translator API](https://cloud.ibm.com/apidocs/language-translator) (`IBM_CLOUD_APIKEY` config)
- [Google Sheets API](https://developers.google.com/sheets/api/guides/concepts) & [Google Drive API](https://developers.google.com/drive/api/reference/rest/v3) & [Google Apps Scripts API](https://developers.google.com/apps-script/api/reference/rest) (`GAPI_CLIENTID`, `GAPI_KEY`, `GAPI_SECRET`, `GAPI_SCRIPT` config)
- [Google Custom Search JSON API](https://developers.google.com/custom-search/v1/overview) (`GOOGLE_SEARCH_API_KEY` & `GOOGLE_SEARCH_API_ENGINE` config)

## Build docker image

```
docker build -t ebweb .
```

## Deployment

For how to deploy EBWeb, see [Deployment](https://github.com/sagan/EBWeb/wiki/Deployment) page
of project Wiki.
