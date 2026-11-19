"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { buildBus } from "@/components/build/bus";
import { GraphSim } from "./sim";
import styles from "./graph.module.css";

type Props = { repoNames: string[]; reduced: boolean; mobile: boolean; onReady: () => void };

const LABEL_COLOR: Record<string, string> = {
  main: "var(--ink-dim)",
  blue: "var(--lane-blue)",
  amber: "var(--lane-amber)",
  green: "var(--lane-green)",
};

function Scene({ repoNames, reduced, mobile, labelsRef, onReady }: Props & { labelsRef: React.RefObject<HTMLDivElement | null> }) {
  const { camera, size, invalidate } = useThree();
  const sim = useMemo(
    () =>
      new GraphSim({
        capacity: mobile ? 200 : 600,
        maxBranches: mobile ? 3 : 5,
        repoNames,
      }),
    [mobile, repoNames],
  );
  const state = useRef({ acc: 0, pointerX: 0, pointerY: 0, px: 0, py: 0, dolly: 0, opacity: 0.32, camZ: 0 });
  const mainLabel = useRef<HTMLSpanElement | null>(null);

  // ブランチ名のラベル（DOM）。ヘッドの位置を毎フレーム投影して置く
  useEffect(() => {
    const host = labelsRef.current;
    if (!host) return;
    const main = document.createElement("span");
    main.textContent = "main";
    main.style.color = LABEL_COLOR.main!;
    host.append(main);
    mainLabel.current = main;
    const sync = () => {
      for (const b of sim.branches) {
        if (b.label) continue;
        const el = document.createElement("span");
        el.textContent = b.name;
        el.style.color = LABEL_COLOR[b.color]!;
        host.append(el);
        b.label = el;
      }
      const live = new Set(sim.branches.map((b) => b.label));
      for (const el of [...host.children]) {
        if (el !== main && !live.has(el as HTMLElement)) el.remove();
      }
    };
    sim.onBranchesChange = sync;
    sim.seed(reduced ? 90 : mobile ? 10 : 18);
    sync();

    // 3D グラフとビルドの連動: ブロック完成ごとにその色のコミットを 1 つ
    const s = state.current;
    s.opacity = 0.32 + 0.68 * buildBus.ratio;
    if (reduced) {
      for (const b of buildBus.blocks) sim.queueBuildCommit(b.color);
      while (sim.hasPending()) sim.step(0);
    } else {
      for (const b of buildBus.blocks) sim.queueBuildCommit(b.color);
    }
    sim.setOpacity(reduced ? 1 : s.opacity);
    const unsub = buildBus.subscribe((e) => {
      if (e.type === "block") sim.queueBuildCommit(e.done.color);
      if (e.type === "highlight") sim.highlight(e.color);
      invalidate();
    });
    s.camZ = sim.headZ() + 3.2;
    onReady();
    invalidate();
    return () => {
      unsub();
      sim.onBranchesChange = null;
      host.replaceChildren();
      sim.dispose();
    };
  }, [sim, labelsRef, reduced, mobile, invalidate, onReady]);

  useEffect(() => {
    if (reduced) return;
    const ac = new AbortController();
    window.addEventListener(
      "pointermove",
      (e) => {
        state.current.pointerX = e.clientX / window.innerWidth - 0.5;
        state.current.pointerY = e.clientY / window.innerHeight - 0.5;
      },
      { passive: true, signal: ac.signal },
    );
    return () => ac.abort();
  }, [reduced]);

  const v = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const s = state.current;
    const dt = Math.min(delta, 0.05);
    const now = performance.now();

    if (!reduced) {
      // 時間とともにコミットが増える。ビルドの分は速めに消化する
      s.acc += dt;
      const interval = sim.hasPending() ? 0.07 : mobile ? 0.6 : 0.42;
      while (s.acc >= interval) {
        s.acc -= interval;
        sim.step(now);
      }
      // 組み上がるほど濃くなる
      const targetOpacity = 0.32 + 0.68 * buildBus.ratio;
      s.opacity += (targetOpacity - s.opacity) * (1 - Math.exp(-dt * 3));
      sim.setOpacity(s.opacity);
      sim.animate(now, dt);

      // マウスでわずかに視差、スクロールで main に沿ってドリー
      s.px += (s.pointerX - s.px) * (1 - Math.exp(-dt * 2.5));
      s.py += (s.pointerY - s.py) * (1 - Math.exp(-dt * 2.5));
      const hero = window.innerHeight;
      const targetDolly = Math.min(1.6, window.scrollY / hero) * 5.5;
      s.dolly += (targetDolly - s.dolly) * (1 - Math.exp(-dt * 4));
      const targetZ = sim.headZ() + 3.2;
      s.camZ += (targetZ - s.camZ) * (1 - Math.exp(-dt * 1.8));
    }

    camera.position.set(s.px * 0.7, 1.05 - s.py * 0.35, s.camZ - s.dolly);
    camera.lookAt(s.px * 0.2, -0.1, s.camZ - s.dolly - 8);

    // ラベルの位置
    const w = size.width;
    const h = size.height;
    const place = (el: HTMLElement | null | undefined, p: THREE.Vector3) => {
      if (!el) return;
      v.copy(p).project(camera);
      const visible = v.z < 1 && v.z > -1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05;
      if (!visible) {
        el.style.opacity = "0";
        return;
      }
      const x = (v.x * 0.5 + 0.5) * w;
      const y = (-v.y * 0.5 + 0.5) * h;
      el.style.opacity = "1";
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    };
    place(mainLabel.current, sim.mainHead);
    for (const b of sim.branches) place(b.label, b.head);
  });

  return <primitive object={sim.root} />;
}

/** ヒーロー背景の 3D コミットグラフ。クライアント専用（next/dynamic, ssr: false）で読み込まれる */
export default function CommitGraph({ repoNames, reduced, mobile, onReady }: Props) {
  const labelsRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  // タブが非表示の間は描画を止める
  useEffect(() => {
    const onVis = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return (
    <>
      <Canvas
        className={styles.canvas}
        dpr={[1, 1.75]}
        frameloop={reduced ? "demand" : visible ? "always" : "never"}
        camera={{ fov: 48, near: 0.1, far: 40, position: [0, 1, 4] }}
        gl={{ antialias: true, alpha: false, powerPreference: "low-power" }}
        aria-hidden="true"
      >
        <color attach="background" args={["#0B0D10"]} />
        <fog attach="fog" args={["#0B0D10", 3, mobile ? 16 : 22]} />
        <Scene repoNames={repoNames} reduced={reduced} mobile={mobile} labelsRef={labelsRef} onReady={onReady} />
      </Canvas>
      <div ref={labelsRef} className={`${styles.labels} mono`} aria-hidden="true" />
    </>
  );
}
