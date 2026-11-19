import { Block } from "@/components/build/Block";
import { REMOTES } from "@/content/shared";
import type { Dictionary } from "@/content/types";
import { Section } from "./Section";
import s from "./sections.module.css";

function RemoteList() {
  return (
    <ul className={`${s.remotes} mono`}>
      {REMOTES.flatMap((r) =>
        (["fetch", "push"] as const).map((dir) => (
          <li key={`${r.name}-${dir}`} className={s.remote}>
            <span className={s.remoteName}>{r.name}</span>
            {dir === "fetch" ? (
              <a className="link" href={r.url} rel="me">
                {r.url}
              </a>
            ) : (
              <span aria-hidden="true">{r.url}</span>
            )}
            <span className={s.dim}>({dir})</span>
          </li>
        )),
      )}
    </ul>
  );
}

export function Contact({ t }: { t: Dictionary }) {
  return (
    <Section id="contact" title={t.sections.contact.title}>
      <Block jsx="<ContactIntro />" className={s.prose}>
        <p className={s.para}>{t.contact.intro}</p>
      </Block>
      <Block jsx={`<RemoteList remotes={${REMOTES.length}} />`} className={s.remoteBlock}>
        <RemoteList />
      </Block>
    </Section>
  );
}
