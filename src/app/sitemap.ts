import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return (["ja", "en"] as const).map((lang) => ({
    url: `${base}/${lang}`,
    changeFrequency: "weekly",
    alternates: { languages: { ja: `${base}/ja`, en: `${base}/en` } },
  }));
}
