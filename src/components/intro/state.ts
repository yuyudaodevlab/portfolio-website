/**
 * オープニング（ローディング画面）とページ側をつなぐ取り決め。
 * - layout の BOOT スクリプトが、再生する回だけ <html data-intro="on"> を付ける
 *   （同じタブで 2 回目以降・言語切り替え直後・reduced-motion・JS なしでは付かない）
 * - 終わったら data-intro を外し、window に INTRO_EVENT を投げる
 * - ビルド演出のエンジンは whenIntroDone() で終わるのを待ってから動き出す
 */

export const INTRO_SEEN_KEY = "intro:seen";
export const INTRO_EVENT = "intro:done";

declare global {
  interface Window {
    __introDone?: boolean;
  }
}

export function introPlaying(): boolean {
  return document.documentElement.dataset.intro === "on" && !window.__introDone;
}

export function finishIntro(): void {
  if (window.__introDone) return;
  window.__introDone = true;
  delete document.documentElement.dataset.intro;
  window.dispatchEvent(new Event(INTRO_EVENT));
}

/** オープニングが終わっていれば即座に、再生中なら終わったときに fn を呼ぶ。戻り値で取り消せる */
export function whenIntroDone(fn: () => void): () => void {
  if (!introPlaying()) {
    fn();
    return () => {};
  }
  const handler = () => fn();
  window.addEventListener(INTRO_EVENT, handler, { once: true });
  return () => window.removeEventListener(INTRO_EVENT, handler);
}
