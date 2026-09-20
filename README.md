# tripman サイト公開プレビュー（GitHub Pages用）

これは **株式会社tripman コーポレートサイトの、GitHub Pagesで確認するための公開プレビュー**です。

- ソースコードの本体（正）は、非公開の `tripman-corporate-site` リポジトリの `site/` フォルダです。
- このリポジトリの中身は、そちらから `scripts/build_public_preview.py` で自動生成しています。**このリポジトリを直接編集しないでください**（次回の更新で上書きされます）。
- `robots.txt` と各ページの `noindex` タグにより、検索エンジンには登録されないようにしています。
- お問い合わせフォームの送信は、このプレビューでは動作しません（GitHub PagesはPHPが動かない静的ホスティングのため）。本番のお名前.comサーバーでのみ動作します。

## 更新方法（本体を修正したあと）

`tripman-corporate-site` リポジトリ側で:

```bash
python scripts/build_public_preview.py ../tripman-site-preview
```

その後、このフォルダで:

```bash
git add -A
git commit -m "Update preview"
git push
```
