import type { CSSProperties } from "react";
import type { Lang } from "@/content/types";
import type { ContributionDay } from "@/lib/github";
import s from "./calendar.module.css";

const CELL = 11;
const GAP = 3;
const TOP = 18;
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * コントリビューションカレンダーを自前の SVG で描く。マスは --lane-green の濃淡。
 * ブロックが完成すると、左（1 年前）から右（今日）へ順にマスが打たれていく。
 */
export function ContributionCalendar({
  weeks,
  lang,
  label,
  less,
  more,
}: {
  weeks: ContributionDay[][];
  lang: Lang;
  label: string;
  less: string;
  more: string;
}) {
  const width = weeks.length * (CELL + GAP) - GAP;
  const height = TOP + 7 * (CELL + GAP) - GAP;

  const months: { x: number; text: string }[] = [];
  let prev = -1;
  weeks.forEach((week, wi) => {
    const first = week[0];
    if (!first) return;
    const m = Number(first.date.slice(5, 7)) - 1;
    if (m !== prev) {
      if (wi < weeks.length - 2) {
        months.push({ x: wi * (CELL + GAP), text: lang === "ja" ? `${m + 1}月` : MONTHS_EN[m]! });
      }
      prev = m;
    }
  });

  return (
    <figure className={s.wrap}>
      <svg
        className={s.svg}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={label}
        preserveAspectRatio="xMinYMin meet"
      >
        {months.map((m) => (
          <text key={`${m.x}-${m.text}`} x={m.x} y={10} className={s.month}>
            {m.text}
          </text>
        ))}
        {weeks.map((week, wi) =>
          week.map((day) => {
            const dow = new Date(`${day.date}T00:00:00Z`).getUTCDay();
            return (
              <rect
                key={day.date}
                className={s.cell}
                data-level={day.level}
                x={wi * (CELL + GAP)}
                y={TOP + dow * (CELL + GAP)}
                width={CELL}
                height={CELL}
                rx={2}
                style={{ "--w": wi, "--d": dow } as CSSProperties}
              />
            );
          }),
        )}
      </svg>
      <figcaption className={`${s.legend} mono`} aria-hidden="true">
        <span>{less}</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <svg key={l} width={CELL} height={CELL} viewBox={`0 0 ${CELL} ${CELL}`}>
            <rect className={s.swatch} data-level={l} width={CELL} height={CELL} rx={2} />
          </svg>
        ))}
        <span>{more}</span>
      </figcaption>
    </figure>
  );
}
