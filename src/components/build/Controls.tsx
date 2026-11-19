import type { Dictionary } from "@/content/types";
import type { EngineStatus } from "./engine";
import styles from "./Dock.module.css";

type Props = {
  status: EngineStatus;
  progress: { done: number; total: number };
  ui: Dictionary["ui"];
  onSkip: () => void;
  onRebuild: () => void;
};

export function Controls({ status, progress, ui, onSkip, onRebuild }: Props) {
  const building = status === "playing" || status === "rebuilding";
  return (
    <div className={styles.controls} data-build-controls="">
      <span className={styles.status}>
        {building ? ui.building : ui.complete}{" "}
        <span className={styles.count}>
          {progress.done}/{progress.total}
        </span>
      </span>
      <button type="button" className={styles.button} onClick={onSkip} disabled={!building}>
        {ui.skip}
      </button>
      <button type="button" className={styles.button} onClick={onRebuild}>
        {ui.rebuild}
      </button>
    </div>
  );
}
