import type { LogLine } from "./engine";
import styles from "./Dock.module.css";

const VISIBLE = 6;

/** git log --oneline 風の固定ログ。14:02:11  [bisect]  built <ExperienceRow org="Proton" /> */
export function BuildLog({ lines, label }: { lines: LogLine[]; label: string }) {
  const shown = lines.slice(-VISIBLE);
  return (
    <div className={styles.log} role="log" aria-live="off" aria-label={label}>
      {shown.map((l, i) => (
        <p key={l.id} className={styles.line} style={{ opacity: 0.45 + (0.55 * (i + 1)) / shown.length }}>
          <span className={styles.time}>{l.time}</span>
          <span className={styles.agent} style={{ color: `var(--lane-${l.color})` }}>
            [{l.agent}]
          </span>
          <span className={styles.text}>{l.text}</span>
        </p>
      ))}
    </div>
  );
}
