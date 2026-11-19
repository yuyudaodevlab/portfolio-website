import type { LaneColor } from "@/content/types";

export type AgentName =
  | "merge"
  | "rebase"
  | "fetch"
  | "commit"
  | "stash"
  | "cherry"
  | "bisect"
  | "blame"
  | "squash"
  | "tag"
  | "reflog"
  | "diff";

export type AgentDef = { name: AgentName; color: LaneColor };

/** 3 色 × 4 体。色はそのままブランチレーンの色 */
export const AGENTS: AgentDef[] = [
  { name: "merge", color: "blue" },
  { name: "rebase", color: "blue" },
  { name: "fetch", color: "blue" },
  { name: "commit", color: "blue" },
  { name: "stash", color: "amber" },
  { name: "cherry", color: "amber" },
  { name: "bisect", color: "amber" },
  { name: "blame", color: "amber" },
  { name: "squash", color: "green" },
  { name: "tag", color: "green" },
  { name: "reflog", color: "green" },
  { name: "diff", color: "green" },
];

/** セクションごとのクルー選びに使う順番。色が混ざるように交互に並べる */
export const ROTATION: AgentName[] = [
  "merge",
  "stash",
  "squash",
  "rebase",
  "cherry",
  "tag",
  "fetch",
  "bisect",
  "reflog",
  "commit",
  "blame",
  "diff",
];

export const LANE_HEX: Record<LaneColor, string> = {
  blue: "#4D8EFF",
  amber: "#F2A93B",
  green: "#3FCF8E",
};

export function isAgentName(v: string | undefined | null): v is AgentName {
  return !!v && AGENTS.some((a) => a.name === v);
}

export function agentColor(name: AgentName): LaneColor {
  return AGENTS.find((a) => a.name === name)!.color;
}
