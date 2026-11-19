import { Block } from "@/components/build/Block";
import { TypedHeadline } from "@/components/build/TypedHeadline";
import { PROFILE } from "@/content/shared";
import type { Dictionary } from "@/content/types";
import { sectionMeta } from "./config";
import { laneStyle } from "./Section";
import s from "./sections.module.css";

function HeroMeta() {
  const meta = sectionMeta("hero");
  return (
    <p className={`${s.heroMeta} mono`}>
      <span className={s.hash}>{meta.hash}</span>
      <span>
        (<span className={s.headRef}>HEAD</span> -&gt; <span className={s.branch}>main</span>)
      </span>
    </p>
  );
}

function HeroName() {
  return (
    <h1 className={s.heroName} aria-label={PROFILE.name}>
      <TypedHeadline text={PROFILE.nameLines.join("\n")} stretch />
    </h1>
  );
}

function HeroRole({ t }: { t: Dictionary }) {
  return (
    <p className={s.heroRole}>
      <span>{t.hero.role}</span>
      <span className={s.heroLoc}>
        <span className="mono">loc</span> {t.hero.location}
      </span>
    </p>
  );
}

function HeroLead({ t }: { t: Dictionary }) {
  return (
    <div className={s.heroLead}>
      <p>{t.hero.lead}</p>
      <p className="mono">
        <a className="link" href={PROFILE.github} rel="me">
          {PROFILE.githubLabel}
        </a>
      </p>
    </div>
  );
}

export function Hero({ t }: { t: Dictionary }) {
  return (
    <section id="top" className={s.hero} data-section="hero" data-lane="blue" style={laneStyle("blue")} aria-label={PROFILE.name}>
      <Block jsx={`<HeroMeta head="main" />`} className={s.heroMetaBlock}>
        <HeroMeta />
      </Block>
      <Block kind="headline" agent="commit" ghost jsx={`<HeroName text="${PROFILE.name}" />`} className={s.heroNameBlock}>
        <HeroName />
      </Block>
      <Block jsx={`<HeroRole role="${t.hero.role}" />`} className={s.heroRoleBlock}>
        <HeroRole t={t} />
      </Block>
      <Block jsx={`<HeroLead />`} className={s.heroLeadBlock}>
        <HeroLead t={t} />
      </Block>
    </section>
  );
}
