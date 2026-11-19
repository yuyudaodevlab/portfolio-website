import { notFound } from "next/navigation";
import { BuildRuntime } from "@/components/build/BuildRuntime";
import { GraphBackground } from "@/components/graph/GraphBackground";
import { BranchLanes } from "@/components/lanes/BranchLanes";
import { ScrollFx } from "@/components/lanes/ScrollFx";
import { About } from "@/components/sections/About";
import { Activity } from "@/components/sections/Activity";
import { SECTIONS } from "@/components/sections/config";
import { Contact } from "@/components/sections/Contact";
import { Experience } from "@/components/sections/Experience";
import { Hero } from "@/components/sections/Hero";
import { Stack } from "@/components/sections/Stack";
import { Certifications, Recognition } from "@/components/sections/Tags";
import { SiteFooter, SiteHeader } from "@/components/site/SiteHeader";
import { getDictionary, isLang } from "@/content";
import { getGithubData } from "@/lib/github";
import styles from "./page.module.css";

export const revalidate = 3600;

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDictionary(lang);
  const github = await getGithubData();
  const repoNames = github.repos.map((r) => r.name);

  return (
    <>
      <GraphBackground repoNames={repoNames} />
      <div className={styles.page} data-page="">
        <a className="skip-link" href="#main">
          {t.ui.skipToContent}
        </a>
        <SiteHeader lang={lang} t={t} />
        <BranchLanes sections={SECTIONS.filter((s) => s.id !== "hero")} />
        <main id="main" className={styles.main}>
          <Hero t={t} />
          <About t={t} />
          <Stack t={t} />
          <Experience t={t} />
          <Recognition t={t} />
          <Certifications t={t} />
          <Activity t={t} lang={lang} data={github} />
          <Contact t={t} />
        </main>
        <SiteFooter t={t} />
        <BuildRuntime key={lang} ui={t.ui} />
        <ScrollFx />
      </div>
    </>
  );
}
