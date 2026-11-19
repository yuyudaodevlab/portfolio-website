import { Block } from "@/components/build/Block";
import type { Dictionary } from "@/content/types";
import { Section } from "./Section";
import s from "./sections.module.css";

function AboutParagraph({ text }: { text: string }) {
  return <p className={s.para}>{text}</p>;
}

function AboutFacts({ facts }: { facts: Dictionary["about"]["facts"] }) {
  return (
    <dl className={s.facts}>
      {facts.map((f) => (
        <div key={f.label} className={s.fact}>
          <dt className="mono">{f.label}</dt>
          <dd>{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function About({ t }: { t: Dictionary }) {
  return (
    <Section id="about" title={t.sections.about.title}>
      <div className={s.prose}>
        {t.about.paragraphs.map((p, i) => (
          <Block key={i} jsx={`<AboutParagraph index={${i + 1}} />`}>
            <AboutParagraph text={p} />
          </Block>
        ))}
      </div>
      <Block jsx="<AboutFacts />" className={s.aside}>
        <AboutFacts facts={t.about.facts} />
      </Block>
    </Section>
  );
}
