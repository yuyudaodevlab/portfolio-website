# yuyudao — Creative Developer Portfolio

Next.js App Router / React / TypeScript による日本語ポートフォリオ。Git の立体ネットワークから、スクロールで組み上がる実際の HTML ポートフォリオへつながります。

## 開発

Node.js 22 以降を推奨します。

```sh
npm ci
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

```sh
npm run typecheck
npm run build
```

`output: 'export'` を設定しており、`out/` を静的ホスティングへ配置できます。

## 内容の変更

`src/data/profile.ts` に自己紹介・活動・技術・認定資格・連絡先を集約しています。未設定の連絡先はリンクを出力しません。取得日、認定 ID、映画タイトルなど未提供の情報は含めていません。

## 構成

- `src/app/page.tsx`: サーバー描画のページ構成と Hero
- `src/components/ExperienceShell.tsx`: ナビゲーション、全体進行度、スクロール演出、微細な操作反応
- `src/components/CollaborativeCanvas.tsx`: 編集操作データから状態を求める固定キャンバス
- `src/components/GitUniverse.tsx`: Three.js / React Three Fiber による Git ネットワーク
- `src/components/PortfolioSections.tsx`: プロフィール、技術、活動、実績、資格、連絡先

共同編集カーソルは役割を表す仮想的な演出です。実在の共同制作者を意味しません。スクロールの進行度で編集状態を再構築し、逆方向でも同じ状態になります。Lenis は導入せず、ネイティブスクロールと ScrollTrigger を使用しています。

モーション軽減設定では固定演出を省略し、完成した内容を表示します。WebGL が利用できない場合は SVG グラフを表示します。3D は demand rendering を利用し、表示中の変更時に描画します。

## 公開前の設定

名前・連絡先・資格証明 URL を確認し、独自ドメインを利用する場合は `src/app/layout.tsx` の `metadataBase` を変更してください。Google の資格名は提供された表記を掲載しています。

## 参照

- [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- [React Three Fiber performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance)
