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
 * 連絡先（git remote -v として表示）。{{X / LinkedIn / メールなど}} は未定。
 * 追加するときは { name: "x", url: "https://..." } の形で足す。
 */
export const REMOTES: { name: string; url: string; label: string }[] = [
  { name: "github", url: PROFILE.github, label: PROFILE.githubLabel },
  { name: "instagram", url: "https://www.instagram.com/yuyudao2877/", label: "instagram.com/yuyudao2877" },
];
