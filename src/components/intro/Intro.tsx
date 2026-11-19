"use client";

import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { finishIntro, INTRO_SEEN_KEY } from "./state";
import styles from "./Intro.module.css";

const NAME = "yuyudaodevlab";

/** SVG の属性に直接書く色（CSS 側は Intro.module.css の変数）。サイト本体の配色に合わせたダーク */
const C = {
  bg: "#0B0D10",
  raise: "#12151A",
  panel: "#171B22",
  line: "#1F242C",
  line2: "#2A313B",
  ink: "#E9E6DF",
  dim: "#8B919B",
  blue: "#4D8EFF",
  amber: "#F2A93B",
  green: "#3FCF8E",
  coral: "#F27E5E",
  violet: "#9B7FD0",
  pink: "#F08DA0",
} as const;

type Enter = "cut" | "circle" | "wipe" | "wipeUp" | "diamond";
type SceneId =
  | "loader"
  | "burst"
  | "minimap"
  | "graph"
  | "binary"
  | "gauge"
  | "brackets"
  | "terminal"
  | "tag"
  | "chevrons"
  | "zoom"
  | "disk"
  | "hexdump"
  | "typing"
  | "name";

/** at はページを開いてからのミリ秒。ローダーは読み込みが終わるまで延びることがあり、以降はそこからの相対で進む */
const SCENES: { id: SceneId; at: number; enter: Enter }[] = [
  { id: "loader", at: 0, enter: "cut" },
  { id: "burst", at: 3500, enter: "cut" },
  { id: "minimap", at: 4000, enter: "wipe" },
  { id: "graph", at: 4600, enter: "circle" },
  { id: "binary", at: 5200, enter: "diamond" },
  { id: "gauge", at: 5850, enter: "wipeUp" },
  { id: "brackets", at: 6500, enter: "circle" },
  { id: "terminal", at: 8000, enter: "wipe" },
  { id: "tag", at: 8500, enter: "diamond" },
  { id: "chevrons", at: 9000, enter: "circle" },
  { id: "zoom", at: 9500, enter: "cut" },
  { id: "disk", at: 10000, enter: "circle" },
  { id: "hexdump", at: 10750, enter: "wipe" },
  { id: "typing", at: 11500, enter: "diamond" },
  { id: "name", at: 12500, enter: "cut" },
];
const LOADER_END = 3500;
const END = 14700;
const EXIT_MS = 750;
/** 読み込みが遅いとき、ローダーを延ばす上限 */
const LOADER_MAX_EXTRA = 4000;

// ---- データ -------------------------------------------------------------------

/** 毎回同じ値になる疑似乱数（配置用。ローダー以外のシーンはクライアントでだけ描くので、サーバーとの差は出ない） */
function rnd(i: number, k: number): number {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** 画面の外から飛び込んでくる記号 */
const GLYPHS: { t: string; x: number; y: number; s: number; c: string; r: number; fx: number; fy: number }[] = [
  { t: "{", x: 6, y: 4, s: 34, c: C.blue, r: -12, fx: -40, fy: -40 },
  { t: "}", x: 76, y: 50, s: 36, c: C.green, r: 10, fx: 40, fy: 40 },
  { t: "</>", x: 58, y: 6, s: 15, c: C.amber, r: 6, fx: 40, fy: -40 },
  { t: "=>", x: 6, y: 68, s: 17, c: C.violet, r: -8, fx: -40, fy: 40 },
  { t: ";", x: 88, y: 18, s: 24, c: C.coral, r: 14, fx: 50, fy: 0 },
  { t: "()", x: -2, y: 40, s: 13, c: C.amber, r: -20, fx: -50, fy: 0 },
  { t: "[]", x: 40, y: 74, s: 15, c: C.blue, r: 8, fx: 0, fy: 50 },
  { t: "#", x: 36, y: 2, s: 13, c: C.green, r: -6, fx: 0, fy: -50 },
];

/** エディタのミニマップ風: インデント幅と、色付きのトークン */
const TOKEN_COLORS = [C.blue, C.green, C.amber, C.violet, C.dim, C.coral, C.dim];
const INDENTS = [0, 1, 2, 2, 3, 3, 2, 1, 1, 2, 3, 2, 1, 0];
const MINIMAP = INDENTS.map((indent, i) => {
  const n = 1 + Math.floor(rnd(i, 7) * 3);
  return {
    indent,
    tokens: Array.from({ length: n }, (_, k) => ({
      w: 3 + rnd(i * 3 + k, 8) * 12,
      c: TOKEN_COLORS[Math.floor(rnd(i * 5 + k, 9) * TOKEN_COLORS.length)]!,
    })),
  };
});

/** 名前を 2 進数にしたもの（リングに沿って回す） */
const BINARY = [..."yuyudao"].map((ch) => ch.charCodeAt(0).toString(2).padStart(8, "0")).join(" ");

/** 周りを漂う記号 */
const SYMBOLS = [";", "=", "+", "*", "/", "#", "$", "&", "%", "!", "?", "0", "1", "<", ">", "|", "~", "@"];
const PARTICLE_COLORS = [C.blue, C.amber, C.green, C.violet, C.coral, C.dim];
const PARTICLES = SYMBOLS.map((t, i) => {
  const angle = (i / SYMBOLS.length) * Math.PI * 2 + rnd(i, 1) * 0.5;
  const radius = 26 + rnd(i, 2) * 20; // vmin
  return {
    t,
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
    size: 2.2 + rnd(i, 3) * 3.2,
    color: PARTICLE_COLORS[i % PARTICLE_COLORS.length]!,
    dx: (rnd(i, 4) - 0.5) * 10,
    dy: (rnd(i, 5) - 0.5) * 10,
    delay: Math.round(rnd(i, 6) * 220),
  };
});

const TERMINAL: { k: "cmd" | "out" | "ok"; t: string }[] = [
  { k: "cmd", t: "git checkout -b intro" },
  { k: "out", t: "Switched to a new branch 'intro'" },
  { k: "cmd", t: "npm run build" },
  { k: "out", t: "> next build" },
  { k: "ok", t: "[ok] compiled successfully in 1.2s" },
  { k: "ok", t: "[ok] 2 routes  /ja  /en" },
];

/** 16 進ダンプの行 */
const HEXDUMP = Array.from({ length: 40 }, (_, i) => {
  const bytes = Array.from({ length: 32 }, (_, k) =>
    Math.floor(rnd(i, k + 20) * 256)
      .toString(16)
      .padStart(2, "0"),
  );
  return `${(i * 32).toString(16).padStart(8, "0")}  ${bytes.slice(0, 16).join(" ")}  ${bytes.slice(16).join(" ")}`;
});

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
            <b>$</b> Now Loading<span>.</span>
            <span>.</span>
            <span>.</span>
            <i className={styles.caretInline} />
          </p>
        </div>
      );

    case "burst":
      return (
        <div className={styles.burst}>
          {GLYPHS.map((g, i) => (
            <span
              key={i}
              className={styles.glyph}
              style={
                {
                  left: `${g.x}%`,
                  top: `${g.y}%`,
                  fontSize: `${g.s}vmin`,
                  color: g.c,
                  "--r": `${g.r}deg`,
                  "--fx": `${g.fx}vmax`,
                  "--fy": `${g.fy}vmax`,
                  animationDelay: `${(i % 4) * 30}ms`,
                } as CSSProperties
              }
            >
              {g.t}
            </span>
          ))}
          <p className={styles.smallName}>
            <span>&lt;</span>
            {NAME}
            <span> /&gt;</span>
          </p>
        </div>
      );

    case "minimap":
      return (
        <div className={styles.minimap}>
          <div className={styles.code}>
            <i className={styles.lineHighlight} />
            {MINIMAP.map((row, i) => (
              <div key={i} className={styles.row}>
                <span className={styles.ln}>{String(i + 1).padStart(2, " ")}</span>
                <span className={styles.tokens} style={{ paddingLeft: `${row.indent * 3.4}vmin`, animationDelay: `${i * 26}ms` }}>
                  {row.tokens.map((t, k) => (
                    <i key={k} style={{ width: `${t.w.toFixed(2)}vmin`, background: t.c }} />
                  ))}
                </span>
              </div>
            ))}
          </div>
        </div>
      );

    case "graph":
      return (
        <svg className={styles.full} viewBox="-100 -100 200 200" preserveAspectRatio="xMidYMid meet">
          <rect x="-1000" y="-1000" width="2000" height="2000" fill={C.bg} />
          <path className={styles.draw} d="M-140 0 H140" stroke={C.blue} strokeWidth="3" fill="none" pathLength={1} />
          <path
            className={styles.draw}
            d="M-60 0 C-44 0 -46 -32 -30 -32 H22 C38 -32 36 0 52 0"
            stroke={C.green}
            strokeWidth="3"
            fill="none"
            pathLength={1}
            style={{ animationDelay: "90ms" }}
          />
          <path
            className={styles.draw}
            d="M-24 0 C-10 0 -12 30 2 30 H34"
            stroke={C.amber}
            strokeWidth="3"
            fill="none"
            pathLength={1}
            style={{ animationDelay: "150ms" }}
          />
          {([
            [-92, 0, C.blue, 40],
            [-60, 0, C.blue, 80],
            [-30, -32, C.green, 160],
            [-4, -32, C.green, 200],
            [22, -32, C.green, 240],
            [-24, 0, C.blue, 120],
            [2, 30, C.amber, 230],
            [52, 0, C.blue, 300],
            [86, 0, C.blue, 340],
          ] as const).map(([x, y, c, d], i) => (
            <circle
              key={i}
              className={styles.pop}
              cx={x}
              cy={y}
              r={i === 8 ? 7 : 4.6}
              fill={i === 8 ? c : C.bg}
              stroke={c}
              strokeWidth="2.6"
              style={{ animationDelay: `${d}ms` }}
            />
          ))}
          <text className={`${styles.svgMono} ${styles.fadeUp}`} x="93" y="-14" textAnchor="end" fontSize="6.4" fill={C.ink} style={{ animationDelay: "320ms" }}>
            HEAD -&gt; main
          </text>
          <text className={`${styles.svgMono} ${styles.fadeUp}`} x="-4" y="-42" textAnchor="middle" fontSize="5.4" fill={C.dim} style={{ animationDelay: "220ms" }}>
            feature/intro
          </text>
        </svg>
      );

    case "binary":
      return (
        <svg className={styles.full} viewBox="-100 -100 200 200" preserveAspectRatio="xMidYMid meet">
          <defs>
            <clipPath id="intro-split">
              <circle r="24" />
            </clipPath>
            <path id="intro-bin" d="M -44 0 a 44 44 0 1 1 88 0 a 44 44 0 1 1 -88 0" />
          </defs>
          <rect x="-1000" y="-1000" width="2000" height="2000" fill={C.raise} />
          <g className={styles.binSpin}>
            <circle r="44" fill="none" stroke={C.line} strokeWidth="13" />
            <text className={styles.svgMono} fontSize="6.6" fill={C.amber} dominantBaseline="middle">
              <textPath href="#intro-bin" textLength="274" lengthAdjust="spacing">
                {BINARY}
              </textPath>
            </text>
          </g>
          <g clipPath="url(#intro-split)">
            <g className={styles.splitSpin}>
              <rect x="-30" y="-30" width="30" height="60" fill={C.green} />
              <rect x="0" y="-30" width="30" height="60" fill={C.coral} />
            </g>
          </g>
        </svg>
      );

    case "gauge":
      return (
        <svg className={styles.full} viewBox="-100 -100 200 200" preserveAspectRatio="xMidYMid meet">
          <rect x="-1000" y="-1000" width="2000" height="2000" fill={C.bg} />
          {([
            [44, C.blue, 72],
            [33, C.green, 88],
            [22, C.amber, 100],
          ] as const).map(([r, c, pct], i) => (
            <g key={i}>
              <circle r={r} fill="none" stroke={C.line} strokeWidth="7" />
              <circle
                className={styles.arc}
                r={r}
                fill="none"
                stroke={c}
                strokeWidth="7"
                strokeLinecap="round"
                pathLength={100}
                transform="rotate(-90)"
                style={{ "--to": `${100 - pct}`, animationDelay: `${i * 60}ms` } as CSSProperties}
              />
            </g>
          ))}
          <path className={styles.draw} d="M-8 0 L-2.5 5.5 L8.5 -6" stroke={C.green} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" fill="none" pathLength={1} style={{ animationDelay: "260ms" }} />
          <text className={`${styles.svgMono} ${styles.fadeUp}`} y="66" textAnchor="middle" fontSize="6" fill={C.dim} style={{ animationDelay: "200ms" }}>
            build passed
          </text>
        </svg>
      );

    case "brackets":
      return (
        <div className={styles.brackets}>
          <i className={styles.amberBg} />
          <div className={styles.pair} data-k="paren">
            <span>(</span>
            <span>)</span>
          </div>
          <div className={styles.pair} data-k="square">
            <span>[</span>
            <span>]</span>
          </div>
          <div className={styles.pair} data-k="curly">
            <span>{"{"}</span>
            <span>{"}"}</span>
          </div>
          {PARTICLES.map((p, i) => (
            <span
              key={i}
              className={styles.symbol}
              style={
                {
                  left: `calc(50% + ${p.x.toFixed(2)}vmin)`,
                  top: `calc(50% + ${p.y.toFixed(2)}vmin)`,
                  fontSize: `${p.size.toFixed(2)}vmin`,
                  color: p.color,
                  "--dx": `${p.dx.toFixed(2)}vmin`,
                  "--dy": `${p.dy.toFixed(2)}vmin`,
                  animationDelay: `${p.delay}ms, ${p.delay}ms`,
                } as CSSProperties
              }
            >
              {p.t}
            </span>
          ))}
          <i className={styles.caret} />
        </div>
      );

    case "terminal":
      return (
        <div className={styles.termScene}>
          <div className={styles.term}>
            <div className={styles.termBar}>
              <i />
              <i />
              <i />
              <span>~/portfolio - zsh</span>
            </div>
            <div className={styles.termBody}>
              {TERMINAL.map((l, i) => (
                <p key={i} data-kind={l.k} style={{ animationDelay: `${80 + i * 55}ms` }}>
                  {l.k === "cmd" ? <b>$ </b> : null}
                  {l.t}
                </p>
              ))}
              <p data-kind="cmd" style={{ animationDelay: `${80 + TERMINAL.length * 55}ms` }}>
                <b>$ </b>
                <i className={styles.caretInline} />
              </p>
            </div>
          </div>
        </div>
      );

    case "tag":
      return (
        <svg className={styles.full} viewBox="-100 -100 200 200" preserveAspectRatio="xMidYMid meet">
          <rect x="-1000" y="-1000" width="2000" height="2000" fill={C.bg} />
          <rect className={styles.pop} x="-78" y="-56" width="156" height="112" rx="16" fill="none" stroke={C.line2} strokeWidth="2" />
          {[
            [-78, -56],
            [78, -56],
            [78, 56],
            [-78, 56],
          ].map(([x, y], i) => (
            <circle key={i} className={styles.pop} cx={x} cy={y} r="2.6" fill={C.dim} style={{ animationDelay: `${160 + i * 30}ms` }} />
          ))}
          <path className={styles.draw} d="M-28 -26 L-56 0 L-28 26" stroke={C.blue} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none" pathLength={1} />
          <path className={styles.draw} d="M12 -34 L-12 34" stroke={C.amber} strokeWidth="10" strokeLinecap="round" fill="none" pathLength={1} style={{ animationDelay: "80ms" }} />
          <path className={styles.draw} d="M28 -26 L56 0 L28 26" stroke={C.green} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none" pathLength={1} style={{ animationDelay: "160ms" }} />
        </svg>
      );

    case "chevrons":
      return (
        <svg className={styles.full} viewBox="-100 -100 200 200" preserveAspectRatio="xMidYMid meet">
          <rect x="-1000" y="-1000" width="2000" height="2000" fill={C.raise} />
          <polyline className={styles.chevL} points="-84,-30 -56,0 -84,30" fill="none" stroke={C.ink} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
          <polyline className={styles.chevR} points="84,-30 56,0 84,30" fill="none" stroke={C.ink} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
          <circle className={styles.donut} r="20" fill="none" stroke="url(#intro-grad)" strokeWidth="12" />
          <g className={styles.orbit}>
            <rect x="-4" y="-42" width="8" height="8" rx="1.6" fill={C.blue} />
            <rect x="29" y="15" width="8" height="8" rx="1.6" fill={C.green} />
            <rect x="-37" y="15" width="8" height="8" rx="1.6" fill={C.amber} />
          </g>
        </svg>
      );

    case "zoom":
      return (
        <div className={styles.zoom}>
          <i className={styles.zoomCaret} />
        </div>
      );

    case "disk":
      return (
        <svg className={styles.full} viewBox="-100 -100 200 200" preserveAspectRatio="xMidYMid meet">
          <rect x="-1000" y="-1000" width="2000" height="2000" fill={C.bg} />
          <circle className={styles.spinCw} r="56" fill="none" stroke={C.amber} strokeWidth="14" strokeDasharray="26 8" />
          <circle className={styles.spinCcw} r="42" fill="none" stroke={C.blue} strokeWidth="12" strokeDasharray="20 6" />
          <circle className={styles.pop} r="30" fill={C.panel} stroke={C.line2} strokeWidth="1.5" />
          <circle className={styles.spinCw} r="22" fill="none" stroke={C.green} strokeWidth="2.4" strokeDasharray="6 5" />
          <rect className={styles.pop} x="-5" y="-9" width="10" height="18" rx="2" fill={C.ink} style={{ animationDelay: "90ms" }} />
        </svg>
      );

    case "hexdump":
      return (
        <div className={styles.hexScene}>
          <pre className={styles.hexBg}>{HEXDUMP.join("\n")}</pre>
          <svg className={styles.full} viewBox="-100 -100 200 200" preserveAspectRatio="xMidYMid meet">
            <circle className={styles.pop} r="46" fill={C.bg} fillOpacity="0.85" stroke={C.line2} strokeWidth="1.5" />
            <circle className={styles.pop} r="37" fill="none" stroke={C.blue} strokeWidth="5" style={{ animationDelay: "50ms" }} />
            <circle className={styles.pop} r="27" fill="url(#intro-grad)" style={{ animationDelay: "100ms" }} />
            <rect className={styles.pop} x="-5" y="-9" width="10" height="18" rx="2" fill={C.bg} style={{ animationDelay: "160ms" }} />
          </svg>
        </div>
      );

    case "typing":
      return (
        <div className={styles.typing}>
          <div className={styles.dots}>
            {[C.blue, C.green, C.amber].map((c, i) => (
              <i key={i} style={{ background: c, animationDelay: `${i * 60}ms` }} />
            ))}
          </div>
          <i className={styles.fillBlue} />
          <i className={styles.fillBg} />
        </div>
      );

    case "name":
      return (
        <div className={styles.nameScene}>
          <div className={styles.nameBlock}>
            <p className={styles.whoami}>
              <b>~ $</b> <span>whoami</span>
            </p>
            <p className={styles.name}>
              {NAME}
              <i className={styles.nameCaret} />
            </p>
          </div>
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
              <stop offset="0" stopColor={C.blue} />
              <stop offset="0.55" stopColor={C.violet} />
              <stop offset="1" stopColor={C.pink} />
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
