import { ROTATION, isAgentName, type AgentName } from "./agents";

/**
 * セクション単位の割り当て。
 * - 1 セクションのブロックは最大 4 体のクルーでラウンドロビン
 * - data-agent="tag" は必ずその名前のエージェントへ
 * - data-agent-prefer="rebase" はそのエージェントを優先（負荷が偏るときは他へ回す）
 */

export type BlockKind = "block" | "headline";

export type BlockJob = {
  id: number;
  el: HTMLElement;
  section: SectionPlan;
  jsx: string;
  kind: BlockKind;
  hard: AgentName | null;
  prefer: AgentName | null;
  agent: AgentName | null;
  status: "queued" | "active" | "done";
};

export type SectionPlan = {
  id: string;
  index: number;
  el: HTMLElement;
  jobs: BlockJob[];
  crew: AgentName[];
  started: boolean;
  done: boolean;
};

export const CREW_SIZE = 4;

export function collectSections(root: ParentNode): SectionPlan[] {
  const sections: SectionPlan[] = [];
  let id = 0;
  root.querySelectorAll<HTMLElement>("[data-section]").forEach((el, index) => {
    const plan: SectionPlan = {
      id: el.dataset.section ?? `s${index}`,
      index,
      el,
      jobs: [],
      crew: [],
      started: false,
      done: false,
    };
    el.querySelectorAll<HTMLElement>("[data-block]").forEach((blockEl) => {
      const hard = blockEl.dataset.agent;
      const prefer = blockEl.dataset.agentPrefer;
      plan.jobs.push({
        id: id++,
        el: blockEl,
        section: plan,
        jsx: blockEl.dataset.jsx ?? "<Block />",
        kind: blockEl.dataset.kind === "headline" ? "headline" : "block",
        hard: isAgentName(hard) ? hard : null,
        prefer: isAgentName(prefer) ? prefer : null,
        agent: null,
        status: "queued",
      });
    });
    sections.push(plan);
  });
  return sections;
}

/**
 * セクションのクルーを決め、各ジョブにエージェントを割り当てる。
 * load はエージェントごとの未処理ジョブ数（すでに他セクションで抱えている分）。
 */
export function assignSection(section: SectionPlan, load: Map<AgentName, number>): void {
  const pending = section.jobs.filter((j) => j.status === "queued");
  const crew: AgentName[] = [];
  const add = (name: AgentName) => {
    if (!crew.includes(name)) crew.push(name);
  };

  // 名前指定は必ずクルーに入る
  for (const j of pending) if (j.hard) add(j.hard);
  for (const j of pending) if (j.prefer && crew.length < CREW_SIZE) add(j.prefer);

  // 残りは「手が空いている順 → ローテーション順」
  const want = Math.min(CREW_SIZE, Math.max(1, pending.filter((j) => !j.hard).length + crew.length));
  const offset = (section.index * CREW_SIZE) % ROTATION.length;
  const candidates = ROTATION.map((_, i) => ROTATION[(i + offset) % ROTATION.length]!)
    .filter((n) => !crew.includes(n))
    .map((name, order) => ({ name, order, load: load.get(name) ?? 0 }))
    .sort((a, b) => a.load - b.load || a.order - b.order);
  for (const c of candidates) {
    if (crew.length >= want) break;
    add(c.name);
  }

  // ラウンドロビン（名前指定のブロックはその名前へ）
  const local = new Map<AgentName, number>(crew.map((n) => [n, 0]));
  const rr = crew.filter((n) => !pending.some((j) => j.hard === n) || crew.length === 1);
  const pool = rr.length ? rr : crew;
  let cursor = 0;
  for (const job of pending) {
    let agent: AgentName;
    if (job.hard) {
      agent = job.hard;
    } else if (job.prefer && local.has(job.prefer)) {
      const min = Math.min(...pool.map((n) => local.get(n) ?? 0));
      agent = (local.get(job.prefer) ?? 0) <= min ? job.prefer : pool[cursor++ % pool.length]!;
    } else {
      agent = pool[cursor++ % pool.length]!;
    }
    job.agent = agent;
    local.set(agent, (local.get(agent) ?? 0) + 1);
  }
  section.crew = crew;
  section.started = true;
}
