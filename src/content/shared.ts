// 言語に依存しない事実データ（名前・URL・技術名）。
// 文言は ja.ts / en.ts に置く。

export const PROFILE = {
  name: "Yuyudaodevlab",
  /** ヒーローでは 2 行に分けて組む */
  nameLines: ["Yuyudao", "devlab"],
  github: "https://github.com/yuyudaodevlab",
  githubLabel: "github.com/yuyudaodevlab",
} as const;

/** package.json 風にグループ化した技術スタック。キーは JSON のキーとして表示する */
export const STACK: { key: string; items: string[] }[] = [
  {
    key: "languages",
    items: ["Python", "Java", "JavaScript", "TypeScript", "Swift", "Rust", "Bash", "HTML", "CSS"],
  },
  { key: "frontend", items: ["Next.js", "React", "Three.js", "Tailwind CSS", "Vercel"] },
  { key: "backend", items: ["Node.js", "PostgreSQL", "MySQL"] },
  {
    key: "infra",
    items: [
      "Ubuntu",
      "Linux",
      "Docker",
      "Git",
      "GitHub",
      "GitHub Actions",
      "VS Code",
      "Cloudflare",
      "Proxmox VE",
      "Windows Server",
      "Ubuntu Server",
    ],
  },
  { key: "games", items: ["Unity", "C#", "Tauri"] },
  { key: "embedded", items: ["Raspberry Pi", "MicroPython", "Google Apps Script"] },
];

/** 資格の個別認証 URL が分かれば {{URL}} の代わりにここを差し替える */
export const CERT_URL = "https://grow.google/certificates/";

/**
 * コンタクトに並べるリンク。{{X / LinkedIn / メールなど}} は未定。
 * 追加するときは icon に対応するアイコンを components/sections/ContactIcon.tsx にも足す。
 */
export type Remote = { name: string; service: string; handle: string; url: string; icon: "github" | "instagram" };

export const REMOTES: Remote[] = [
  { name: "github", service: "GitHub", handle: "@yuyudaodevlab", url: PROFILE.github, icon: "github" },
  {
    name: "instagram",
    service: "Instagram",
    handle: "@yuyudao2877",
    url: "https://www.instagram.com/yuyudao2877/",
    icon: "instagram",
  },
];
