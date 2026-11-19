import { Block } from "@/components/build/Block";
import { STACK } from "@/content/shared";
import type { Dictionary } from "@/content/types";
import { Section } from "./Section";
import s from "./sections.module.css";

function StackGroup({ name, label, items }: { name: string; label: string; items: string[] }) {
  return (
    <div className={s.stackGroup}>
      <h3 className={s.stackKey}>
        <span className="mono">&quot;{name}&quot;</span>
        <span className={s.stackLabel}>{label}</span>
      </h3>
      <ul className={s.stackItems}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function Stack({ t }: { t: Dictionary }) {
  return (
    <Section id="stack" title={t.sections.stack.title}>
      <Block jsx="<StackIntro />" className={s.prose}>
        <p className={s.para}>{t.stack.intro}</p>
      </Block>
      <div className={s.stackGrid}>
        {STACK.map((g) => (
          <Block key={g.key} jsx={`<StackGroup name="${g.key}" />`}>
            <StackGroup name={g.key} label={t.stack.groups[g.key] ?? g.key} items={g.items} />
          </Block>
        ))}
      </div>
    </Section>
  );
}
