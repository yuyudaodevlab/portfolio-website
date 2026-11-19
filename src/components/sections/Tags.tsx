import { Block } from "@/components/build/Block";
import type { Dictionary } from "@/content/types";
import { Section } from "./Section";
import s from "./sections.module.css";

function RecognitionTag({ tag, text, note }: { tag: string; text: string; note: string | null }) {
  return (
    <div className={s.tagRow}>
      <p className={`${s.tagName} mono`}>{tag}</p>
      <p className={s.tagText}>
        {text}
        {note ? <span className={s.tagNote}>{note}</span> : null}
      </p>
    </div>
  );
}

export function Recognition({ t }: { t: Dictionary }) {
  return (
    <Section id="recognition" title={t.sections.recognition.title}>
      <ul className={s.tagList}>
        {t.recognition.items.map((item) => (
          <Block key={item.tag} as="li" jsx={`<RecognitionTag name="${item.tag}" />`}>
            <RecognitionTag tag={item.tag} text={item.text} note={item.note} />
          </Block>
        ))}
      </ul>
    </Section>
  );
}

function CertificationTag({ tag, name, url }: { tag: string; name: string; url: string }) {
  return (
    <div className={s.tagRow}>
      <p className={`${s.tagName} mono`}>{tag}</p>
      <p className={s.tagText}>
        <a className="link" href={url}>
          {name}
        </a>
      </p>
    </div>
  );
}

export function Certifications({ t }: { t: Dictionary }) {
  return (
    <Section id="certifications" title={t.sections.certifications.title}>
      <Block jsx="<CertificationIntro />" className={s.prose}>
        <p className={s.para}>{t.certifications.intro}</p>
      </Block>
      <ul className={s.tagList}>
        {t.certifications.items.map((item) => (
          <Block key={item.tag} as="li" agent="tag" jsx={`<CertificationTag name="${item.tag}" />`}>
            <CertificationTag tag={item.tag} name={item.name} url={item.url} />
          </Block>
        ))}
      </ul>
    </Section>
  );
}
