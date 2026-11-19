"use client";

import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/content/types";
import { BuildLog } from "./BuildLog";
import { buildBus } from "./bus";
import { Controls } from "./Controls";
import { CursorLayer } from "./CursorLayer";
import styles from "./Dock.module.css";
import { whenIntroDone } from "../intro/state";
import { createEngine, type Engine, type EngineStatus, type LogLine } from "./engine";

const MAX_LINES = 40;

/**
 * エンジンの生成と破棄、ログとボタンの描画。
 * ページのラッパー（data-page, position: relative）の中に置く。
 */
export function BuildRuntime({ ui }: { ui: Dictionary["ui"] }) {
  const layerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const [lines, setLines] = useState<LogLine[]>([]);
  const [status, setStatus] = useState<EngineStatus>("off");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [logOpen, setLogOpen] = useState(true);

  // 完成したら、少し待ってからログを畳む（ボタンは残す）
  useEffect(() => {
    if (status === "playing" || status === "rebuilding") {
      setLogOpen(true);
      return;
    }
    const id = window.setTimeout(() => setLogOpen(false), 4000);
    return () => window.clearTimeout(id);
  }, [status]);

  useEffect(() => {
    const layer = layerRef.current;
    const page = layer?.closest<HTMLElement>("[data-page]");
    if (!layer || !page) return;

    const total = page.querySelectorAll("[data-block]").length;
    const unsubscribe = buildBus.subscribe((e) => {
      if (e.type === "progress") setProgress({ done: Math.round(e.ratio * total), total });
      if (e.type === "reset") setProgress({ done: 0, total });
    });

    // オープニングが流れている間は動かさない（終わってから組み立てを始める）
    let engine: Engine | null = null;
    const cancelWait = whenIntroDone(() => {
      engine = createEngine({
        page,
        layer,
        play: new URLSearchParams(window.location.search).has("play"),
        onLog: (line) => setLines((prev) => [...prev.slice(-(MAX_LINES - 1)), line]),
        onStatus: setStatus,
      });
      engineRef.current = engine;
    });

    // 経歴の行にホバーしたら、3D グラフの同じ色のレーンを光らせる
    const hover = new AbortController();
    document.addEventListener(
      "pointerover",
      (e) => {
        const el = (e.target as Element | null)?.closest<HTMLElement>("[data-highlight]");
        const from = (e.relatedTarget as Element | null)?.closest<HTMLElement>("[data-highlight]");
        if (el && el !== from) {
          const c = el.dataset.highlight;
          if (c === "blue" || c === "amber" || c === "green") buildBus.highlight(c);
        }
      },
      { signal: hover.signal, passive: true },
    );

    return () => {
      hover.abort();
      unsubscribe();
      cancelWait();
      engine?.destroy();
      engineRef.current = null;
    };
  }, []);

  return (
    <>
      <CursorLayer ref={layerRef} />
      {status !== "off" && (
        <aside className={styles.dock} data-status={status} aria-label={ui.logLabel}>
          <Controls
            status={status}
            progress={progress}
            ui={ui}
            onSkip={() => engineRef.current?.skip()}
            onRebuild={() => engineRef.current?.rebuild()}
          />
          {logOpen && lines.length ? <BuildLog lines={lines} label={ui.logLabel} /> : null}
        </aside>
      )}
    </>
  );
}
