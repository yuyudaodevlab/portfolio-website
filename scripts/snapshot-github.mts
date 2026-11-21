// GitHub の最新値を src/data/github-snapshot.json に書き出す。
// API が落ちているときにサイトが表示するフォールバック値になる。
//   npm run github:snapshot   （prebuild でも自動実行）
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { fetchGithubLive } from "../src/lib/github-core.ts";

const out = fileURLToPath(new URL("../src/data/github-snapshot.json", import.meta.url));

try {
  // CONTRIBUTIONS_TOKEN（本人の PAT）があればプライベートリポジトリのコミットも件数に含める
  const token = process.env.GITHUB_TOKEN || undefined;
  const data = await fetchGithubLive(undefined, token, process.env.CONTRIBUTIONS_TOKEN || token);
  if (data.repos.length === 0 && !data.contributions) throw new Error("empty response");
  await writeFile(out, JSON.stringify({ ...data, source: "snapshot" }, null, 2) + "\n");
  console.log(`github snapshot: ${data.repos.length} repos, ${data.contributions?.total ?? "-"} contributions`);
} catch (err) {
  // 失敗しても既存のスナップショットを残してビルドは続ける
  console.warn("github snapshot skipped:", err instanceof Error ? err.message : err);
}
