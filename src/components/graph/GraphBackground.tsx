"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import styles from "./graph.module.css";

/**
 * JS なし・読み込み前に出す静止画。奥へ伸びるレーンとコミットを平面で描いたもの。
 * サーバーでも描画され、GPU がない環境ではこれがそのまま残る。
 */
function StaticGraph() {
  const lanes = [
    { x: 0, c: "#E9E6DF", o: 0.35 },
    { x: -120, c: "#4D8EFF", o: 0.5 },
    { x: 130, c: "#3FCF8E", o: 0.5 },
    { x: -230, c: "#F2A93B", o: 0.35 },
  ];
  return (
    <svg className={styles.static} viewBox="-600 -40 1200 700" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      {lanes.map((l, i) => (
        <g key={i} stroke={l.c} fill={l.c} opacity={l.o}>
          <path d={`M${l.x * 0.25} 0 L${l.x * 2.2} 660`} strokeWidth="1.2" fill="none" />
          {[0.18, 0.32, 0.47, 0.6, 0.74, 0.88].map((t) => (
            <circle key={t} cx={l.x * 0.25 + (l.x * 2.2 - l.x * 0.25) * t} cy={660 * t} r={2 + t * 4} />
          ))}
        </g>
      ))}
    </svg>
  );
}

/**
 * GPU で描けるかを小さなキャンバスで確かめる。
 * ソフトウェア描画（failIfMajorPerformanceCaveat に引っかかる環境）では three.js を読み込まず、静止画のままにする。
 */
function hasFastWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    const opts = { failIfMajorPerformanceCaveat: true };
    const gl = (c.getContext("webgl2", opts) ?? c.getContext("webgl", opts)) as WebGLRenderingContext | null;
    if (!gl) return false;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return !/swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer);
  } catch {
    return false;
  }
}

type GraphProps = { repoNames: string[]; reduced: boolean; mobile: boolean; onReady: () => void };

/**
 * 背景レイヤー（position: fixed、本文の下）。
 * ヒーローを抜けると暗くフェードして背景に退く。
 */
export function GraphBackground({ repoNames }: { repoNames: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [load, setLoad] = useState<{ reduced: boolean; mobile: boolean; Graph: ComponentType<GraphProps> } | null>(null);
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);

  // 最初の描画（LCP）を邪魔しないよう、アイドル時に three.js を読み込む
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 720px), (pointer: coarse)").matches;
    let cancelled = false;
    // three.js は GPU で描ける環境でだけ読み込む（クライアント専用。サーバーでは静止画だけ）
    const start = () => {
      if (!hasFastWebGL()) return;
      void import("./CommitGraph").then((m) => {
        if (!cancelled) setLoad({ reduced, mobile, Graph: m.default });
      });
    };
    const w: Window = window;
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(start, { timeout: 1500 });
      return () => {
        cancelled = true;
        w.cancelIdleCallback(id);
      };
    }
    const id = w.setTimeout(start, 600);
    return () => {
      cancelled = true;
      w.clearTimeout(id);
    };
  }, []);

  // スクロールでヒーローを抜けたら暗く
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const update = () => {
      raf = 0;
      const t = Math.min(1, window.scrollY / (window.innerHeight * 0.9));
      el.style.opacity = String(reduced ? (t > 0.5 ? 0.2 : 1) : 1 - 0.8 * t);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className={styles.bg} data-ready={ready ? "" : undefined}>
      <StaticGraph />
      {load ? <load.Graph repoNames={repoNames} reduced={load.reduced} mobile={load.mobile} onReady={onReady} /> : null}
    </div>
  );
}
