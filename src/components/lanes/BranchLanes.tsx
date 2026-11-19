"use client";

import { useEffect, useRef, useState } from "react";
import { buildBus } from "@/components/build/bus";
import type { SectionMeta } from "@/components/sections/config";
import styles from "./lanes.module.css";

type Geo = {
  height: number;
  rail: number;
  items: (SectionMeta & { top: number; bottom: number })[];
};

/**
 * ページ左端のブランチレーン。各セクションは main から分岐したブランチで、終わりで main にマージされる。
 * セクションのビルドが終わった瞬間、マージ点にコミットドットとハッシュが出る。
 * 線は stroke-dashoffset でスクロールに合わせて描く。ビルド対象のブロックではない。
 */
export function BranchLanes({ sections }: { sections: SectionMeta[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [geo, setGeo] = useState<Geo | null>(null);
  const [done, setDone] = useState<Set<string>>(() => new Set());

  // セクションの位置を測る
  useEffect(() => {
    const svg = svgRef.current;
    const page = svg?.closest<HTMLElement>("[data-page]");
    if (!svg || !page) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const pr = page.getBoundingClientRect();
      const rail = parseFloat(getComputedStyle(page).paddingLeft) || 96;
      const items = sections.flatMap((s) => {
        const el = document.getElementById(s.id);
        if (!el) return [];
        const r = el.getBoundingClientRect();
        return [{ ...s, top: r.top - pr.top, bottom: r.bottom - pr.top }];
      });
      setGeo({ height: page.scrollHeight, rail, items });
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    const ro = new ResizeObserver(schedule);
    ro.observe(page);
    schedule();
    return () => {
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [sections]);

  // ビルドの完了イベントを購読
  useEffect(() => {
    setDone(new Set(buildBus.sections));
    return buildBus.subscribe((e) => {
      if (e.type === "section") setDone((prev) => new Set(prev).add(e.section));
      if (e.type === "reset") setDone(new Set());
    });
  }, []);

  // スクロールに合わせて線を描く
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !geo) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const paths = [...svg.querySelectorAll<SVGPathElement>("[data-draw]")];
    if (reduced) {
      paths.forEach((p) => (p.style.strokeDashoffset = "0"));
      return;
    }
    const ac = new AbortController();
    let raf = 0;
    const update = () => {
      raf = 0;
      const top = svg.getBoundingClientRect().top;
      const reach = window.innerHeight * 0.88 - top; // ページ座標で、ここまで描く
      for (const p of paths) {
        const a = Number(p.dataset.from);
        const b = Number(p.dataset.to);
        const t = Math.max(0, Math.min(1, (reach - a) / Math.max(1, b - a)));
        p.style.strokeDashoffset = String(1 - t);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true, signal: ac.signal });
    window.addEventListener("resize", onScroll, { passive: true, signal: ac.signal });
    update();
    return () => {
      ac.abort();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [geo]);

  const rail = geo?.rail ?? 96;
  const xm = Math.round(rail * 0.3);
  const xb = Math.round(xm + Math.max(10, rail * 0.22));
  const first = geo?.items[0];
  const lastItem = geo?.items[geo.items.length - 1];
  const mainTop = 0;
  const mainBottom = lastItem ? lastItem.bottom + 40 : 0;

  return (
    <svg
      ref={svgRef}
      className={styles.lanes}
      width={rail}
      height={geo?.height ?? 0}
      aria-hidden="true"
      focusable="false"
    >
      {geo && first ? (
        <>
          <path
            className={styles.main}
            d={`M${xm} ${mainTop} V${mainBottom}`}
            pathLength={1}
            data-draw=""
            data-from={mainTop}
            data-to={mainBottom}
          />
          {geo.items.map((it) => {
            const y0 = it.top + 10;
            const y1 = it.top + 64;
            const y2 = Math.max(y1, it.bottom - 64);
            const y3 = it.bottom - 10;
            const d = `M${xm} ${y0} C${xm} ${y0 + 30} ${xb} ${y1 - 30} ${xb} ${y1} V${y2} C${xb} ${y2 + 30} ${xm} ${y3 - 30} ${xm} ${y3}`;
            const merged = done.has(it.id);
            return (
              <g key={it.id} style={{ ["--lane" as string]: `var(--lane-${it.lane})` }}>
                <path className={styles.branch} d={d} pathLength={1} data-draw="" data-from={y0} data-to={y3} />
                <circle className={styles.fork} cx={xm} cy={y0} r={2.5} />
                <circle className={styles.merge} data-on={merged ? "" : undefined} cx={xm} cy={y3} r={4.5} />
                <text className={styles.hash} data-on={merged ? "" : undefined} x={xm + 10} y={y3 + 3.5}>
                  {it.hash}
                </text>
              </g>
            );
          })}
        </>
      ) : null}
    </svg>
  );
}
