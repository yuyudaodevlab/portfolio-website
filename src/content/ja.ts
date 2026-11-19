import { CERT_URL } from "./shared";
import type { Dictionary } from "./types";

export const ja: Dictionary = {
  lang: "ja",
  meta: {
    title: "Yuyudaodevlab — エンジニア / 日本語ローカライザー",
    description:
      "日本でソフトウェアを作っています。Next.js、Python、Proxmox VE。micro:bit、Microsoft MakeCode、Proton、Hypixel の日本語化に参加しています。",
  },
  ui: {
    skipToContent: "本文へ移動",
    langLabel: "言語",
    skip: "skip",
    rebuild: "rebuild",
    logLabel: "ビルドログ",
    building: "組み立て中",
    complete: "完成",
  },
  hero: {
    role: "エンジニア / 日本語ローカライザー",
    location: "日本",
    lead: "Web アプリと AI まわりの処理を書き、仮想化基盤を動かし、ソフトウェアを日本語にしています。",
  },
  sections: {
    about: { title: "自己紹介" },
    stack: { title: "技術スタック" },
    experience: { title: "経歴" },
    recognition: { title: "受賞・メディア" },
    certifications: { title: "資格" },
    activity: { title: "活動" },
    contact: { title: "連絡先" },
  },
  about: {
    paragraphs: [
      "日本でソフトウェアを作っています。Next.js で Web アプリを設計して書き、Python で AI まわりの処理を組んでいます。",
      "Proxmox VE で仮想化基盤を構築し、その上で Windows Server と Ubuntu Server を運用しています。",
      "もう一つの仕事は翻訳です。micro:bit、Microsoft MakeCode、Proton、Hypixel の日本語化に参加しています。",
      "Google の AI 関連資格を 4 つ持っています。",
    ],
    facts: [
      { label: "拠点", value: "日本" },
      { label: "仕事", value: "ソフトウェア開発 / 日本語ローカライズ" },
    ],
  },
  stack: {
    intro: "普段使っているもの。用途ごとに分けています。",
    groups: {
      languages: "言語",
      frontend: "フロントエンド",
      backend: "バックエンド・DB",
      infra: "インフラ・ツール",
      games: "ゲーム・アプリ",
      embedded: "組み込み・スクリプト",
    },
  },
  experience: {
    items: [
      {
        key: "microbit",
        org: "Micro:bit Educational Foundation",
        roleEn: "Japanese Translator & Proofreader",
        role: "日本語翻訳・校正",
        body: "世界 60 か国以上の教育現場で使われているマイコン学習プラットフォーム、micro:bit の日本語翻訳と校正。",
        tags: ["Localization", "Technical Writing", "EdTech", "i18n"],
        period: null, // {{期間}}
      },
      {
        key: "makecode",
        org: "Microsoft MakeCode",
        roleEn: "Japanese Translator & Proofreader",
        role: "日本語翻訳・校正",
        body: "micro:bit、Adafruit Circuit Playground、Minecraft Education などに対応する、Microsoft のオープンソース教育プラットフォームの日本語翻訳と校正。",
        tags: ["Open Source", "Translation QA"],
        period: null, // {{期間}}
      },
      {
        key: "minna",
        org: "みんなの銀行",
        roleEn: "3rd Official Ambassador",
        role: "第 3 期公式アンバサダー",
        body: "日本初のフルデジタルのスマートフォン銀行、みんなの銀行の第 3 期公式アンバサダー。",
        tags: ["FinTech", "Community"],
        period: null, // {{期間}}
      },
      {
        key: "hypixel",
        org: "Hypixel Network",
        roleEn: "Japanese Translator",
        role: "日本語翻訳",
        body: "登録プレイヤー 3,500 万人以上、世界最大の Minecraft サーバーネットワークの日本語翻訳。",
        tags: ["Game Localization", "Community Translation"],
        period: null, // {{期間}}
      },
      {
        key: "proton",
        org: "Proton",
        roleEn: "Japanese Translator",
        role: "日本語翻訳",
        body: "Proton Mail、Proton VPN、Proton Drive、Proton Pass など、Proton の製品全体の日本語翻訳。",
        tags: ["Privacy", "Localization", "Open Source"],
        period: null, // {{期間}}
      },
    ],
  },
  recognition: {
    items: [
      { tag: "ambassador/minna-no-ginko", text: "みんなの銀行 第 3 期公式アンバサダー", note: null },
      {
        tag: "media/hbc-radio",
        text: "HBC ラジオ『どさんこテックハイスクール‐未来ナビ‐』第 65 回に出演",
        note: "2026 年 10 月 22 日放送",
      },
      { tag: "media/yomiuri", text: "読売新聞の学校広報記事で紹介", note: null /* {{掲載日}} */ },
      { tag: "film/feature", text: "受賞歴のある日本の劇場公開長編映画に出演", note: null /* {{作品名}} */ },
      { tag: "cert/google-ai", text: "Google の AI 関連資格を 4 つ保有", note: null },
    ],
  },
  certifications: {
    intro: "Google の AI 関連資格。",
    items: [
      { tag: "cert/google-ai-professional", name: "Google AI Professional Certificate", url: CERT_URL },
      { tag: "cert/generative-ai-leader", name: "Generative AI Leader Professional Certificate", url: CERT_URL },
      { tag: "cert/google-ai-essentials", name: "Google AI Essentials", url: CERT_URL },
      { tag: "cert/google-prompting-essentials", name: "Google Prompting Essentials", url: CERT_URL },
    ],
  },
  activity: {
    contributionsLabel: "直近 1 年のコントリビューション",
    calendarLabel: (total) => `直近 1 年のコントリビューションカレンダー。合計 ${total} 件。`,
    languagesLabel: "言語の割合（公開リポジトリのコード量）",
    reposLabel: "最近更新したリポジトリ",
    updated: "更新",
    fetchedAt: (date, cached) => `GitHub から取得 ${date}${cached ? "（保存済みの値）" : ""}`,
    unavailable: "GitHub のデータを取得できませんでした。",
    less: "少",
    more: "多",
  },
  contact: {
    intro: "連絡は GitHub か Instagram からどうぞ。",
  },
  footer: "Next.js と Three.js で作っています。",
};
