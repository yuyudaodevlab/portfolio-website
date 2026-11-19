import type { CSSProperties } from "react";
import { Block } from "@/components/build/Block";
import { REMOTES, type Remote } from "@/content/shared";
import type { Dictionary } from "@/content/types";
import { laneAt } from "./config";
import { ContactIcon } from "./ContactIcon";
import { Section } from "./Section";
import s from "./sections.module.css";

function RemoteLink({ remote, index }: { remote: Remote; index: number }) {
  return (
    <a
      className={s.remoteLink}
      href={remote.url}
      rel="me noopener"
      style={{ ["--lane" as string]: `var(--lane-${laneAt(index)})` } as CSSProperties}
    >
      <span className={s.remoteIcon}>
        <ContactIcon icon={remote.icon} />
      </span>
      <span className={s.remoteText}>
        <span className={s.remoteService}>{remote.service}</span>
        <span className={`${s.remoteHandle} mono`}>{remote.handle}</span>
      </span>
      <span className={`${s.remoteIndex} mono`} aria-hidden="true">
        {String(index + 1).padStart(2, "0")}
      </span>
      <svg className={s.remoteArrow} viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
        <path d="M6 18 18 6M9 6h9v9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
      </svg>
    </a>
  );
}

export function Contact({ t }: { t: Dictionary }) {
  return (
    <Section id="contact" title={t.sections.contact.title}>
      <Block jsx="<ContactIntro />" className={s.prose}>
        <p className={s.para}>{t.contact.intro}</p>
      </Block>
      <ul className={s.remotes}>
        {REMOTES.map((r, i) => (
          <Block key={r.name} as="li" jsx={`<RemoteLink name="${r.name}" />`}>
            <RemoteLink remote={r} index={i} />
          </Block>
        ))}
      </ul>
    </Section>
  );
}
