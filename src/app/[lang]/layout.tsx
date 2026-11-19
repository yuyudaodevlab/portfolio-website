import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { getDictionary, isLang, LANGS } from "@/content";
import { siteUrl } from "@/lib/site";
import "../globals.css";

// Archivo は可変フォント（wdth 軸で見出しを横に広げる）。使う軸の範囲だけに絞ったもの
const archivo = localFont({
  src: [{ path: "../../fonts/archivo-display.woff2", weight: "600 800", style: "normal" }],
  variable: "--font-archivo",
  display: "swap",
  preload: true,
  fallback: ["Arial", "sans-serif"],
});

// IBM Plex Sans JP はサイトで使う文字だけのサブセット（scripts/subset-fonts.mts がビルド前に生成）
const plexJp = localFont({
  src: [
    { path: "../../fonts/plex-jp-400.woff2", weight: "400", style: "normal" },
    { path: "../../fonts/plex-jp-500.woff2", weight: "500", style: "normal" },
    { path: "../../fonts/plex-jp-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-plex-jp",
  display: "swap",
  preload: false,
  fallback: ["Hiragino Sans", "Yu Gothic", "Meiryo", "sans-serif"],
});

const plexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const dynamicParams = false;

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export const viewport: Viewport = {
  themeColor: "#0B0D10",
  colorScheme: "dark",
};

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = getDictionary(lang);
  return {
    metadataBase: new URL(siteUrl()),
    title: t.meta.title,
    description: t.meta.description,
    alternates: {
      canonical: `/${lang}`,
      languages: { ja: "/ja", en: "/en", "x-default": "/ja" },
    },
    openGraph: {
      type: "website",
      title: t.meta.title,
      description: t.meta.description,
      url: `/${lang}`,
      locale: lang === "ja" ? "ja_JP" : "en_US",
      siteName: "Yuyudaodevlab",
    },
    twitter: { card: "summary_large_image", title: t.meta.title, description: t.meta.description },
  };
}

/**
 * 描画前に走る小さなスクリプト。
 * - 言語切り替え直後（sessionStorage のフラグ）は、ブロックを隠さず完成状態で描く
 * - エンジンの JS が 8 秒たっても起動しなければ、隠したブロックを全部見せる
 */
const BOOT = `(function(){var d=document.documentElement;try{if(sessionStorage.getItem("build:skip")==="1")d.dataset.build="off"}catch(e){}window.__buildTimer=setTimeout(function(){if(!window.__buildReady){window.__buildTimedOut=true;d.dataset.build="off"}},8000)})();`;

export default async function LangLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return (
    <html lang={lang} className={`${archivo.variable} ${plexJp.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
