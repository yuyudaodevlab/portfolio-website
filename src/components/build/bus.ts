import type { LaneColor } from "@/content/types";
import type { AgentName } from "./agents";

/**
 * ビルドエンジンと、ビルド対象外の装飾（3D グラフ・ブランチレーン）をつなぐ小さなイベントバス。
 * 後から購読したものも現状を復元できるように、状態も持つ。
 */

export type BlockDone = { agent: AgentName; color: LaneColor; section: string; jsx: string };

export type BusEvent =
  | { type: "block"; done: BlockDone }
  | { type: "section"; section: string }
  | { type: "reset" }
  | { type: "progress"; ratio: number }
  | { type: "highlight"; color: LaneColor };

type Listener = (e: BusEvent) => void;

class BuildBus {
  blocks: BlockDone[] = [];
  sections = new Set<string>();
  ratio = 0;
  private listeners = new Set<Listener>();

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private emit(e: BusEvent) {
    for (const fn of this.listeners) fn(e);
  }

  blockDone(done: BlockDone) {
    this.blocks.push(done);
    this.emit({ type: "block", done });
  }

  sectionDone(section: string) {
    if (this.sections.has(section)) return;
    this.sections.add(section);
    this.emit({ type: "section", section });
  }

  progress(ratio: number) {
    this.ratio = ratio;
    this.emit({ type: "progress", ratio });
  }

  reset() {
    this.blocks = [];
    this.sections.clear();
    this.ratio = 0;
    this.emit({ type: "reset" });
  }

  highlight(color: LaneColor) {
    this.emit({ type: "highlight", color });
  }
}

export const buildBus = new BuildBus();
