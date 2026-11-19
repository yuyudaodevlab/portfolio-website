import type { LaneColor } from "@/content/types";
import { AGENTS, type AgentName } from "./agents";
import { buildBus } from "./bus";
import { assignSection, collectSections, type BlockJob, type SectionPlan } from "./scheduler";
import { AutoScroller, keepInViewTarget, watchDeliberateScroll, type Span } from "./scroll";

/**
 * エージェントカーソルによるライブビルドのエンジン。
 * - requestAnimationFrame のループは 1 本だけ。カーソル・マーキー・タイピング・自動スクロールを全部ここで進める
 * - 時間はすべて rAF のタイムスタンプで数える（タイマーはループが止まったときの見張り 1 本だけ）
 * - 1 回の再生に 1 つの AbortController。Rebuild / Skip / 破棄で abort してリスナーとオブザーバーを一括で外す
 * - 動かすのは transform / opacity / filter だけ（例外はヒーロー名の width 軸）
 */

export type EngineStatus = "off" | "playing" | "rebuilding" | "complete";

export type LogLine = {
  id: number;
  time: string;
  agent: AgentName;
  color: LaneColor;
  text: string;
};

export type EngineOptions = {
  /** ページ座標の原点（position: relative の要素） */
  page: HTMLElement;
  /** カーソルとフレームを置くレイヤー */
  layer: HTMLElement;
  /** ?play のとき true。意図的スクロールでの切り替えをしない */
  play: boolean;
  onLog: (line: LogLine) => void;
  onStatus: (status: EngineStatus) => void;
};

export type Engine = {
  skip: () => void;
  rebuild: () => void;
  destroy: () => void;
};

type Rect = { x: number; y: number; w: number; h: number };
type Phase = "travel" | "wait" | "mark" | "rough" | "type";

type Frame = {
  el: HTMLElement;
  tint: HTMLElement;
  eT: HTMLElement;
  eTi: HTMLElement;
  eB: HTMLElement;
  eBi: HTMLElement;
  eL: HTMLElement;
  eLi: HTMLElement;
  eR: HTMLElement;
  eRi: HTMLElement;
  dims: HTMLElement;
  tip: HTMLElement;
  busy: boolean;
};

type Typing = {
  root: HTMLElement;
  text: string;
  typed: HTMLElement;
  caret: HTMLElement;
  rest: HTMLElement;
  n: number;
  shown: number;
  next: number;
};

type Active = {
  job: BlockJob;
  phase: Phase;
  t0: number;
  dur: number;
  rect: Rect;
  frame: Frame;
  typing: Typing | null;
};

type Tween = { ax: number; ay: number; bx: number; by: number; t0: number; dur: number; bow: number };

type Agent = {
  name: AgentName;
  color: LaneColor;
  el: HTMLElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  orbit: number;
  queue: BlockJob[];
  active: Active | null;
  tween: Tween | null;
  follow: { x: number; y: number } | null;
  exiting: { x: number; y: number } | null;
  visible: boolean;
  releasedAt: number;
};

type Stretch = { el: HTMLElement; w: number; v: number; to: number };

const EASE_IO = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const rand = (a: number, b: number) => a + Math.random() * (b - a);

const LANE_VAR: Record<LaneColor, string> = {
  blue: "var(--lane-blue)",
  amber: "var(--lane-amber)",
  green: "var(--lane-green)",
};

const SKIP_KEY = "build:skip";

declare global {
  interface Window {
    __buildReady?: boolean;
    __buildTimer?: number;
    __buildTimedOut?: boolean;
  }
}

function timeStamp(): string {
  const d = new Date();
  return [d.getHours(), d.getMinutes(), d.getSeconds()].map((n) => String(n).padStart(2, "0")).join(":");
}

function consumeSkipFlag(): boolean {
  try {
    const v = sessionStorage.getItem(SKIP_KEY);
    sessionStorage.removeItem(SKIP_KEY);
    return v === "1";
  } catch {
    return false;
  }
}

export function requestCompleteOnNextLoad(): void {
  try {
    sessionStorage.setItem(SKIP_KEY, "1");
  } catch {
    /* プライベートモードなど。演出が再生されるだけなので無視 */
  }
}

export function createEngine(opts: EngineOptions): Engine {
  const { page, layer } = opts;
  const html = document.documentElement;
  const life = new AbortController();
  let run = new AbortController();

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- DOM 参照 -----------------------------------------------------------
  const frames: Frame[] = [...layer.querySelectorAll<HTMLElement>("[data-frame]")].map((el) => {
    const q = (p: string) => el.querySelector<HTMLElement>(`[data-part="${p}"]`)!;
    const inner = (p: string) => q(p).firstElementChild as HTMLElement;
    return {
      el,
      tint: q("tint"),
      eT: q("eT"),
      eTi: inner("eT"),
      eB: q("eB"),
      eBi: inner("eB"),
      eL: q("eL"),
      eLi: inner("eL"),
      eR: q("eR"),
      eRi: inner("eR"),
      dims: q("dims"),
      tip: q("tip"),
      busy: false,
    };
  });

  const agents: Agent[] = AGENTS.map((def, i) => ({
    name: def.name,
    color: def.color,
    el: layer.querySelector<HTMLElement>(`[data-cursor="${def.name}"]`)!,
    x: -80,
    y: -80,
    vx: 0,
    vy: 0,
    orbit: (i / AGENTS.length) * Math.PI * 2,
    queue: [],
    active: null,
    tween: null,
    follow: null,
    exiting: null,
    visible: false,
    releasedAt: 0,
  }));
  const byName = new Map(agents.map((a) => [a.name, a]));

  let sections: SectionPlan[] = [];
  let jobs: BlockJob[] = [];
  let status: EngineStatus = "off";
  let mode: "auto" | "viewport" = "auto";
  const visibleSections = new Set<string>();
  const scroller = new AutoScroller();
  const stretches: Stretch[] = [];
  let rebuildTimeline: { t0: number; order: HTMLElement[]; step: number; hold: number } | null = null;
  let logId = 0;
  let rafId = 0;
  let last = 0;
  let lastTick = 0;
  let requestedAt = 0;
  let rectsDirty = false;
  let doneCount = 0;

  const setStatus = (s: EngineStatus) => {
    status = s;
    opts.onStatus(s);
  };

  const log = (agent: Agent, text: string) => {
    opts.onLog({ id: logId++, time: timeStamp(), agent: agent.name, color: agent.color, text });
  };

  // ---- 座標 ---------------------------------------------------------------
  let pageRect = page.getBoundingClientRect();
  const measure = (el: HTMLElement): Rect => {
    const r = el.getBoundingClientRect();
    return { x: r.left - pageRect.left, y: r.top - pageRect.top, w: r.width, h: r.height };
  };
  const viewport = () => {
    const top = -pageRect.top;
    return { top, bottom: top + window.innerHeight, width: page.clientWidth };
  };

  // ---- ブロックの状態 ----------------------------------------------------------
  const blocks = () => [...page.querySelectorAll<HTMLElement>("[data-block]")];

  const setState = (el: HTMLElement, state: "empty" | "mark" | "rough" | "type" | "done") => {
    el.dataset.state = state;
  };

  const clearTyping = (el: HTMLElement) => {
    el.querySelectorAll<HTMLElement>("[data-over]").forEach((o) => o.replaceChildren());
  };

  const stretchTargets = () => [...page.querySelectorAll<HTMLElement>("[data-stretch]")];
  const finalWidth = (el: HTMLElement) => {
    const v = parseFloat(getComputedStyle(el).getPropertyValue("--wdth-final"));
    return Number.isFinite(v) ? v : 125;
  };

  // ---- フレーム（マーキー・アウトライン・ツールチップ） ----------------------------------
  const takeFrame = (): Frame => {
    const f = frames.find((fr) => !fr.busy) ?? frames[0]!;
    f.busy = true;
    return f;
  };
  const releaseFrame = (f: Frame) => {
    f.busy = false;
    f.el.dataset.phase = "off";
  };
  const placeFrame = (f: Frame, r: Rect) => {
    f.el.style.transform = `translate3d(${r.x}px, ${r.y}px, 0)`;
    f.el.style.width = `${r.w}px`;
    f.el.style.height = `${r.h}px`;
  };
  const drawMarquee = (f: Frame, r: Rect, p: number) => {
    const w = r.w * p;
    const h = r.h * p;
    f.tint.style.transform = `scale(${p}, ${p})`;
    f.eTi.style.transform = `translateX(${w - r.w}px)`;
    f.eBi.style.transform = `translateX(${w - r.w}px)`;
    f.eB.style.transform = `translateY(${Math.max(0, h - 1)}px)`;
    f.eLi.style.transform = `translateY(${h - r.h}px)`;
    f.eRi.style.transform = `translateY(${h - r.h}px)`;
    f.eR.style.transform = `translateX(${Math.max(0, w - 1)}px)`;
    f.dims.style.transform = `translate3d(${w + 8}px, ${h + 8}px, 0)`;
    f.dims.textContent = `${Math.round(w)} x ${Math.round(h)}`;
  };

  // ---- カーソル -------------------------------------------------------------
  const tweenTo = (a: Agent, x: number, y: number, now: number, dur?: number) => {
    const d = Math.hypot(x - a.x, y - a.y);
    a.tween = {
      ax: a.x,
      ay: a.y,
      bx: x,
      by: y,
      t0: now,
      dur: dur ?? clamp(d * 0.55, 260, 950),
      bow: d * rand(0.06, 0.14) * (Math.random() < 0.5 ? -1 : 1),
    };
    a.follow = null;
  };

  const showAgent = (a: Agent, on: boolean) => {
    if (a.visible === on) return;
    a.visible = on;
    a.el.style.opacity = on ? "1" : "0";
  };

  const flockCenter = (): { x: number; y: number } | null => {
    const vp = viewport();
    let target: SectionPlan | undefined;
    if (mode === "auto") {
      target = [...sections].reverse().find((s) => s.started && !s.done);
    } else {
      target = sections.find((s) => visibleSections.has(s.id) && !s.done);
    }
    const r = target ? measure(target.el) : { x: 0, y: vp.top, w: vp.width, h: window.innerHeight };
    const cy = clamp(r.y + Math.min(r.h, window.innerHeight) / 2, vp.top + 120, vp.bottom - 120);
    return { x: vp.width * 0.58, y: cy };
  };

  // ---- ジョブ ---------------------------------------------------------------
  const startJob = (a: Agent, job: BlockJob, now: number) => {
    job.status = "active";
    a.queue = a.queue.filter((j) => j !== job);
    const rect = measure(job.el);
    const frame = takeFrame();
    frame.el.style.setProperty("--agent", LANE_VAR[a.color]);
    a.active = { job, phase: "travel", t0: now, dur: 0, rect, frame, typing: null };
    showAgent(a, true);
    tweenTo(a, rect.x, rect.y, now);
    a.active.dur = a.tween!.dur;
  };

  const blockInView = (r: Rect) => {
    const vp = viewport();
    return r.y < vp.bottom - 24 && r.y + Math.min(r.h, 80) > vp.top + 24;
  };

  const enterPhase = (a: Agent, act: Active, phase: Phase, now: number) => {
    act.phase = phase;
    act.t0 = now;
    const { job, rect, frame } = act;
    switch (phase) {
      case "wait":
        act.dur = 1500;
        a.follow = { x: rect.x, y: rect.y };
        break;
      case "mark": {
        act.rect = measure(job.el);
        setState(job.el, "mark");
        placeFrame(frame, act.rect);
        drawMarquee(frame, act.rect, 0);
        frame.el.dataset.phase = "mark";
        frame.el.dataset.tip = act.rect.y < 48 ? "below" : "above";
        act.dur = clamp(260 + (act.rect.w + act.rect.h) * 0.2, 380, 760);
        a.tween = null;
        a.follow = null;
        break;
      }
      case "rough": {
        setState(job.el, "rough");
        frame.tip.textContent = job.jsx;
        frame.el.dataset.phase = "rough";
        act.dur = job.kind === "headline" ? rand(260, 380) : rand(480, 780);
        const r = act.rect;
        tweenTo(a, r.x + Math.min(r.w * 0.42, 220), r.y + Math.min(r.h * 0.55, 56), now, 320);
        break;
      }
      case "type": {
        setState(job.el, "type");
        frame.el.dataset.phase = "type";
        const root = job.el.querySelector<HTMLElement>("[data-typed]");
        const full = root?.querySelector<HTMLElement>("[data-full]");
        const over = root?.querySelector<HTMLElement>("[data-over]");
        if (!root || !full || !over) {
          finishJob(a, act, now);
          return;
        }
        root.style.setProperty("--caret", LANE_VAR[a.color]);
        const typed = document.createElement("span");
        const caret = document.createElement("span");
        caret.setAttribute("data-caret", "");
        const rest = document.createElement("span");
        rest.setAttribute("data-rest", "");
        const text = full.textContent ?? "";
        rest.textContent = text;
        over.replaceChildren(typed, caret, rest);
        act.typing = { root, text, typed, caret, rest, n: 0, shown: 0, next: now + 120 };
        a.tween = null;
        break;
      }
      case "travel":
        break;
    }
  };

  const finishJob = (a: Agent, act: Active, now: number) => {
    const { job } = act;
    job.status = "done";
    clearTyping(job.el);
    setState(job.el, "done");
    releaseFrame(act.frame);
    a.active = null;
    a.tween = null;
    a.follow = null;
    a.releasedAt = now;
    doneCount++;

    const stretchEl = job.el.querySelector<HTMLElement>("[data-stretch]");
    if (stretchEl) stretches.push({ el: stretchEl, w: 100, v: 0, to: finalWidth(stretchEl) });

    buildBus.blockDone({ agent: a.name, color: a.color, section: job.section.id, jsx: job.jsx });
    log(a, `built ${job.jsx}`);
    buildBus.progress(jobs.length ? doneCount / jobs.length : 1);

    const sec = job.section;
    if (!sec.done && sec.jobs.every((j) => j.status === "done")) {
      sec.done = true;
      buildBus.sectionDone(sec.id);
      log(a, `merged ${sec.id} into main`);
    }
  };

  const stepJob = (a: Agent, act: Active, now: number) => {
    const t = act.dur > 0 ? clamp((now - act.t0) / act.dur, 0, 1) : 1;
    switch (act.phase) {
      case "travel":
        if (t >= 1) {
          if (rectsDirty) act.rect = measure(act.job.el);
          if (act.rect.w < 2 || act.rect.h < 2) finishJob(a, act, now);
          else if (mode === "auto" && !blockInView(act.rect)) enterPhase(a, act, "wait", now);
          else enterPhase(a, act, "mark", now);
        }
        break;
      case "wait":
        if (blockInView(act.rect) || t >= 1) enterPhase(a, act, "mark", now);
        break;
      case "mark": {
        const p = EASE_IO(t);
        drawMarquee(act.frame, act.rect, p);
        a.x = act.rect.x + act.rect.w * p;
        a.y = act.rect.y + act.rect.h * p;
        a.vx = a.vy = 0;
        if (t >= 1) enterPhase(a, act, "rough", now);
        break;
      }
      case "rough":
        if (t >= 1) {
          if (act.job.kind === "headline") enterPhase(a, act, "type", now);
          else finishJob(a, act, now);
        }
        break;
      case "type": {
        const ty = act.typing!;
        while (now >= ty.next && ty.n < ty.text.length) {
          ty.n++;
          const ch = ty.text[ty.n - 1] ?? "";
          ty.next += /\s/.test(ch) ? rand(20, 50) : rand(38, 82);
        }
        if (ty.shown !== ty.n) {
          ty.shown = ty.n;
          ty.typed.textContent = ty.text.slice(0, ty.n);
          ty.rest.textContent = ty.text.slice(ty.n);
        }
        const cr = measure(ty.caret);
        a.follow = { x: cr.x + 3, y: cr.y + cr.h * 0.82 };
        if (ty.n >= ty.text.length && now >= ty.next + 140) finishJob(a, act, now);
        break;
      }
    }
  };

  // ---- スケジューリング -----------------------------------------------------------
  const loadMap = () => new Map(agents.map((a) => [a.name, a.queue.length + (a.active ? 1 : 0)]));

  const startSection = (sec: SectionPlan) => {
    assignSection(sec, loadMap());
    for (const job of sec.jobs) {
      if (job.status === "queued" && job.agent) byName.get(job.agent)!.queue.push(job);
    }
  };

  const allowed = (sec: SectionPlan) => (mode === "auto" ? sec.started : visibleSections.has(sec.id));

  const schedule = () => {
    if (mode === "auto") {
      const open = sections.filter((s) => s.started && !s.done);
      const next = sections.find((s) => !s.started);
      const prev = open[open.length - 1];
      const prevDispatched = !prev || prev.jobs.every((j) => j.status !== "queued");
      if (next && open.length < 2 && prevDispatched) startSection(next);
    } else {
      for (const s of sections) if (!s.started && visibleSections.has(s.id)) startSection(s);
    }
  };

  const dispatch = (now: number) => {
    for (const a of agents) {
      if (a.active || a.exiting) continue;
      if (now - a.releasedAt < 90) continue;
      const job = a.queue.find((j) => j.status === "queued" && allowed(j.section));
      if (job) startJob(a, job, now);
    }
  };

  // ---- 1 フレーム ------------------------------------------------------------
  const moveAgents = (now: number, dt: number) => {
    const vp = viewport();
    const center = status === "playing" ? flockCenter() : null;
    const rx = Math.min(300, vp.width * 0.32);
    const ry = Math.min(170, window.innerHeight * 0.24);
    const time = now / 1000;

    for (const a of agents) {
      if (a.exiting) {
        const k = 1 - Math.exp(-dt * 3.2);
        a.x += (a.exiting.x - a.x) * k;
        a.y += (a.exiting.y - a.y) * k;
        if (Math.hypot(a.exiting.x - a.x, a.exiting.y - a.y) < 12) {
          a.exiting = null;
          showAgent(a, false);
        }
      } else if (a.tween) {
        const tw = a.tween;
        const t = clamp((now - tw.t0) / tw.dur, 0, 1);
        const e = EASE_IO(t);
        const dx = tw.bx - tw.ax;
        const dy = tw.by - tw.ay;
        const d = Math.hypot(dx, dy) || 1;
        const bow = Math.sin(Math.PI * e) * tw.bow;
        a.x = tw.ax + dx * e + (-dy / d) * bow;
        a.y = tw.ay + dy * e + (dx / d) * bow;
        a.vx = a.vy = 0;
        if (t >= 1) {
          a.tween = null;
          if (a.active?.phase === "rough") a.follow = { x: a.x, y: a.y };
        }
      } else if (a.follow) {
        const k = 1 - Math.exp(-dt * 16);
        let fx = a.follow.x;
        let fy = a.follow.y;
        if (a.active?.phase === "rough" || a.active?.phase === "wait") {
          fx += Math.sin(time * 7 + a.orbit) * 3;
          fy += Math.cos(time * 5.3 + a.orbit) * 2;
        }
        a.x += (fx - a.x) * k;
        a.y += (fy - a.y) * k;
      } else if (!a.active && center) {
        // 待機中: アクティブなセクションのまわりをゆるい群れで漂う
        const ang = a.orbit + time * 0.22;
        const tx = clamp(center.x + Math.cos(ang) * rx + Math.sin(time * 0.7 + a.orbit * 3) * 24, 16, vp.width - 60);
        const ty = clamp(center.y + Math.sin(ang * 1.3) * ry, vp.top + 40, vp.bottom - 40);
        let ax = (tx - a.x) * 5 - a.vx * 3.6;
        let ay = (ty - a.y) * 5 - a.vy * 3.6;
        for (const b of agents) {
          if (b === a || !b.visible) continue;
          const ddx = a.x - b.x;
          const ddy = a.y - b.y;
          const dd = ddx * ddx + ddy * ddy;
          if (dd > 0 && dd < 4900) {
            const f = (4900 - dd) / 4900;
            ax += (ddx / Math.sqrt(dd)) * f * 900;
            ay += (ddy / Math.sqrt(dd)) * f * 900;
          }
        }
        a.vx += ax * dt;
        a.vy += ay * dt;
        a.x += a.vx * dt;
        a.y += a.vy * dt;
        showAgent(a, true);
      }
      if (a.visible || a.exiting) a.el.style.transform = `translate3d(${a.x.toFixed(1)}px, ${a.y.toFixed(1)}px, 0)`;
    }
  };

  const stepStretch = (dt: number) => {
    for (let i = stretches.length - 1; i >= 0; i--) {
      const s = stretches[i]!;
      const acc = (s.to - s.w) * 170 - s.v * 11;
      s.v += acc * dt;
      s.w += s.v * dt;
      if (Math.abs(s.v) < 0.02 && Math.abs(s.to - s.w) < 0.05) {
        s.w = s.to;
        stretches.splice(i, 1);
        s.el.style.removeProperty("--wdth");
      } else {
        s.el.style.setProperty("--wdth", s.w.toFixed(2));
      }
    }
  };

  const stepRebuild = (now: number) => {
    const tl = rebuildTimeline;
    if (!tl) return;
    const elapsed = now - tl.t0;
    tl.order.forEach((el, i) => {
      const at = i * tl.step;
      if (elapsed >= at + tl.hold) {
        if (el.dataset.state !== "empty") setState(el, "empty");
      } else if (elapsed >= at && el.dataset.state !== "rough") {
        clearTyping(el);
        setState(el, "rough");
      }
    });
    const end = (tl.order.length - 1) * tl.step + tl.hold + 120;
    if (elapsed >= end && window.scrollY < 4) {
      rebuildTimeline = null;
      scroller.stop();
      play(now);
    }
  };

  const updateScroll = (dt: number) => {
    if (status === "playing" && mode === "auto") {
      const offset = pageRect.top + window.scrollY;
      const spans: Span[] = [];
      for (const a of agents) {
        const act = a.active;
        if (!act) continue;
        spans.push({ top: act.rect.y + offset, bottom: act.rect.y + Math.min(act.rect.h, window.innerHeight * 0.8) + offset });
      }
      if (spans.length) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        scroller.setTarget(keepInViewTarget(spans, window.scrollY, window.innerHeight, max));
      }
    }
    if (scroller.step(dt)) pageRect = page.getBoundingClientRect();
  };

  const busy = () =>
    status === "playing" ||
    rebuildTimeline !== null ||
    stretches.length > 0 ||
    scroller.moving() ||
    agents.some((a) => a.exiting);

  const frame = (now: number) => {
    rafId = 0;
    lastTick = performance.now();
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    pageRect = page.getBoundingClientRect();

    if (status === "playing") {
      schedule();
      dispatch(now);
      for (const a of agents) if (a.active) stepJob(a, a.active, now);
      rectsDirty = false;
      if (jobs.every((j) => j.status === "done")) complete(false);
    }
    stepRebuild(now);
    moveAgents(now, dt);
    stepStretch(dt);
    updateScroll(dt);

    if (busy()) request();
    else {
      last = 0;
      scroller.stop();
    }
  };

  const request = () => {
    rafId = requestAnimationFrame(frame);
    requestedAt = performance.now();
  };

  const wake = () => {
    if (life.signal.aborted) return;
    if (rafId && performance.now() - Math.max(lastTick, requestedAt) > 400) {
      // 予約したフレームが届かないまま止まっていたら、取り直す
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    if (!rafId) request();
  };

  // ---- 再生・完了・リセット ------------------------------------------------------
  const exitAgents = () => {
    const vp = viewport();
    for (const a of agents) {
      if (!a.visible) continue;
      a.tween = null;
      a.follow = null;
      a.active = null;
      const side = a.x < vp.width / 2 ? -90 : vp.width + 90;
      a.exiting = { x: side, y: a.y + rand(-80, 80) };
    }
  };

  const cancelRun = () => {
    run.abort();
    run = new AbortController();
    for (const a of agents) {
      if (a.active) {
        releaseFrame(a.active.frame);
        clearTyping(a.active.job.el);
      }
      a.active = null;
      a.queue = [];
      a.tween = null;
      a.follow = null;
    }
    frames.forEach(releaseFrame);
    visibleSections.clear();
    scroller.stop();
    rebuildTimeline = null;
  };

  const complete = (fromSkip: boolean) => {
    const anyAgent = agents[0]!;
    let finished = 0;
    for (const job of jobs) {
      if (job.status === "done") continue;
      finished++;
      job.status = "done";
      clearTyping(job.el);
      setState(job.el, "done");
      const agent = byName.get(job.agent ?? "merge") ?? anyAgent;
      buildBus.blockDone({ agent: agent.name, color: agent.color, section: job.section.id, jsx: job.jsx });
    }
    for (const s of sections) {
      s.done = true;
      buildBus.sectionDone(s.id);
    }
    doneCount = jobs.length;
    buildBus.progress(1);
    stretchTargets().forEach((el) => el.style.removeProperty("--wdth"));
    stretches.length = 0;
    if (fromSkip) {
      cancelRun();
      log(byName.get("merge")!, finished ? `skip: finished ${finished} blocks` : "skip: nothing left");
    } else {
      run.abort();
      run = new AbortController();
      scroller.stop();
      log(byName.get("tag")!, "HEAD -> main  build complete");
    }
    html.dataset.build = "done";
    setStatus("complete");
    exitAgents();
    wake();
  };

  /** 演出なしで完成状態にする（reduced-motion・言語切り替え直後・JS の読み込みが遅れたとき） */
  const completeSilently = () => {
    sections = collectSections(page);
    jobs = sections.flatMap((s) => s.jobs);
    for (const job of jobs) {
      job.status = "done";
      setState(job.el, "done");
      const agent = byName.get(job.hard ?? job.prefer ?? "merge")!;
      buildBus.blockDone({ agent: agent.name, color: agent.color, section: job.section.id, jsx: job.jsx });
    }
    for (const s of sections) {
      s.done = true;
      buildBus.sectionDone(s.id);
    }
    doneCount = jobs.length;
    buildBus.progress(1);
  };

  const observeSections = () => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = (e.target as HTMLElement).dataset.section ?? "";
          if (e.isIntersecting) visibleSections.add(id);
          else visibleSections.delete(id);
        }
        wake();
      },
      { threshold: 0 },
    );
    sections.forEach((s) => io.observe(s.el));
    run.signal.addEventListener("abort", () => io.disconnect(), { once: true });
  };

  const handOver = () => {
    if (mode === "viewport" || status !== "playing") return;
    mode = "viewport";
    scroller.stop();
    log(byName.get("fetch")!, "hand-over: building sections on screen");
    wake();
  };

  const play = (now = performance.now()) => {
    cancelRun();
    buildBus.reset();
    html.dataset.build = "on";
    sections = collectSections(page);
    jobs = sections.flatMap((s) => s.jobs);
    doneCount = 0;
    for (const job of jobs) {
      clearTyping(job.el);
      setState(job.el, "empty");
    }
    for (const el of stretchTargets()) el.style.setProperty("--wdth", "100");
    stretches.length = 0;

    // 深い位置から開いたときは、画面内のセクションだけを組み立てる
    mode = !opts.play && window.scrollY > window.innerHeight * 0.5 ? "viewport" : "auto";
    observeSections();
    if (!opts.play) watchDeliberateScroll(run.signal, handOver);

    // カーソルを画面の外から入れる
    const vp = viewport();
    agents.forEach((a, i) => {
      a.exiting = null;
      if (a.visible) return;
      const side = i % 3;
      a.x = side === 0 ? -60 : side === 1 ? vp.width + 60 : rand(0.1, 0.9) * vp.width;
      a.y = side === 2 ? vp.bottom + 60 : vp.top + rand(0.15, 0.85) * window.innerHeight;
      a.vx = a.vy = 0;
      a.exiting = null;
      a.releasedAt = now + i * 70;
    });
    setStatus("playing");
    wake();
  };

  // ---- 公開 API -------------------------------------------------------------
  const skip = () => {
    if (status === "off" || status === "complete") return;
    if (status === "rebuilding") {
      rebuildTimeline = null;
      sections = collectSections(page);
      jobs = sections.flatMap((s) => s.jobs);
    }
    complete(true);
  };

  const rebuild = () => {
    if (status === "off") return;
    cancelRun();
    buildBus.reset();
    html.dataset.build = "on";
    setStatus("rebuilding");
    // 下から順に: スケルトン → 空
    const order = blocks()
      .map((el) => ({ el, top: el.getBoundingClientRect().top }))
      .sort((a, b) => b.top - a.top)
      .map((b) => b.el);
    const step = clamp(1100 / Math.max(1, order.length), 12, 34);
    rebuildTimeline = { t0: performance.now(), order, step, hold: 240 };
    for (const el of stretchTargets()) el.style.setProperty("--wdth", "100");
    scroller.setTarget(0);
    exitAgents();
    log(byName.get("reflog")!, "reset --hard: rebuilding from the top");
    wake();
  };

  const destroy = () => {
    cancelRun();
    life.abort();
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    stretches.length = 0;
    agents.forEach((a) => showAgent(a, false));
    // 途中で破棄されても、ページは完成状態で読めるようにする
    blocks().forEach((el) => {
      clearTyping(el);
      if (el.dataset.state !== "done") setState(el, "done");
    });
    stretchTargets().forEach((el) => el.style.removeProperty("--wdth"));
    html.dataset.build = "off";
  };

  // ---- 起動 ---------------------------------------------------------------
  // 見張り: 再生中にフレームが 0.4 秒以上届かなければループを起こし直す（タブ非表示中は何もしない）
  const watchdog = window.setInterval(() => {
    if (document.visibilityState === "visible" && busy()) wake();
  }, 500);
  life.signal.addEventListener("abort", () => window.clearInterval(watchdog), { once: true });

  window.__buildReady = true;
  if (window.__buildTimer) window.clearTimeout(window.__buildTimer);

  window.addEventListener(
    "resize",
    () => {
      rectsDirty = true;
      pageRect = page.getBoundingClientRect();
      for (const a of agents) {
        if (a.active && a.active.phase !== "travel") {
          a.active.rect = measure(a.active.job.el);
          placeFrame(a.active.frame, a.active.rect);
          if (a.active.phase !== "mark") drawMarquee(a.active.frame, a.active.rect, 1);
        }
      }
    },
    { signal: life.signal, passive: true },
  );

  const skipFlag = consumeSkipFlag();
  if (reduced) {
    completeSilently();
    setStatus("off");
  } else if (skipFlag || window.__buildTimedOut) {
    completeSilently();
    html.dataset.build = "off";
    setStatus("complete");
  } else {
    play();
  }

  return { skip, rebuild, destroy };
}
