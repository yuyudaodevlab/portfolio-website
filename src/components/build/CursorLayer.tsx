import type { Ref } from "react";
import { AGENTS } from "./agents";
import styles from "./CursorLayer.module.css";

const FRAME_COUNT = 12;

/**
 * カーソル 12 体と、作業中ブロックに重ねるフレーム（マーキー / アウトライン / ツールチップ）。
 * 位置はエンジンが transform で動かす。ページ座標なのでスクロールと一緒に動く。
 */
export function CursorLayer({ ref }: { ref: Ref<HTMLDivElement> }) {
  return (
    <div ref={ref} className={styles.layer} aria-hidden="true">
      {Array.from({ length: FRAME_COUNT }, (_, i) => (
        <div key={i} className={styles.frame} data-frame="" data-phase="off">
          <div className={styles.tint} data-part="tint" />
          <div className={`${styles.edge} ${styles.eH}`} data-part="eT">
            <i />
          </div>
          <div className={`${styles.edge} ${styles.eV}`} data-part="eL">
            <i />
          </div>
          <div className={`${styles.edge} ${styles.eH}`} data-part="eB">
            <i />
          </div>
          <div className={`${styles.edge} ${styles.eV}`} data-part="eR">
            <i />
          </div>
          <div className={styles.dims} data-part="dims" />
          <div className={styles.outline}>
            <b />
            <b />
            <b />
            <b />
          </div>
          <div className={styles.tip} data-part="tip" />
        </div>
      ))}
      {AGENTS.map((a) => (
        <div
          key={a.name}
          className={styles.cursor}
          data-cursor={a.name}
          style={{ ["--agent" as string]: `var(--lane-${a.color})` }}
        >
          <svg width="18" height="22" viewBox="0 0 18 22" className={styles.arrow}>
            <path
              d="M1.5 1.5 L1.5 17.6 L5.6 13.7 L8.6 20.3 L11.5 19 L8.6 12.6 L14.4 12.4 Z"
              fill="var(--agent)"
              stroke="#0B0D10"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
          </svg>
          <span className={styles.tag}>{a.name}</span>
        </div>
      ))}
    </div>
  );
}
