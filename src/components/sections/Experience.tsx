import { Block } from "@/components/build/Block";
import type { Dictionary, ExperienceItem, LaneColor } from "@/content/types";
import { shortHash } from "@/lib/hash";
import { laneAt } from "./config";
import { laneStyle, Section } from "./Section";
import s from "./sections.module.css";

function ExperienceRow({ item, lane, last }: { item: ExperienceItem; lane: LaneColor; last: boolean }) {
  return (
    <article className={s.expRow} data-highlight={lane} style={laneStyle(lane)}>
      <div className={s.expGraph} aria-hidden="true">
        <span className={s.expLine} data-last={last ? "" : undefined} />
        <span className={s.expDot} />
      </div>
      <p className={`${s.expHash} mono`} aria-hidden="true">
        {shortHash(`exp:${item.key}`)}
      </p>
      <div className={s.expBody}>
        <h3 className={s.expOrg}>{item.org}</h3>
        <p className={s.expRole}>
          {item.role}
          {item.period ? <span className="mono"> · {item.period}</span> : null}
        </p>
        <p className={s.expText}>{item.body}</p>
        <ul className={`${s.tags} mono`}>
          {item.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export function Experience({ t }: { t: Dictionary }) {
  const items = t.experience.items;
  return (
    <Section id="experience" title={t.sections.experience.title}>
      <ol className={s.expList}>
        {items.map((item, i) => (
          <Block
            key={item.key}
            as="li"
            prefer="rebase"
            jsx={`<ExperienceRow org="${item.org}" role="${item.roleEn}" />`}
          >
            <ExperienceRow item={item} lane={laneAt(i)} last={i === items.length - 1} />
          </Block>
        ))}
      </ol>
    </Section>
  );
}
