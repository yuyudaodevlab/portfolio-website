// IBM Plex Sans JP を、このサイトで使う文字だけに絞って src/fonts/ に書き出す（Archivo も軸の範囲を絞る）。
//   npm run fonts:subset   （prebuild でも自動実行）
//
// Google Fonts 版をそのまま next/font/google で読むと、@font-face が 370 個（CSS 約 100KB）になり、
// その CSS が描画をブロックする。サブセットにすると @font-face は 3 個、フォントもウェイトごとに 1 ファイルになる。
// 文言を変えたらこのスクリプトを実行し直す（ビルド時は自動）。GitHub の説明文など、ここに無い文字はシステムフォントで出る。
import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import subsetFont from "subset-font";

const root = new URL("..", import.meta.url);
const path = (p: string) => fileURLToPath(new URL(p, root));

// 表示される文言の置き場所だけを見る（コンポーネントのコメントの漢字まで入れないため）
const SOURCES = ["src/content", "src/data/github-snapshot.json"];
// コンポーネント側で直接出している和文
const EXTRA = "日本語月";
const WEIGHTS = [
  { weight: 400, file: "IBMPlexSansJP-Regular.woff2" },
  { weight: 500, file: "IBMPlexSansJP-Medium.woff2" },
  { weight: 700, file: "IBMPlexSansJP-Bold.woff2" },
];

async function collect(p: string): Promise<string> {
  const abs = path(p);
  if (/\.(ts|tsx|json)$/.test(p)) return readFile(abs, "utf8");
  const entries = await readdir(abs, { withFileTypes: true });
  const parts = await Promise.all(
    entries
      .filter((e) => e.isDirectory() || /\.(ts|tsx|json)$/.test(e.name))
      .map((e) => collect(`${p}/${e.name}`)),
  );
  return parts.join("");
}

function range(from: number, to: number): string {
  let s = "";
  for (let c = from; c <= to; c++) s += String.fromCodePoint(c);
  return s;
}

const text =
  (await Promise.all(SOURCES.map(collect))).join("") +
  range(0x20, 0x7e) + // ASCII
  range(0xa0, 0xff) + // Latin-1
  range(0x2010, 0x2027) + // ダッシュ・引用符・…
  range(0x3000, 0x303f) + // 和文の句読点・括弧
  range(0x3040, 0x309f) + // ひらがな
  range(0x30a0, 0x30ff) + // カタカナ
  range(0xff01, 0xff5e) + // 全角英数・記号
  "々〆ヶ→←↑↓×÷±°" +
  EXTRA;

const chars = [...new Set(text)].join("");
await mkdir(path("src/fonts"), { recursive: true });

for (const w of WEIGHTS) {
  const src = await readFile(path(`node_modules/@ibm/plex-sans-jp/fonts/complete/woff2/hinted/${w.file}`));
  const out = await subsetFont(src, chars, { targetFormat: "woff2", noHinting: true, noLayoutClosure: true });
  await writeFile(path(`src/fonts/plex-jp-${w.weight}.woff2`), out);
  console.log(`plex-jp-${w.weight}.woff2  ${(out.length / 1024).toFixed(1)} KB`);
}
console.log(`${[...chars].length} characters`);

// Archivo（欧文ディスプレイ）: 可変フォントの軸を、実際に使う範囲（太さ 600–800、幅 100–125）に絞る
const latin = range(0x20, 0x7e) + range(0xa0, 0xff) + range(0x2010, 0x2027) + "×";
const archivo = await readFile(path("node_modules/@fontsource-variable/archivo/files/archivo-latin-standard-normal.woff2"));
const archivoOut = await subsetFont(archivo, latin, {
  targetFormat: "woff2",
  noHinting: true,
  variationAxes: { wght: { min: 600, max: 800 }, wdth: { min: 100, max: 125 } },
});
await writeFile(path("src/fonts/archivo-display.woff2"), archivoOut);
console.log(`archivo-display.woff2  ${(archivoOut.length / 1024).toFixed(1)} KB`);
