import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  // GitHub Pages では trailingSlash: true で書き出すので、URL もそれに合わせる
  const slash = process.env.PAGES_BASE_PATH !== undefined ? "/" : "";
  const url = (lang: string) => `${base}/${lang}${slash}`;
  return (["ja", "en"] as const).map((lang) => ({
    url: url(lang),
    changeFrequency: "weekly",
    alternates: { languages: { ja: url("ja"), en: url("en") } },
  }));
}

// 静的書き出し（GitHub Pages）でも生成できるように
export const dynamic = "force-static";
