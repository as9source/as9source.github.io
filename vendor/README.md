# vendor

外部ライブラリの同梱コピー。以前は cdnjs から読み込んでいたが、次の理由で自サイトから配信している。

- CDNが改ざんされた場合に、こちらのページ上で任意のコードが実行されてしまうのを防ぐため
- オフラインでもPDF機能が動くようにするため（現場では電波が悪いことがある）。
  service worker のキャッシュ対象にも入れている

## 収録物

| ファイル | ライブラリ | バージョン | ライセンス |
| --- | --- | --- | --- |
| `jspdf.umd.min.js` | jsPDF | 2.5.1 | MIT |
| `html2canvas.min.js` | html2canvas | 1.4.1 | MIT |
| `jspdf.plugin.autotable.min.js` | jspdf-autotable | 3.8.2 | MIT |

いずれも npm の公式パッケージの `dist/` をそのままコピーしたもの（改変なし）。

## 更新のしかた

```sh
npm pack jspdf@<version>
tar xzf jspdf-<version>.tgz
cp package/dist/jspdf.umd.min.js vendor/
```

更新したら、参照している各HTMLと service worker のキャッシュ版数
（`saisun-sw.js` の `CACHE_NAME`、`uchirimo-gencho/sw.js` の `CACHE`）も上げること。

なお、ルートの `index.html` のアイコンは Font Awesome Free 6.5.1 のSVGを
インライン化している（Icons: CC BY 4.0 / https://fontawesome.com/license/free）。
