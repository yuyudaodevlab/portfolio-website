import { ImageResponse } from "next/og";
import { getDictionary, isLang, LANGS } from "@/content";

export const alt = "Yuyudaodevlab";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

/** ブランチレーンと名前だけのシンプルな OGP 画像 */
export default async function OgImage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const role = getDictionary(isLang(lang) ? lang : "ja").hero.role;
  const ascii = /^[\x20-\x7e]*$/.test(role);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0B0D10", color: "#E9E6DF" }}>
        <svg width="180" height="630" viewBox="0 0 180 630">
          <path d="M60 0 V630" stroke="#2A313B" strokeWidth="3" fill="none" />
          <path d="M60 90 C60 140 104 130 104 180 V300 C104 350 60 340 60 390" stroke="#4D8EFF" strokeWidth="3" fill="none" />
          <path d="M60 230 C60 280 140 270 140 320 V430 C140 480 60 470 60 520" stroke="#F2A93B" strokeWidth="3" fill="none" />
          <path d="M60 420 C60 460 104 455 104 495 V560 C104 600 60 595 60 630" stroke="#3FCF8E" strokeWidth="3" fill="none" />
          <circle cx="60" cy="390" r="9" fill="#4D8EFF" />
          <circle cx="60" cy="520" r="9" fill="#F2A93B" />
          <circle cx="60" cy="90" r="5" fill="#2A313B" />
          <circle cx="60" cy="230" r="5" fill="#2A313B" />
        </svg>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 0 90px 10px" }}>
          <div style={{ display: "flex", fontSize: 26, color: "#8B919B", marginBottom: 24 }}>
            <span style={{ color: "#4D8EFF" }}>HEAD</span>
            <span style={{ margin: "0 12px" }}>-&gt;</span>
            <span style={{ color: "#3FCF8E" }}>main</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 150, fontWeight: 800, lineHeight: 0.9, letterSpacing: -5 }}>
            <span>Yuyudao</span>
            <span>devlab</span>
          </div>
          {ascii ? <div style={{ display: "flex", fontSize: 30, color: "#8B919B", marginTop: 36 }}>{role}</div> : null}
        </div>
      </div>
    ),
    size,
  );
}
