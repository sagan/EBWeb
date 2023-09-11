# EBWeb

EBWeb is an full-featured web app for Japanese dictionaries with a lot of unique features.

For a demo, see https://sakura-paris.org/dict/

Features:

* [EPWING](https://en.wikipedia.org/wiki/EPWING) 形式の電子辞書データに対応。
* 単語発音：ネイティブと合成(TTS)発音両方にも対応。
* 音声入力：音声で検索キーワードを入力（Chromeのみに対応）。
* 辞典内容に振り仮名(ルビ)を付け、日本語形態素を解析する。
* 辞典内容を朗読。
* 検索キーワードのネットでの解釈を表示。
* 検索キーワードの日本語形態素を解析。
* 検索キーワードの漢字の筆順をアニメーションで書きます。
* 一括検索：複数の辞典の検索結果を同時に表示。
* ライブプレビュー：リンクまた辞典内容の日本語形態素にカーソルを合わせると、その単語の辞典内容の要約が表示されます。
* レスポンシブウェブデザイン：スマホまたタブレットパソコンにも完全対応。
* PWA (Progressive Web Apps)に対応。Service Worker 技術を利用して、オフライン動作をも対応している。
* 手書き入力: 手書きで検索キーワードを入力することができます。
* 利用履歴機能：検索履歴を閲覧することができます。
* 単語帳(ノート)機能：お気に入りの単語を単語帳に追加して、永久保存することができます。
* クラウド同期機能：単語帳・設定・最近の使用履歴をネットに永久保存して、ほかの端末と同期したりすることができます。
* Anki 同期機能：単語帳を [Anki](https://apps.ankiweb.net/) に同期することができます。
* 豊富な設定項目：すべての機能はカスタマイズ可能。Custom CSS / JavaScript に完全対応。
* API を提供：The software provides a simple & easy HTTP API.

## Build docker image

```
cp config.sample.js config.js # Modify your own config.js
docker build -t ebweb .
```

## Run

```
docker run -d --name ebweb --restart=unless-stopped \
 -v /root/files/appdata/ebweb/dicts:/usr/src/app/data-dicts \
 -v /root/files/appdata/ebweb/config.js:/usr/src/app/config.js \
 -v /root/files/appdata/ebweb/mod:/usr/src/app/dist/mod \
 -p 127.0.0.1:3000:3000 \
 ebweb
```

Use nginx as a web server & reverse proxy. Example config:

```
upstream ebweb {
  server 127.0.0.1:3000;
}

server {
  listen 443 ssl;
  server_name example.com;

  ssl_certificate     /path/to/example.com.pem;
  ssl_certificate_key /path/to/example.com.key;

  location / {
    proxy_pass http://ebweb/;
    proxy_redirect off;
    proxy_ssl_server_name on;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
  }
}
```

