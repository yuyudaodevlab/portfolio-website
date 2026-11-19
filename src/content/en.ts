import { CERT_URL } from "./shared";
import type { Dictionary } from "./types";

export const en: Dictionary = {
  lang: "en",
  meta: {
    title: "Yuyudaodevlab — Engineer / Japanese localizer",
    description:
      "I build software in Japan with Next.js, Python and Proxmox VE, and help localize micro:bit, Microsoft MakeCode, Proton and Hypixel into Japanese.",
  },
  ui: {
    skipToContent: "Skip to content",
    langLabel: "Language",
    skip: "skip",
    rebuild: "rebuild",
    logLabel: "Build log",
    building: "Building",
    complete: "Done",
  },
  hero: {
    role: "Engineer / Japanese localizer",
    location: "Japan",
    lead: "I write web apps and AI pipelines, run my own virtualization stack, and translate software into Japanese.",
  },
  sections: {
    about: { title: "About" },
    stack: { title: "Stack" },
    experience: { title: "Experience" },
    recognition: { title: "Recognition" },
    certifications: { title: "Certifications" },
    activity: { title: "Activity" },
    contact: { title: "Contact" },
  },
  about: {
    paragraphs: [
      "I build software in Japan. I design and write web apps with Next.js, and put together AI pipelines in Python.",
      "I set up my own virtualization on Proxmox VE and run Windows Server and Ubuntu Server on top of it.",
      "My other work is translation. I help localize micro:bit, Microsoft MakeCode, Proton and Hypixel into Japanese.",
      "I hold four AI-related certificates from Google.",
    ],
    facts: [
      { label: "Based in", value: "Japan" },
      { label: "Work", value: "Software / Japanese localization" },
    ],
  },
  stack: {
    intro: "What I use day to day, grouped by what it is for.",
    groups: {
      languages: "Languages",
      frontend: "Frontend",
      backend: "Backend & databases",
      infra: "Infrastructure & tooling",
      games: "Games & apps",
      embedded: "Embedded & scripting",
    },
  },
  experience: {
    items: [
      {
        key: "microbit",
        org: "Micro:bit Educational Foundation",
        roleEn: "Japanese Translator & Proofreader",
        role: "Japanese translator & proofreader",
        body: "Japanese translation and proofreading for micro:bit, a microcontroller learning platform used in classrooms in more than 60 countries.",
        tags: ["Localization", "Technical Writing", "EdTech", "i18n"],
        period: null, // {{期間}}
      },
      {
        key: "makecode",
        org: "Microsoft MakeCode",
        roleEn: "Japanese Translator & Proofreader",
        role: "Japanese translator & proofreader",
        body: "Japanese translation and proofreading for Microsoft’s open-source education platform, which supports micro:bit, Adafruit Circuit Playground, Minecraft Education and more.",
        tags: ["Open Source", "Translation QA"],
        period: null, // {{期間}}
      },
      {
        key: "minna",
        org: "Minna no Ginko",
        roleEn: "3rd Official Ambassador",
        role: "Official ambassador, third cohort",
        body: "Official ambassador in the third cohort for Minna no Ginko, Japan’s first fully digital smartphone bank.",
        tags: ["FinTech", "Community"],
        period: null, // {{期間}}
      },
      {
        key: "hypixel",
        org: "Hypixel Network",
        roleEn: "Japanese Translator",
        role: "Japanese translator",
        body: "Japanese translation for the largest Minecraft server network in the world, with more than 35 million registered players.",
        tags: ["Game Localization", "Community Translation"],
        period: null, // {{期間}}
      },
      {
        key: "proton",
        org: "Proton",
        roleEn: "Japanese Translator",
        role: "Japanese translator",
        body: "Japanese translation across Proton’s products, including Proton Mail, Proton VPN, Proton Drive and Proton Pass.",
        tags: ["Privacy", "Localization", "Open Source"],
        period: null, // {{期間}}
      },
    ],
  },
  recognition: {
    items: [
      {
        tag: "ambassador/minna-no-ginko",
        text: "Official ambassador, third cohort, for Minna no Ginko",
        note: null,
      },
      {
        tag: "media/hbc-radio",
        text: "Guest on episode 65 of “Dosanko Tech High School: Mirai Navi” on HBC Radio",
        note: "Aired October 22, 2026",
      },
      { tag: "media/yomiuri", text: "Featured in a school article in the Yomiuri Shimbun", note: null /* {{掲載日}} */ },
      {
        tag: "film/feature",
        text: "Appeared in an award-winning Japanese feature film released in theaters",
        note: null /* {{作品名}} */,
      },
      { tag: "cert/google-ai", text: "Holds four AI-related certificates from Google", note: null },
    ],
  },
  certifications: {
    intro: "AI-related certificates from Google.",
    items: [
      { tag: "cert/google-ai-professional", name: "Google AI Professional Certificate", url: CERT_URL },
      { tag: "cert/generative-ai-leader", name: "Generative AI Leader Professional Certificate", url: CERT_URL },
      { tag: "cert/google-ai-essentials", name: "Google AI Essentials", url: CERT_URL },
      { tag: "cert/google-prompting-essentials", name: "Google Prompting Essentials", url: CERT_URL },
    ],
  },
  activity: {
    contributionsLabel: "Contributions in the last year",
    calendarLabel: (total) => `Contribution calendar for the last year, ${total} contributions in total.`,
    languagesLabel: "Languages, by code size across public repositories",
    reposLabel: "Recently updated repositories",
    updated: "updated",
    fetchedAt: (date, cached) => `Fetched from GitHub ${date}${cached ? " (saved copy)" : ""}`,
    unavailable: "Could not load data from GitHub.",
    less: "Less",
    more: "More",
  },
  contact: {
    intro: "For now, GitHub is the only way to reach me.",
  },
  footer: "Built with Next.js and Three.js.",
};
