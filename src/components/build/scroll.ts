/**
 * 自動スクロールと「意図的なスクロール」の検知。
 * 自動スクロールはエンジンの rAF ループから step() で進める（setTimeout や smooth behavior は使わない）。
 */

const SCROLL_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  " ",
  "Spacebar",
  "Tab",
]);

/**
 * ホイール 2 ノッチ（0.5 秒以内）、60px のタッチドラッグ、スクロールキーのどれかで onDeliberate を呼ぶ。
 * 自動スクロール自体は scroll イベントしか起こさないので、ここには引っかからない。
 */
export function watchDeliberateScroll(signal: AbortSignal, onDeliberate: () => void): void {
  let fired = false;
  const fire = () => {
    if (fired || signal.aborted) return;
    fired = true;
    onDeliberate();
  };

  let notches: number[] = [];
  window.addEventListener(
    "wheel",
    (e) => {
      if (Math.abs(e.deltaY) < 1 && Math.abs(e.deltaX) < 1) return;
      const now = performance.now();
      notches = notches.filter((t) => now - t < 500);
      notches.push(now);
      if (notches.length >= 2) fire();
    },
    { passive: true, signal },
  );

  let startY: number | null = null;
  window.addEventListener(
    "touchstart",
    (e) => {
      startY = e.touches[0]?.clientY ?? null;
    },
    { passive: true, signal },
  );
  window.addEventListener(
    "touchmove",
    (e) => {
      const y = e.touches[0]?.clientY;
      if (startY != null && y != null && Math.abs(y - startY) >= 60) fire();
    },
    { passive: true, signal },
  );
  window.addEventListener(
    "touchend",
    () => {
      startY = null;
    },
    { passive: true, signal },
  );

  window.addEventListener(
    "keydown",
    (e) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (t?.closest("[data-build-controls]")) return;
      if (SCROLL_KEYS.has(e.key)) fire();
    },
    { signal },
  );
}

export type Span = { top: number; bottom: number };

/**
 * 作業中ブロックを画面内に保つためのスクロール位置。
 * 一番下のブロックが見えるところまでだけ下げ、一番上のブロックが画面外に出るほどは下げない。
 * spans はドキュメント座標。
 */
export function keepInViewTarget(spans: Span[], current: number, vh: number, maxScroll: number): number {
  if (spans.length === 0) return current;
  const marginTop = Math.min(96, vh * 0.12);
  const marginBottom = Math.min(72, vh * 0.1);
  let highest = Infinity;
  let lowest = -Infinity;
  for (const s of spans) {
    highest = Math.min(highest, s.top);
    lowest = Math.max(lowest, s.bottom);
  }
  const cap = highest - marginTop; // これ以上下げると一番上が見切れる
  let target = current;
  if (lowest + marginBottom > current + vh) target = Math.min(lowest + marginBottom - vh, cap);
  if (highest - marginTop < target) target = Math.max(0, cap);
  return Math.max(0, Math.min(maxScroll, target));
}

/** 目標値へ指数的に近づける自動スクロール。速度の上限付き */
export class AutoScroller {
  target: number | null = null;
  private pos: number | null = null;

  setTarget(y: number | null) {
    this.target = y;
  }

  stop() {
    this.target = null;
    this.pos = null;
  }

  moving(): boolean {
    return this.target != null && Math.abs(this.target - window.scrollY) > 1;
  }

  /** dt は秒。スクロールしたら true */
  step(dt: number): boolean {
    if (this.target == null) return false;
    const current = window.scrollY;
    // ユーザーが少し動かした場合はその位置から再開する
    if (this.pos == null || Math.abs(this.pos - current) > 2) this.pos = current;
    const diff = this.target - this.pos;
    if (Math.abs(diff) < 0.5) {
      this.pos = this.target;
      return false;
    }
    const k = 1 - Math.exp(-dt * 4.2);
    const maxStep = 3200 * dt;
    const delta = Math.max(-maxStep, Math.min(maxStep, diff * k));
    this.pos += delta;
    window.scrollTo({ top: this.pos, behavior: "instant" as ScrollBehavior });
    return true;
  }
}
