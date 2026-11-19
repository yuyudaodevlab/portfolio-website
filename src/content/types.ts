export type Lang = "ja" | "en";
export const LANGS: Lang[] = ["ja", "en"];

export type LaneColor = "blue" | "amber" | "green";

export type SectionId =
  | "about"
  | "stack"
  | "experience"
  | "recognition"
  | "certifications"
  | "activity"
  | "contact";

export type SectionCopy = { title: string };

export type ExperienceItem = {
  key: string;
  org: string;
  /** ツールチップに出す英語の肩書き（コンポーネントの props と同じ） */
  roleEn: string;
  role: string;
  body: string;
  tags: string[];
  /** {{期間}} 分からなければ null のまま。null は表示しない */
  period: string | null;
};

export type RecognitionItem = {
  tag: string;
  text: string;
  /** 補足（日付など）。{{...}} が埋まっていなければ null */
  note: string | null;
};

export type CertificationItem = { tag: string; name: string; url: string };

export type Dictionary = {
  lang: Lang;
  meta: { title: string; description: string };
  ui: {
    skipToContent: string;
    langLabel: string;
    skip: string;
    skipIntro: string;
    rebuild: string;
    logLabel: string;
    building: string;
    complete: string;
  };
  hero: { role: string; location: string; lead: string };
  sections: Record<SectionId, SectionCopy>;
  about: { paragraphs: string[]; facts: { label: string; value: string }[] };
  stack: { intro: string; groups: Record<string, string> };
  experience: { items: ExperienceItem[] };
  recognition: { items: RecognitionItem[] };
  certifications: { intro: string; items: CertificationItem[] };
  activity: {
    contributionsLabel: string;
    calendarLabel: (total: number) => string;
    languagesLabel: string;
    reposLabel: string;
    updated: string;
    fetchedAt: (date: string, cached: boolean) => string;
    unavailable: string;
    less: string;
    more: string;
  };
  contact: { intro: string };
  footer: string;
};
