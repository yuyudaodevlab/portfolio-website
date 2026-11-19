import type { LaneColor, SectionId } from "@/content/types";
import { shortHash } from "@/lib/hash";

export type SectionMeta = { id: SectionId | "hero"; lane: LaneColor; label: string; hash: string };

/** セクションと Git の対応。ラベルは飾りで、見出しは普通の言葉で書く */
const RAW: Omit<SectionMeta, "hash">[] = [
  { id: "hero", lane: "blue", label: "HEAD -> main" },
  { id: "about", lane: "blue", label: "README.md" },
  { id: "stack", lane: "amber", label: "package.json" },
  { id: "experience", lane: "green", label: "git log --graph" },
  { id: "recognition", lane: "blue", label: "git tag -l" },
  { id: "certifications", lane: "amber", label: 'git tag -l "cert/*"' },
  { id: "activity", lane: "green", label: "git shortlog" },
  { id: "contact", lane: "blue", label: "git remote -v" },
];

export const SECTIONS: SectionMeta[] = RAW.map((s) => ({ ...s, hash: shortHash(`section:${s.id}`) }));

export function sectionMeta(id: SectionMeta["id"]): SectionMeta {
  return SECTIONS.find((s) => s.id === id)!;
}

const LANE_CYCLE: LaneColor[] = ["blue", "amber", "green"];
export function laneAt(i: number): LaneColor {
  return LANE_CYCLE[i % LANE_CYCLE.length]!;
}
