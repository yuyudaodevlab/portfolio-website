import type { NextConfig } from "next";

/**
 * 2 つのデプロイ先に対応する。
 * - Vercel（既定）: ISR・OG 画像の生成・"/" → "/ja" のリダイレクトをサーバーで行う
 * - GitHub Pages: ワークフローが PAGES_BASE_PATH を渡したときだけ静的書き出し（out/）にする。
 *   GitHub のデータはビルド時点の値になり、"/" は public/index.html から /ja/ へ移動する
 */
const pagesBasePath = process.env.PAGES_BASE_PATH;
const isPagesExport = pagesBasePath !== undefined;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  ...(isPagesExport
    ? {
        output: "export",
        basePath: pagesBasePath,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {
        async redirects() {
          return [{ source: "/", destination: "/ja", permanent: false }];
        },
      }),
};

export default nextConfig;
