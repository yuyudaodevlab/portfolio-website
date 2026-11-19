import * as THREE from "three";
import type { LaneColor } from "@/content/types";

/**
 * 奥行き方向に伸びるコミット DAG のシミュレーション（three.js のオブジェクトを直接持つ）。
 * - 色ごとにグループ（main / blue / amber / green）を分け、InstancedMesh と LineSegments をリングバッファで使い回す
 * - 新しいコミットは手前に増え、古いコミットは霧の奥へ退いていく
 * - 分岐とマージは TubeGeometry の曲線
 */

export const ROW = 0.34;
const GROUPS = ["main", "blue", "amber", "green"] as const;
type GroupKey = (typeof GROUPS)[number];

const BASE_COLOR: Record<GroupKey, string> = {
  main: "#9AA0A9",
  blue: "#4D8EFF",
  amber: "#F2A93B",
  green: "#3FCF8E",
};

const SLOTS = [
  { x: -0.95, y: 0.16 },
  { x: 0.95, y: -0.1 },
  { x: -1.75, y: -0.22 },
  { x: 1.75, y: 0.24 },
  { x: -2.5, y: 0.08 },
  { x: 2.5, y: -0.18 },
];

type Group = {
  key: GroupKey;
  color: THREE.Color;
  dots: THREE.InstancedMesh;
  dotMat: THREE.MeshBasicMaterial;
  dotCursor: number;
  dotCount: number;
  lines: THREE.LineSegments;
  lineMat: THREE.LineBasicMaterial;
  linePos: Float32Array;
  lineCursor: number;
  lineCount: number;
  tubeMat: THREE.MeshBasicMaterial;
  glow: number;
};

export type Branch = {
  slot: number;
  color: LaneColor;
  name: string;
  head: THREE.Vector3;
  commits: number;
  label: HTMLElement | null;
};

type Pop = { group: Group; index: number; pos: THREE.Vector3; scale: number; born: number };

const tmpM = new THREE.Matrix4();
const tmpQ = new THREE.Quaternion();
const tmpS = new THREE.Vector3();

export class GraphSim {
  readonly root = new THREE.Group();
  readonly groups: Record<GroupKey, Group>;
  row = 0;
  mainHead = new THREE.Vector3(0, 0, 0);
  branches: Branch[] = [];
  private tubes: THREE.Mesh[] = [];
  private pops: Pop[] = [];
  private pending: LaneColor[] = [];
  private repoNames: string[];
  private repoCursor = 0;
  private maxBranches: number;
  private capacity: number;
  private opacity = 0.32;
  onBranchesChange: (() => void) | null = null;

  constructor(opts: { capacity: number; maxBranches: number; repoNames: string[] }) {
    this.capacity = opts.capacity;
    this.maxBranches = opts.maxBranches;
    this.repoNames = opts.repoNames.length ? opts.repoNames : ["portfolio-website", "graph", "build"];
    const dotGeo = new THREE.SphereGeometry(0.045, 10, 8);
    this.groups = Object.fromEntries(
      GROUPS.map((key) => {
        const color = new THREE.Color(BASE_COLOR[key]);
        const dotMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: this.opacity, depthWrite: false });
        const dots = new THREE.InstancedMesh(dotGeo, dotMat, this.capacity);
        dots.count = 0;
        dots.frustumCulled = false;
        const linePos = new Float32Array(this.capacity * 2 * 3);
        const lineGeo = new THREE.BufferGeometry();
        lineGeo.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
        lineGeo.setDrawRange(0, 0);
        const lineMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: this.opacity * 0.8, depthWrite: false });
        const lines = new THREE.LineSegments(lineGeo, lineMat);
        lines.frustumCulled = false;
        const tubeMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: this.opacity, depthWrite: false });
        this.root.add(lines, dots);
        const g: Group = {
          key,
          color: color.clone(),
          dots,
          dotMat,
          dotCursor: 0,
          dotCount: 0,
          lines,
          lineMat,
          linePos,
          lineCursor: 0,
          lineCount: 0,
          tubeMat,
          glow: 0,
        };
        return [key, g];
      }),
    ) as Record<GroupKey, Group>;
  }

  private z(row: number) {
    return row * ROW;
  }

  private addDot(group: Group, pos: THREE.Vector3, scale: number, now: number) {
    const i = group.dotCursor;
    tmpS.setScalar(scale);
    tmpM.compose(pos, tmpQ, tmpS);
    group.dots.setMatrixAt(i, tmpM);
    group.dots.instanceMatrix.needsUpdate = true;
    group.dotCursor = (i + 1) % this.capacity;
    group.dotCount = Math.min(this.capacity, group.dotCount + 1);
    group.dots.count = group.dotCount;
    if (now > 0) this.pops.push({ group, index: i, pos: pos.clone(), scale, born: now });
  }

  private addLine(group: Group, a: THREE.Vector3, b: THREE.Vector3) {
    const o = group.lineCursor * 6;
    group.linePos.set([a.x, a.y, a.z, b.x, b.y, b.z], o);
    group.lineCursor = (group.lineCursor + 1) % this.capacity;
    group.lineCount = Math.min(this.capacity, group.lineCount + 1);
    group.lines.geometry.setDrawRange(0, group.lineCount * 2);
    (group.lines.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }

  private addCurve(group: Group, a: THREE.Vector3, b: THREE.Vector3) {
    const k = Math.abs(b.z - a.z) * 0.55;
    const curve = new THREE.CubicBezierCurve3(
      a.clone(),
      new THREE.Vector3(a.x, a.y, a.z + k),
      new THREE.Vector3(b.x, b.y, b.z - k),
      b.clone(),
    );
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.011, 5, false), group.tubeMat);
    mesh.frustumCulled = false;
    this.root.add(mesh);
    this.tubes.push(mesh);
    if (this.tubes.length > 48) {
      const old = this.tubes.shift()!;
      this.root.remove(old);
      old.geometry.dispose();
    }
  }

  private nextName(color: LaneColor, forBuild: boolean) {
    if (forBuild) return `build/${color}`;
    const name = this.repoNames[this.repoCursor % this.repoNames.length]!;
    this.repoCursor++;
    return `feat/${name}`;
  }

  private commitMain(now: number) {
    const pos = new THREE.Vector3(0, 0, this.z(this.row));
    this.addLine(this.groups.main, this.mainHead, pos);
    this.addDot(this.groups.main, pos, 1, now);
    this.mainHead.copy(pos);
  }

  private commitBranch(b: Branch, now: number, scale = 1) {
    const s = SLOTS[b.slot]!;
    const pos = new THREE.Vector3(s.x, s.y, this.z(this.row));
    this.addLine(this.groups[b.color], b.head, pos);
    this.addDot(this.groups[b.color], pos, scale, now);
    b.head.copy(pos);
    b.commits++;
  }

  private fork(color: LaneColor, now: number, forBuild = false): Branch | null {
    const used = new Set(this.branches.map((b) => b.slot));
    const free = SLOTS.map((_, i) => i).filter((i) => !used.has(i));
    if (free.length === 0) return null;
    const slot = free[Math.floor(Math.random() * free.length)]!;
    const s = SLOTS[slot]!;
    const start = this.mainHead.clone();
    const pos = new THREE.Vector3(s.x, s.y, this.z(this.row));
    this.addCurve(this.groups[color], start, pos);
    this.addDot(this.groups[color], pos, 1, now);
    const b: Branch = { slot, color, name: this.nextName(color, forBuild), head: pos, commits: 1, label: null };
    this.branches.push(b);
    this.onBranchesChange?.();
    return b;
  }

  private merge(b: Branch, now: number) {
    this.commitMain(now);
    this.addCurve(this.groups[b.color], b.head, this.mainHead);
    this.branches = this.branches.filter((x) => x !== b);
    this.onBranchesChange?.();
  }

  /** ビルドで完成したブロック 1 つ分のコミット（エージェントの色） */
  queueBuildCommit(color: LaneColor) {
    this.pending.push(color);
  }

  hasPending() {
    return this.pending.length > 0;
  }

  step(now: number) {
    this.row++;
    const colors: LaneColor[] = ["blue", "amber", "green"];
    const build = this.pending.shift();
    if (build) {
      let b = this.branches.find((x) => x.color === build);
      if (!b) {
        if (this.branches.length >= this.maxBranches) {
          const oldest = this.branches.reduce((a, x) => (x.commits > a.commits ? x : a));
          this.merge(oldest, now);
          this.row++;
        }
        b = this.fork(build, now, true) ?? undefined;
        if (!b) {
          this.commitMain(now);
          return;
        }
        this.row++;
      }
      this.commitBranch(b, now, 1.7);
      return;
    }

    const r = Math.random();
    const mergeable = this.branches.filter((b) => b.commits >= 3);
    if (r < 0.14 && this.branches.length < this.maxBranches) {
      this.fork(colors[Math.floor(Math.random() * 3)]!, now);
    } else if (r < 0.26 && mergeable.length) {
      this.merge(mergeable[Math.floor(Math.random() * mergeable.length)]!, now);
    } else if (r < 0.55 || this.branches.length === 0) {
      this.commitMain(now);
    } else {
      this.commitBranch(this.branches[Math.floor(Math.random() * this.branches.length)]!, now);
    }
  }

  /** 最初の数本のレーンを作る */
  seed(rows: number) {
    this.commitMain(0);
    this.fork("blue", 0);
    this.row++;
    this.commitMain(0);
    this.fork("green", 0);
    for (let i = 0; i < rows; i++) this.step(0);
    this.pops.length = 0;
  }

  headZ() {
    return this.z(this.row);
  }

  setOpacity(o: number) {
    this.opacity = o;
    for (const g of Object.values(this.groups)) {
      g.dotMat.opacity = o;
      g.tubeMat.opacity = o * 0.95;
      g.lineMat.opacity = o * 0.75;
    }
  }

  highlight(color: LaneColor) {
    this.groups[color].glow = 1;
  }

  /** 毎フレーム: 新しい点のポップと、ハイライトの減衰 */
  animate(now: number, dt: number) {
    for (let i = this.pops.length - 1; i >= 0; i--) {
      const p = this.pops[i]!;
      const t = Math.min(1, (now - p.born) / 420);
      const s = p.scale * (1 + 1.6 * (1 - t) * (1 - t));
      tmpS.setScalar(s);
      tmpM.compose(p.pos, tmpQ, tmpS);
      p.group.dots.setMatrixAt(p.index, tmpM);
      p.group.dots.instanceMatrix.needsUpdate = true;
      if (t >= 1) this.pops.splice(i, 1);
    }
    const white = new THREE.Color("#ffffff");
    for (const g of Object.values(this.groups)) {
      if (g.glow <= 0) continue;
      g.glow = Math.max(0, g.glow - dt * 1.6);
      const c = g.color.clone().lerp(white, g.glow * 0.55);
      g.dotMat.color.copy(c);
      g.lineMat.color.copy(c);
      g.tubeMat.color.copy(c);
      const boost = this.opacity + (1 - this.opacity) * g.glow;
      g.dotMat.opacity = boost;
      g.lineMat.opacity = boost * 0.75;
      g.tubeMat.opacity = boost * 0.95;
    }
  }

  dispose() {
    for (const t of this.tubes) t.geometry.dispose();
    for (const g of Object.values(this.groups)) {
      g.dots.geometry.dispose();
      g.dots.dispose();
      g.lines.geometry.dispose();
      g.dotMat.dispose();
      g.lineMat.dispose();
      g.tubeMat.dispose();
    }
  }
}
