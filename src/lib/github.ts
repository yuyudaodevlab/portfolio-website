import "server-only";
import snapshot from "@/data/github-snapshot.json";
import { fetchGithubLive, GITHUB_USER, type GithubData } from "./github-core";

export type { GithubData, Repo, ContributionDay, LanguageShare } from "./github-core";

/**
 * サーバー側で GitHub の公開データを取得する（ISR: 1 時間）。
 * 失敗したら、最後に取得できた値（github-snapshot.json）を返す。
 */
export async function getGithubData(): Promise<GithubData> {
  try {
    const token = process.env.GITHUB_TOKEN || undefined;
    const live = await fetchGithubLive(GITHUB_USER, token, process.env.CONTRIBUTIONS_TOKEN || token);
    if (live.repos.length === 0 && !live.contributions) throw new Error("empty");
    return {
      ...live,
      contributions: live.contributions ?? (snapshot as GithubData).contributions,
      languages: live.languages.length ? live.languages : (snapshot as GithubData).languages,
    };
  } catch {
    return { ...(snapshot as GithubData), source: "snapshot" };
  }
}
