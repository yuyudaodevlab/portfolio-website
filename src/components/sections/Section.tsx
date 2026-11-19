import type { CSSProperties, ReactNode } from "react";
import { Block } from "@/components/build/Block";
import { TypedHeadline } from "@/components/build/TypedHeadline";
import { sectionMeta, type SectionMeta } from "./config";
import s from "./sections.module.css";

export function laneStyle(lane: SectionMeta["lane"]): CSSProperties {
  return { ["--lane" as string]: `var(--lane-${lane})` };
}

/** 見出し: 7 桁のハッシュ ＋ Git 風ラベル（Mono）＋ 普通の言葉の h2（タイピングで打たれる） */
export function SectionHeading({ id, title }: { id: SectionMeta["id"]; title: string }) {
  const meta = sectionMeta(id);
  return (
    <Block kind="headline" jsx={`<SectionHeading id="${id}" />`} className={s.headBlock}>
      <header className={s.head} data-parallax="">
        <p className={`${s.meta} mono`} aria-hidden="true">
          <span className={s.hash}>{meta.hash}</span>
          <span className={s.label}>{meta.label}</span>
        </p>
        <h2 id={`${id}-title`} className={s.title}>
          <TypedHeadline text={title} />
        </h2>
      </header>
    </Block>
  );
}

export function Section({
  id,
  title,
  children,
  className,
}: {
  id: SectionMeta["id"];
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const meta = sectionMeta(id);
  return (
    <section
      id={id}
      className={className ? `${s.section} ${className}` : s.section}
      data-section={id}
      data-lane={meta.lane}
      style={laneStyle(meta.lane)}
      aria-labelledby={`${id}-title`}
    >
      <SectionHeading id={id} title={title} />
      {children}
    </section>
  );
}
