# yuyudaodevlab portfolio

Yuyudaodevlab の個人サイト。Git のネットワークグラフをモチーフに、名前付きのエージェントカーソル 12 体が訪問者の前でページを組み立てる。

- Next.js（App Router）+ TypeScript strict / CSS Modules
- three + @react-three/fiber（背景の 3D コミットグラフ）
- 自作の requestAnimationFrame エンジン（カーソルとビルド演出）
- `/ja`（既定）と `/en`

## 開発

```bash
npm install
npm run dev        # http://localhost:3000/ja
npm run build      # prebuild で GitHub スナップショットとフォントのサブセットを更新してからビルド
npm run lint       # tsc --noEmit
```

| 環境変数 | 用途 |
| --- | --- |
| `GITHUB_TOKEN` | 任意。あれば GraphQL でコントリビューションを取得。無ければ公開データ（REST と公開カレンダー）で動く |
| `NEXT_PUBLIC_SITE_URL` | 任意。OGP・sitemap の絶対 URL。Vercel では本番 URL が自動で入る |

## 構成

```
src/
  app/[lang]/           page / layout / opengraph-image（ISR: 1 時間）
  content/              文言（ja.ts / en.ts）と事実データ（shared.ts）
  components/build/     ビルド演出（engine / scheduler / scroll / Block / TypedHeadline / CursorLayer / BuildLog / Controls）
  components/graph/     3D コミットグラフ（GPU で描ける環境だけ three.js を読み込む）
  components/lanes/     左端のブランチレーン SVG、見出しの視差
  components/sections/  各セクション
  lib/github*.ts        GitHub データの取得（失敗時は data/github-snapshot.json）
  fonts/                サブセット済みフォント（scripts/subset-fonts.mts が生成）
scripts/
  snapshot-github.mts   GitHub の最新値を JSON に保存（フォールバック用）
  subset-fonts.mts      IBM Plex Sans JP をサイトで使う文字だけに、Archivo を使う軸の範囲だけに絞る
```

## ビルド演出

- すべてのブロックはサーバーで描画された実 HTML（`data-block` と子の `.fill`）。状態は `empty → mark → rough → done`
- ブロックを隠すのは `@media (scripting: enabled) and (prefers-reduced-motion: no-preference)` のときだけ。JS なし・reduced-motion なら最初から完成している
- ホイール 2 ノッチ（0.5 秒以内）・60px のタッチドラッグ・スクロールキーで、画面内のセクションだけを組み立てるモードに切り替わる。`?play` を付けると切り替えない
- 右下の skip で即完成、rebuild で下から順にスケルトン → 空に戻して先頭から再生
- 言語を切り替えると演出はキャンセルされ、新しいページは完成状態で出る

## 未確定の情報

分かったら次の場所を埋める。`null` のあいだは表示されない。

| 項目 | 場所 |
| --- | --- |
| 経歴の各期間 `{{期間}}` | `src/content/ja.ts` / `en.ts` の `experience.items[].period` |
| 読売新聞の掲載日 `{{掲載日}}` | 同 `recognition.items`（`media/yomiuri`）の `note` |
| 出演した映画の作品名 `{{作品名}}` | 同 `recognition.items`（`film/feature`）の `note` か `text` |
| 資格の個別認証 URL `{{URL}}` | `certifications.items[].url`（今は `https://grow.google/certificates/`） |
| その他の連絡先（X・LinkedIn・メールなど） | `src/content/shared.ts` の `REMOTES` |

文言を変えたら `npm run fonts:subset` を実行する（ビルド時は自動）。サブセットに無い文字はシステムの日本語フォントで表示される。

## デプロイ

どちらにも出せる。

- **Vercel**: そのままデプロイ。GitHub のデータは ISR で 1 時間ごとに更新、`/` は `/ja` へリダイレクト。
- **GitHub Pages**: `.github/workflows/nextjs.yml` が `main` への push で動く。ワークフローが `PAGES_BASE_PATH` を渡すと `next.config.ts` が静的書き出し（`out/`、`basePath` 付き）に切り替わる。GitHub のデータはビルドした時点の値。`/` は `public/index.html` から `ja/` へ移動する。

手元で Pages と同じものを作るには:

```bash
PAGES_BASE_PATH=/portfolio-website NEXT_PUBLIC_SITE_URL=https://yuyudaodevlab.github.io/portfolio-website npm run build
```
