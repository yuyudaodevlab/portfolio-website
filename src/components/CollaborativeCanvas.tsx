"use client";

import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { ArrowDownRight, ArrowUpRight, GitBranch, MousePointer2 } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./collaborative.css";

type Box = { x: number; y: number; width: number; height: number };
type Operation = {
  id: string;
  cursor: string;
  start: number;
  end: number;
  path: [[number, number], [number, number], [number, number], [number, number]];
  target: string;
  type: "draw" | "resize" | "move" | "type" | "style" | "guides";
  ease: "linear" | "cubicOut";
  from: Box | string | number | number[] | null;
  to: Box | string | number | number[] | null;
};

const roles = [
  { id: "design", label: "デザイン", color: "#b69cff" },
  { id: "frontend", label: "フロントエンド", color: "#59d9e8" },
  { id: "motion", label: "モーション", color: "#f2a77d" },
  { id: "systems", label: "システム", color: "#9be2ae" },
  { id: "localization", label: "ローカライズ", color: "#f0cf72" },
];

const initialBoxes: Record<string, Box> = {
  profile: { x: 53, y: 7, width: 32, height: 30 },
  stack: { x: 8, y: 68, width: 35, height: 23 },
  work: { x: 55, y: 68, width: 30, height: 23 },
};
const finalBoxes: Record<string, Box> = {
  profile: { x: 7, y: 17, width: 48, height: 37 },
  stack: { x: 59, y: 17, width: 34, height: 37 },
  work: { x: 7, y: 61, width: 86, height: 27 },
};
const mobileFinalBoxes: Record<string, Box> = {
  profile: { x: 5, y: 5, width: 90, height: 31 },
  stack: { x: 5, y: 40, width: 90, height: 21 },
  work: { x: 5, y: 66, width: 90, height: 28 },
};

// Scroll progress is the single source of truth for every visual state.
const operations: Operation[] = [
  { id: "frame", cursor: "design", start: 0.02, end: 0.27, path: [[7, 10], [8, 17], [17, 25], [22, 33]], target: "frame", type: "draw", ease: "cubicOut", from: null, to: null },
  { id: "frame-size", cursor: "frontend", start: 0.18, end: 0.46, path: [[22, 33], [48, 34], [78, 78], [98, 98]], target: "frame", type: "resize", ease: "cubicOut", from: null, to: null },
  { id: "profile-card", cursor: "design", start: 0.28, end: 0.54, path: [[58, 32], [53, 41], [26, 48], [10, 48]], target: "profile", type: "move", ease: "cubicOut", from: initialBoxes.profile, to: finalBoxes.profile },
  { id: "stack-card", cursor: "systems", start: 0.36, end: 0.62, path: [[17, 77], [30, 66], [73, 59], [76, 43]], target: "stack", type: "move", ease: "cubicOut", from: initialBoxes.stack, to: finalBoxes.stack },
  { id: "work-card", cursor: "localization", start: 0.43, end: 0.7, path: [[81, 82], [72, 74], [41, 75], [32, 75]], target: "work", type: "move", ease: "cubicOut", from: initialBoxes.work, to: finalBoxes.work },
  { id: "headline", cursor: "frontend", start: 0.48, end: 0.7, path: [[18, 27], [23, 29], [31, 35], [38, 39]], target: "headline", type: "type", ease: "linear", from: "", to: "アイデアを、動くシステムへ。" },
  { id: "style", cursor: "motion", start: 0.57, end: 0.79, path: [[80, 32], [73, 42], [67, 48], [63, 51]], target: "profile", type: "style", ease: "cubicOut", from: [0.1, 0.1], to: [1, 1] },
  { id: "guides-on", cursor: "systems", start: 0.35, end: 0.49, path: [[91, 12], [82, 13], [76, 17], [76, 20]], target: "guides", type: "guides", ease: "linear", from: 0, to: 1 },
  { id: "guides-off", cursor: "localization", start: 0.72, end: 0.86, path: [[39, 52], [43, 47], [55, 45], [59, 40]], target: "guides", type: "guides", ease: "linear", from: 1, to: 0 },
];

const finalHeadline = "アイデアを、動くシステムへ。";

function progressFor(progress: number, operation: Operation) {
  const raw = Math.max(0, Math.min(1, (progress - operation.start) / (operation.end - operation.start)));
  return operation.ease === "cubicOut" ? 1 - (1 - raw) ** 3 : raw;
}

function pointOnPath(t: number, path: Operation["path"]): [number, number] {
  const u = 1 - t;
  return [
    u ** 3 * path[0][0] + 3 * u ** 2 * t * path[1][0] + 3 * u * t ** 2 * path[2][0] + t ** 3 * path[3][0],
    u ** 3 * path[0][1] + 3 * u ** 2 * t * path[1][1] + 3 * u * t ** 2 * path[2][1] + t ** 3 * path[3][1],
  ];
}

export default function CollaborativeCanvas() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;
    gsap.registerPlugin(ScrollTrigger);

    const frame = canvas.querySelector<HTMLElement>(".cc-frame");
    const guides = canvas.querySelector<HTMLElement>(".cc-guides");
    const headline = canvas.querySelector<HTMLElement>(".cc-headline");
    const cards = Object.fromEntries(["profile", "stack", "work"].map((id) => [id, canvas.querySelector<HTMLElement>(`[data-card='${id}']`)]));
    const cursors = Object.fromEntries(roles.map((role) => [role.id, canvas.querySelector<HTMLElement>(`[data-cursor='${role.id}']`)]));
    const roleLabels = Object.fromEntries(roles.map((role) => [role.id, section.querySelector<HTMLElement>(`[data-role='${role.id}']`)]));
    if (!frame || !guides || !headline) return;

    const render = (progress: number) => {
      const draw = progressFor(progress, operations[0]);
      const resize = progressFor(progress, operations[1]);
      frame.style.clipPath = `inset(0 ${100 - draw * 100}% ${100 - draw * 100}% 0)`;
      frame.style.width = `${15 + resize * 85}%`;
      frame.style.height = `${23 + resize * 77}%`;
      frame.style.transformOrigin = "top left";
      for (const operation of operations) {
        const amount = progressFor(progress, operation);
        if (operation.type === "move") {
          const element = cards[operation.target];
          const from = operation.from as Box;
          const to = (window.innerWidth <= 760 ? mobileFinalBoxes : finalBoxes)[operation.target];
          if (element) {
            const mix = (a: number, b: number) => a + (b - a) * amount;
            element.style.left = `${mix(from.x, to.x)}%`;
            element.style.top = `${mix(from.y, to.y)}%`;
            element.style.width = `${mix(from.width, to.width)}%`;
            element.style.height = `${mix(from.height, to.height)}%`;
            element.style.opacity = `${amount}`;
          }
        } else if (operation.type === "type") {
          const text = operation.to as string;
          headline.textContent = text.slice(0, Math.round(text.length * amount));
        } else if (operation.type === "style") {
          const from = operation.from as number[];
          const to = operation.to as number[];
          const values = from.map((value, index) => value + (to[index] - value) * amount);
          const element = cards.profile;
          if (element) {
            element.style.borderRadius = `${values[0] * 12}px`;
            element.style.backgroundColor = `rgba(22, 20, 38, ${0.32 + values[1] * 0.56})`;
          }
        }
      }
      const guideIn = progressFor(progress, operations.find((operation) => operation.id === "guides-on")!);
      const guideOut = progressFor(progress, operations.find((operation) => operation.id === "guides-off")!);
      guides.style.opacity = `${guideIn * (1 - guideOut)}`;
      const typing = operations.find((operation) => operation.type === "type")!;
      headline.classList.toggle("is-typing", progress >= typing.start && progress <= typing.end);
      const restingPositions: Record<string, [number, number]> = { design: [15, 42], frontend: [86, 21], motion: [46, 82], systems: [84, 74], localization: [31, 62] };
      for (const role of roles) {
        const cursor = cursors[role.id];
        if (!cursor) continue;
        const activeOperation = operations.find((operation) => operation.cursor === role.id && progress >= operation.start && progress <= operation.end);
        const [x, y] = activeOperation ? pointOnPath(progressFor(progress, activeOperation), activeOperation.path) : restingPositions[role.id];
        cursor.style.left = `${x}%`;
        cursor.style.top = `${y}%`;
        cursor.style.opacity = progress > 0.87 ? "0" : activeOperation ? "1" : "0.46";
        const label = roleLabels[role.id];
        if (label) label.classList.toggle("is-active", activeOperation !== undefined);
      }
      const frameFade = progressFor(progress, { ...operations[0], start: 0.86, end: 0.99 });
      frame.style.opacity = `${1 - frameFade}`;
      if (progress >= 0.99) headline.textContent = finalHeadline;
    };

    render(0);
    const context = gsap.matchMedia();
    context.add({ motion: "(prefers-reduced-motion: no-preference)", still: "(prefers-reduced-motion: reduce)" }, (media) => {
      const { motion } = media.conditions as { motion: boolean; still: boolean };
      if (!motion) {
        render(1);
        for (const cursor of Object.values(cursors)) if (cursor) cursor.style.opacity = "0";
        return;
      }
      const driver = { progress: 0 };
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${window.innerWidth < 700 ? 1000 : 1800}`,
          pin: section,
          scrub: 0.65,
          invalidateOnRefresh: true,
          onUpdate: (self) => { const fill = section.querySelector<HTMLElement>(".cc-progress-fill"); if (fill) fill.style.transform = `scaleX(${self.progress})`; },
        },
      });
      timeline.to(driver, { progress: 1, duration: 1, ease: "none", onUpdate: () => render(driver.progress) });
      return () => { timeline.scrollTrigger?.kill(); timeline.kill(); };
    });

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("resize", refresh);
    return () => { window.removeEventListener("resize", refresh); context.revert(); };
  }, []);

  return (
    <section className="cc-section" id="building" ref={sectionRef} aria-labelledby="cc-title">
      <div className="cc-shell">
        <header className="cc-intro">
          <p className="cc-kicker"><span /> PROCESS / COLLABORATION</p>
          <h2 id="cc-title">つくる過程も、<br /><em>作品になる。</em></h2>
          <div className="cc-intro-aside"><p>デザイン、実装、仕組み、ことば。<br />それぞれの視点が重なり、アイデアが動き出す。</p><div className="cc-role-list">{roles.map((role) => <span data-role={role.id} key={role.id}><i style={{ "--role-color": role.color } as CSSProperties} />{role.label}</span>)}</div><small className="cc-fiction-note">※ 共同作業の流れを表現した架空の編集画面です</small></div>
        </header>
        <div className="cc-editor">
          <div className="cc-toolbar"><span className="cc-file"><GitBranch size={14} /><b>yuyudao</b><i>/</i>portfolio<span className="cc-branch-tag">main</span></span><span className="cc-live"><i />制作プロセスを可視化</span><a href="#about" className="cc-open-link">プロフィールを見る <ArrowUpRight size={13} /></a></div>
          <div className="cc-workspace">
            <div className="cc-side-index"><span>01</span><span>02</span><span>03</span><span className="cc-side-line" /><small>CANVAS</small></div>
            <div className="cc-board">
              <div className="cc-board-meta"><span>PORTFOLIO / COMPOSITION</span><span>DESIGN × SYSTEMS <i>·</i> 1440 × 900</span></div>
              <div className="cc-canvas" ref={canvasRef}>
                <div className="cc-canvas-wash" /><div className="cc-canvas-grid" />
                <div className="cc-frame"><span className="cc-frame-label">YUYUDAO / PORTFOLIO</span><span className="cc-resize-handle" /></div>
                <div className="cc-guides"><span className="cc-guide-v" /><span className="cc-guide-h" /><span className="cc-guide-label">ALIGN / 08</span></div>
                <article className="cc-card cc-profile" data-card="profile"><span className="cc-card-index">01 — PROFILE</span><h3 className="cc-headline">{finalHeadline}</h3><p>技術とことばで、境界をつなぐ。</p><a href="#about">プロフィール <ArrowUpRight size={13} /></a><span className="cc-card-glow" /></article>
                <article className="cc-card cc-stack" data-card="stack"><span className="cc-card-index">02 — TOOLKIT</span><h3>つなぐ技術。</h3><div className="cc-stack-chips"><span>AI</span><span>FULL STACK</span><span>i18n</span><span>SYSTEMS</span></div><a href="#ecosystem">技術スタック <ArrowUpRight size={13} /></a></article>
                <article className="cc-card cc-work" data-card="work"><span className="cc-card-index">03 — CONTRIBUTIONS</span><h3>ひらかれた場所で、技術を届ける。</h3><div className="cc-work-orgs"><span>micro:bit</span><span>MakeCode</span><span>みんなの銀行</span><span>Hypixel</span></div><a href="#experience">活動を見る <ArrowUpRight size={13} /></a></article>
                {roles.map((role) => <div className="cc-cursor" data-cursor={role.id} key={role.id} style={{ "--role-color": role.color } as CSSProperties}><MousePointer2 size={17} fill="var(--role-color)" /><span>{role.label}</span></div>)}
              </div>
            </div>
          </div>
          <div className="cc-status"><span><i /> ひとつのアイデアが、かたちになるまで。</span><span>SCROLL TO BUILD <b>↓</b></span></div>
          <div className="cc-progress"><span className="cc-progress-fill" /></div>
        </div>
        <div className="cc-next"><span>SCROLL JOURNEY</span><a href="#about">次の章へ <ArrowDownRight size={14} /></a></div>
      </div>
    </section>
  );
}
