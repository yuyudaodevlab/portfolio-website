"use client";

import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { finishIntro, INTRO_SEEN_KEY } from "./state";
import styles from "./Intro.module.css";

const NAME = "yuyudaodevlab";

/** SVG の属性に直接書く色（CSS 側は Intro.module.css の変数） */
const C = {
  gray: "#E4E2E6",
  peri: "#7A98CF",
  mid: "#3E67AE",
  navy: "#0E2F5E",
  yellow: "#F4B820",
  coral: "#F27E5E",
  pink: "#F7C6C6",
  black: "#150B10",
  light: "#D3E0F0",
  cyan: "#7EC3D8",
  white: "#FAFAFA",
} as const;

type Enter = "cut" | "circle" | "wipe" | "wipeUp" | "diamond";
type SceneId =
  | "loader"
  | "burst"
  | "grid"
  | "beam"
  | "split"
  | "rings"
  | "wink"
  | "cone"
  | "frame"
  | "donut"
  | "zoom"
  | "vortex"
  | "stripes"
  | "bounce"
  | "name";

/** at はページを開いてからのミリ秒。ローダーは読み込みが終わるまで延びることがあり、以降はそこからの相対で進む */
const SCENES: { id: SceneId; at: number; enter: Enter }[] = [
  { id: "loader", at: 0, enter: "cut" },
  { id: "burst", at: 3500, enter: "cut" },
  { id: "grid", at: 4000, enter: "wipe" },
  { id: "beam", at: 4600, enter: "circle" },
  { id: "split", at: 5200, enter: "diamond" },
  { id: "rings", at: 5850, enter: "wipeUp" },
  { id: "wink", at: 6500, enter: "circle" },
  { id: "cone", at: 8000, enter: "wipe" },
  { id: "frame", at: 8500, enter: "diamond" },
  { id: "donut", at: 9000, enter: "circle" },
  { id: "zoom", at: 9500, enter: "cut" },
  { id: "vortex", at: 10000, enter: "circle" },
  { id: "stripes", at: 10750, enter: "wipe" },
  { id: "bounce", at: 11500, enter: "diamond" },
  { id: "name", at: 12500, enter: "cut" },
];
const LOADER_END = 3500;
const END = 14700;
const EXIT_MS = 750;
/** 読み込みが遅いとき、ローダーを延ばす上限 */
const LOADER_MAX_EXTRA = 4000;

// ---- 小物 -------------------------------------------------------------------

/** ウインク顔: 白い円に「×」（水色）と縦長の楕円（青）の目 */
function FaceShape({ x = 0, y = 0, r = 48 }: { x?: number; y?: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${r / 48})`}>
      <circle r="48" fill={C.white} />
      <path d="M-27 -11 L-13 3 M-13 -11 L-27 3" stroke={C.cyan} strokeWidth="6.5" strokeLinecap="round" fill="none" />
      <ellipse cx="19" cy="-4" rx="5.5" ry="10.5" fill={C.mid} />
    </g>
  );
}

function Face({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="-50 -50 100 100">
      <FaceShape />
    </svg>
  );
}

/** 毎回同じ値になる疑似乱数（パーティクルの配置用） */
function rnd(i: number, k: number): number {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const PARTICLE_COLORS = [C.peri, C.yellow, C.coral, C.cyan, C.mid, C.pink, C.navy];
const PARTICLES = Array.from({ length: 18 }, (_, i) => {
  const angle = (i / 18) * Math.PI * 2 + rnd(i, 1) * 0.5;
  const radius = 24 + rnd(i, 2) * 22; // vmin
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
    size: 0.9 + rnd(i, 3) * 3.4,
    color: PARTICLE_COLORS[i % PARTICLE_COLORS.length]!,
    ring: i % 5 === 2,
    dx: (rnd(i, 4) - 0.5) * 10,
    dy: (rnd(i, 5) - 0.5) * 10,
    delay: Math.round(rnd(i, 6) * 220),
  };
});

/** 豆形（黄色） */
const BEAN = "M34 6 C58 -2 82 14 76 40 C71 62 52 56 41 70 C29 86 -1 80 2 50 C4 27 14 13 34 6Z";

const BLOBS: { x: number; y: number; w: number; c: string; r: string; fx: number; fy: number; d: number }[] = [
  { x: -14, y: -16, w: 56, c: C.mid, r: "62% 38% 55% 45% / 48% 60% 40% 52%", fx: -40, fy: -40, d: 0 },
  { x: 66, y: -22, w: 50, c: C.peri, r: "45% 55% 38% 62% / 58% 42% 58% 42%", fx: 40, fy: -40, d: 30 },
  { x: -18, y: 62, w: 52, c: C.navy, r: "55% 45% 62% 38% / 40% 56% 44% 60%", fx: -40, fy: 40, d: 50 },
  { x: 70, y: 58, w: 54, c: C.light, r: "38% 62% 45% 55% / 55% 40% 60% 45%", fx: 40, fy: 40, d: 20 },
  { x: -10, y: 30, w: 24, c: C.peri, r: "50% 50% 40% 60% / 60% 45% 55% 40%", fx: -50, fy: 0, d: 70 },
  { x: 84, y: 26, w: 22, c: C.mid, r: "60% 40% 52% 48% / 44% 58% 42% 56%", fx: 50, fy: 0, d: 90 },
];

// ---- シーン ---------------------------------------------------------------

function Scene({ id }: { id: SceneId }) {
  switch (id) {
    case "loader":
      return (
        <div className={styles.loader}>
          <div className={styles.crescentWrap}>
            <div className={styles.crescent}>
              <i />
              <i />
            </div>
          </div>
          <p className={styles.loading}>
            Now Loading<span>.</span>
            <span>.</span>
            <span>.</span>
          </p>
        </div>
      );

    case "burst":
      return (
        <div className={styles.burst}>
          {BLOBS.map((b, i) => (
            <i
              key={i}
              className={styles.blob}
              style={
                {
                  left: `${b.x}%`,
                  top: `${b.y}%`,
                  width: `${b.w}vmax`,
                  background: b.c,
                  borderRadius: b.r,
                  "--fx": `${b.fx}vmax`,
                  "--fy": `${b.fy}vmax`,
                  animationDelay: `${b.d}ms`,
                } as CSSProperties
              }
            />
          ))}
          <svg className={`${styles.bean} ${styles.beanA}`} viewBox="0 0 80 80">
            <path d={BEAN} fill={C.yellow} />
          </svg>
          <svg className={`${styles.bean} ${styles.beanB}`} viewBox="0 0 80 80">
            <path d={BEAN} fill={C.yellow} />
          </svg>
          <p className={styles.smallName}>{NAME}</p>
        </div>
      );

    case "grid":
      return (
        <div className={styles.grid}>
          <i className={styles.pill} data-from="top" style={{ left: "22%", animationDelay: "0ms" }} />
          <i className={styles.pill} data-from="bottom" style={{ left: "46%", animationDelay: "60ms" }} />
          <i className={styles.pill} data-from="top" style={{ left: "70%", animationDelay: "110ms" }} data-size="s" />
          <i className={styles.pill} data-from="bottom" style={{ left: "84%", animationDelay: "30ms" }} data-size="s" />
        </div>
      );

    case "beam":
      return (
        <svg className={styles.full} viewBox="-100 -100 200 200" preserveAspectRatio="xMidYMid slice">
          <rect x="-200" y="-200" width="400" height="400" fill={C.peri} />
          <g className={styles.beams}>
            <polygon points="0,0 -40,-160 40,-160" fill={C.white} opacity="0.55" />
            <polygon points="0,0 -40,160 40,160" fill={C.white} opacity="0.55" />
            <polygon points="0,0 160,-30 160,30" fill={C.white} opacity="0.3" />
            <polygon points="0,0 -160,-30 -160,30" fill={C.white} opacity="0.3" />
          </g>
          <circle className={styles.sideL} cx="-60" cy="0" r="17" fill={C.navy} />
          <circle className={styles.sideR} cx="60" cy="0" r="17" fill={C.mid} />
          <circle className={styles.pop} cx="0" cy="0" r="36" fill={C.gray} />
        </svg>
      );

    case "split":
      return (
        <svg className={styles.full} viewBox="-100 -100 200 200" preserveAspectRatio="xMidYMid slice">
          <defs>
            <clipPath id="intro-split">
              <circle r="25" />
            </clipPath>
          </defs>
          <rect x="-200" y="-200" width="400" height="400" fill={C.light} />
          <circle className={styles.pop} r="40" fill="none" stroke={C.yellow} strokeWidth="11" />
          <g clipPath="url(#intro-split)">
            <g className={styles.splitSpin}>
              <rect x="-30" y="-30" width="30" height="60" fill={C.coral} />
              <rect x="0" y="-30" width="30" height="60" fill={C.pink} />
            </g>
          </g>
        </svg>
      );

    case "rings":
      return (
        <svg className={styles.full} viewBox="-100 -100 200 200" preserveAspectRatio="xMidYMid slice">
          <rect x="-200" y="-200" width="400" height="400" fill={C.navy} />
          <circle className={styles.pop} r="44" fill="none" stroke={C.mid} strokeWidth="9" style={{ animationDelay: "0ms" }} />
          <circle className={styles.pop} r="32" fill="none" stroke={C.light} strokeWidth="7" style={{ animationDelay: "60ms" }} />
          <circle className={styles.pop} r="22" fill="none" stroke={C.gray} strokeWidth="5" style={{ animationDelay: "120ms" }} />
          <circle className={styles.pop} r="12" fill={C.peri} style={{ animationDelay: "180ms" }} />
        </svg>
      );

    case "wink":
      return (
        <div className={styles.wink}>
          <i className={styles.yellowBg} />
          <i className={`${styles.frame} ${styles.frameSquare}`} />
          <i className={`${styles.frame} ${styles.frameDiamond}`} />
          <i className={`${styles.frame} ${styles.frameRing}`} />
          {PARTICLES.map((p, i) => (
            <i
              key={i}
              className={styles.particle}
              data-ring={p.ring ? "" : undefined}
              style={
                {
                  left: `calc(50% + ${p.x.toFixed(2)}vmin)`,
                  top: `calc(50% + ${p.y.toFixed(2)}vmin)`,
                  width: `${p.size.toFixed(2)}vmin`,
                  "--c": p.color,
                  "--dx": `${p.dx.toFixed(2)}vmin`,
                  "--dy": `${p.dy.toFixed(2)}vmin`,
                  animationDelay: `${p.delay}ms, ${p.delay}ms`,
                } as CSSProperties
              }
            />
          ))}
          <Face className={styles.winkFace} />
        </div>
      );

    case "cone":
      return (
        <div className={styles.cone}>
          <svg className={styles.full} viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice">
            <g className={styles.coneGrow}>
              <polygon points="-6,50 92,22 92,78" fill={C.black} />
              <ellipse cx="92" cy="50" rx="9" ry="28" fill={C.black} />
            </g>
            <rect className={styles.lineDiamond} x="62" y="32" width="36" height="36" rx="3" fill="none" stroke={C.white} strokeWidth="0.6" />
            <rect className={styles.lineDiamond} x="70" y="40" width="20" height="20" rx="2" fill="none" stroke={C.white} strokeWidth="0.4" style={{ animationDelay: "80ms" }} />
          </svg>
        </div>
      );

    case "frame":
      return (
        <div className={styles.frameScene}>
          <i className={styles.whiteDiamond}>
            <b data-corner="t" />
            <b data-corner="r" />
            <b data-corner="b" />
            <b data-corner="l" />
          </i>
          <i className={styles.eyes}>
            <b />
            <b />
          </i>
        </div>
      );

    case "donut":
      return (
        <svg className={styles.full} viewBox="-100 -100 200 200" preserveAspectRatio="xMidYMid slice">
          <rect x="-200" y="-200" width="400" height="400" fill={C.gray} />
          <polyline className={styles.chevL} points="-84,-30 -56,0 -84,30" fill="none" stroke={C.navy} strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
          <polyline className={styles.chevR} points="84,-30 56,0 84,30" fill="none" stroke={C.navy} strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
          <circle className={styles.donut} r="20" fill="none" stroke="url(#intro-grad)" strokeWidth="12" />
          <g className={styles.orbit}>
            <FaceShape x={0} y={-38} r={7} />
            <FaceShape x={33} y={19} r={7} />
            <FaceShape x={-33} y={19} r={7} />
          </g>
        </svg>
      );

    case "zoom":
      return (
        <div className={styles.zoom}>
          <Face className={styles.zoomFace} />
        </div>
      );

    case "vortex":
      return (
        <svg className={styles.full} viewBox="-100 -100 200 200" preserveAspectRatio="xMidYMid slice">
          <rect x="-200" y="-200" width="400" height="400" fill={C.white} />
          <circle className={styles.spinCw} r="56" fill="none" stroke={C.coral} strokeWidth="14" strokeDasharray="26 8" />
          <circle className={styles.spinCcw} r="42" fill="none" stroke={C.yellow} strokeWidth="12" strokeDasharray="20 6" />
          <circle className={styles.pop} r="30" fill={C.black} />
          <circle className={styles.spinCw} r="22" fill="none" stroke={C.white} strokeWidth="2.4" strokeDasharray="6 5" />
          <g className={styles.pop} style={{ animationDelay: "90ms" }}>
            <FaceShape r={14} />
          </g>
        </svg>
      );

    case "stripes":
      return (
        <div className={styles.stripes}>
          <svg className={styles.full} viewBox="-100 -100 200 200" preserveAspectRatio="xMidYMid slice">
            <circle className={styles.pop} r="46" fill="none" stroke={C.light} strokeWidth="3" />
            <circle className={styles.pop} r="37" fill="none" stroke={C.navy} strokeWidth="5" style={{ animationDelay: "50ms" }} />
            <circle className={styles.pop} r="27" fill="url(#intro-grad)" style={{ animationDelay: "100ms" }} />
            <g className={styles.pop} style={{ animationDelay: "160ms" }}>
              <FaceShape r={15} />
            </g>
          </svg>
        </div>
      );

    case "bounce":
      return (
        <div className={styles.bounce}>
          <div className={styles.dots}>
            {[0, 1, 2, 3, 4].map((i) => (
              <i key={i} style={{ animationDelay: `${i * 50}ms` }} />
            ))}
          </div>
          <i className={styles.fillBlue} />
          <i className={styles.fillGray} />
        </div>
      );

    case "name":
      return (
        <div className={styles.nameScene}>
          <p className={styles.name}>{NAME}</p>
        </div>
      );
  }
}

// ---- 本体 -------------------------------------------------------------------

/**
 * 初回訪問時のオープニング（約 15 秒）。skip ボタン・Esc で飛ばせる。
 * 表示するかどうかは layout の BOOT スクリプトが <html data-intro> で決めるので、
 * サーバーでは常にローダーの状態で描いておき、CSS で出し分ける。
 */
export function Intro({ skipLabel, skipAria }: { skipLabel: string; skipAria: string }) {
  const [pair, setPair] = useState<[number, number | null]>([0, null]);
  const [phase, setPhase] = useState<"play" | "exit" | "done">("play");
  const exitRef = useRef<() => void>(() => {});

  const skip = useCallback(() => exitRef.current(), []);

  useEffect(() => {
    if (document.documentElement.dataset.intro !== "on") {
      finishIntro();
      setPhase("done");
      return;
    }
    try {
      sessionStorage.setItem(INTRO_SEEN_KEY, "1");
    } catch {
      /* 保存できなくても、次回もう一度流れるだけ */
    }

    const timers: number[] = [];
    let exiting = false;
    const exit = () => {
      if (exiting) return;
      exiting = true;
      timers.forEach(clearTimeout);
      setPhase("exit");
      timers.push(
        window.setTimeout(() => {
          finishIntro();
          setPhase("done");
        }, EXIT_MS),
      );
    };
    exitRef.current = exit;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") exit();
    };
    window.addEventListener("keydown", onKey);

    // 開発中だけ: ?introScene=<id> でそのシーンに止める（見た目の調整用。本番ビルドでは消える）
    if (process.env.NODE_ENV !== "production") {
      const hold = SCENES.findIndex((s) => s.id === new URLSearchParams(location.search).get("introScene"));
      if (hold >= 0) {
        setPair([hold, null]);
        return () => {
          timers.forEach(clearTimeout);
          window.removeEventListener("keydown", onKey);
        };
      }
    }

    // ローダーは最短 3.5 秒。読み込みが終わっていなければ、上限つきで待つ
    const startRest = () => {
      if (exiting) return;
      SCENES.forEach((s, i) => {
        if (i === 0) return;
        timers.push(window.setTimeout(() => setPair(([cur]) => [i, cur]), s.at - LOADER_END));
      });
      timers.push(window.setTimeout(exit, END - LOADER_END));
    };
    const loaded = () => document.readyState === "complete";
    const deadline = Math.max(performance.now(), LOADER_END);
    const hardDeadline = deadline + LOADER_MAX_EXTRA;
    const tick = () => {
      const now = performance.now();
      if (now >= deadline && (loaded() || now >= hardDeadline)) startRest();
      else timers.push(window.setTimeout(tick, 100));
    };
    timers.push(window.setTimeout(tick, Math.max(0, deadline - performance.now())));

    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  if (phase === "done") return null;

  const [cur, prev] = pair;
  const layers = prev === null ? [cur] : [prev, cur];

  return (
    <div className={styles.root} data-phase={phase}>
      <div className={styles.stage} aria-hidden="true">
        <svg className={styles.defs} width="0" height="0" focusable="false">
          <defs>
            <linearGradient id="intro-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#F08DA0" />
              <stop offset="0.5" stopColor="#9B7FD0" />
              <stop offset="1" stopColor="#2E66D6" />
            </linearGradient>
          </defs>
        </svg>
        {layers.map((i) => {
          const s = SCENES[i]!;
          return (
            <div key={s.id} className={styles.scene} data-scene={s.id} data-enter={i === cur && prev !== null ? s.enter : "cut"}>
              <Scene id={s.id} />
            </div>
          );
        })}
      </div>
      <button type="button" className={styles.skip} onClick={skip} aria-label={skipAria}>
        {skipLabel}
      </button>
    </div>
  );
}
