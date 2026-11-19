// GitHub の公開データを取得して、サイトで使う形に整える。
// Next.js にも Node スクリプト (scripts/snapshot-github.mts) にも読まれるので、
// パスエイリアスや next/* の import は使わない。

export const GITHUB_USER = "yuyudaodevlab";

export type Repo = {
  name: string;
  url: string;
  description: string | null;
  language: string | null;
  pushedAt: string;
  fork: boolean;
};

export type ContributionDay = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 };

export type LanguageShare = { name: string; bytes: number; ratio: number };

export type GithubData = {
  user: string;
  fetchedAt: string;
  source: "live" | "snapshot";
  repos: Repo[];
  contributions: { total: number; weeks: ContributionDay[][] } | null;
  languages: LanguageShare[];
};

type FetchInit = RequestInit & { next?: { revalidate?: number } };

const REVALIDATE = 3600;

function headers(token?: string): HeadersInit {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "portfolio-site",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function getJson<T>(url: string, token?: string): Promise<T> {
  const init: FetchInit = { headers: headers(token), next: { revalidate: REVALIDATE } };
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`GitHub ${res.status} ${url}`);
  return (await res.json()) as T;
}

type ApiRepo = {
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  pushed_at: string;
  fork: boolean;
  archived: boolean;
  languages_url: string;
};

async function fetchRepos(user: string, token?: string): Promise<ApiRepo[]> {
  return getJson<ApiRepo[]>(
    `https://api.github.com/users/${user}/repos?type=owner&sort=pushed&per_page=100`,
    token,
  );
}

async function fetchLanguages(repos: ApiRepo[], token?: string): Promise<LanguageShare[]> {
  const own = repos.filter((r) => !r.fork && !r.archived).slice(0, 12);
  const totals = new Map<string, number>();
  const results = await Promise.allSettled(
    own.map((r) => getJson<Record<string, number>>(r.languages_url, token)),
  );
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const [lang, bytes] of Object.entries(r.value)) {
      totals.set(lang, (totals.get(lang) ?? 0) + bytes);
    }
  }
  const sum = [...totals.values()].reduce((a, b) => a + b, 0);
  if (sum === 0) return [];
  return [...totals.entries()]
    .map(([name, bytes]) => ({ name, bytes, ratio: bytes / sum }))
    .sort((a, b) => b.bytes - a.bytes);
}

const LEVELS: Record<string, ContributionDay["level"]> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

async function fetchContributionsGraphql(user: string, token: string) {
  const query = `query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount contributionLevel}}}}}}`;
  const init: FetchInit = {
    method: "POST",
    headers: { ...headers(token), "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { login: user } }),
    next: { revalidate: REVALIDATE },
  };
  const res = await fetch("https://api.github.com/graphql", init);
  if (!res.ok) throw new Error(`GitHub GraphQL ${res.status}`);
  type Day = { date: string; contributionCount: number; contributionLevel: string };
  const json = (await res.json()) as {
    data?: {
      user?: {
        contributionsCollection: {
          contributionCalendar: { totalContributions: number; weeks: { contributionDays: Day[] }[] };
        };
      };
    };
  };
  const cal = json.data?.user?.contributionsCollection.contributionCalendar;
  if (!cal) throw new Error("GitHub GraphQL: no calendar");
  return {
    total: cal.totalContributions,
    weeks: cal.weeks.map((w) =>
      w.contributionDays.map((d) => ({
        date: d.date,
        count: d.contributionCount,
        level: LEVELS[d.contributionLevel] ?? 0,
      })),
    ),
  };
}

// トークンが無いときは、プロフィールページが読み込む公開 HTML から読み取る。
async function fetchContributionsHtml(user: string) {
  const init: FetchInit = {
    headers: { "User-Agent": "portfolio-site", Accept: "text/html" },
    next: { revalidate: REVALIDATE },
  };
  const res = await fetch(`https://github.com/users/${user}/contributions`, init);
  if (!res.ok) throw new Error(`contributions ${res.status}`);
  const html = await res.text();

  const counts = new Map<string, number>();
  for (const m of html.matchAll(/for="(contribution-day-component-[\d-]+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
    const n = /^(\d[\d,]*) contribution/.exec(m[2]!.trim());
    counts.set(m[1]!, n ? Number(n[1]!.replace(/,/g, "")) : 0);
  }

  const days: ContributionDay[] = [];
  for (const m of html.matchAll(/<td[^>]*class="ContributionCalendar-day"[^>]*>/g)) {
    const tag = m[0];
    const date = /data-date="([\d-]+)"/.exec(tag)?.[1];
    const level = Number(/data-level="(\d)"/.exec(tag)?.[1] ?? 0) as ContributionDay["level"];
    const id = /id="([^"]+)"/.exec(tag)?.[1] ?? "";
    if (date) days.push({ date, level, count: counts.get(id) ?? 0 });
  }
  if (days.length === 0) throw new Error("contributions: no days parsed");
  days.sort((a, b) => a.date.localeCompare(b.date));

  // 日曜始まりの週に並べ直す
  const weeks: ContributionDay[][] = [];
  for (const d of days) {
    const dow = new Date(`${d.date}T00:00:00Z`).getUTCDay();
    if (dow === 0 || weeks.length === 0) weeks.push([]);
    weeks[weeks.length - 1]!.push(d);
  }

  const totalMatch = /id="js-contribution-activity-description"[^>]*>\s*([\d,]+)\s+contribution/.exec(html);
  const total = totalMatch ? Number(totalMatch[1]!.replace(/,/g, "")) : days.reduce((a, d) => a + d.count, 0);
  return { total, weeks };
}

export async function fetchGithubLive(user = GITHUB_USER, token?: string): Promise<GithubData> {
  const apiRepos = await fetchRepos(user, token);
  const [languages, contributions] = await Promise.all([
    fetchLanguages(apiRepos, token).catch(() => []),
    // トークンの権限で GraphQL が使えない場合（Actions の GITHUB_TOKEN など）は公開 HTML に切り替える
    (token
      ? fetchContributionsGraphql(user, token).catch(() => fetchContributionsHtml(user))
      : fetchContributionsHtml(user)
    ).catch(() => null),
  ]);
  const repos: Repo[] = apiRepos
    .filter((r) => !r.fork && !r.archived && r.name.toLowerCase() !== user.toLowerCase())
    .sort((a, b) => b.pushed_at.localeCompare(a.pushed_at))
    .slice(0, 6)
    .map((r) => ({
      name: r.name,
      url: r.html_url,
      description: r.description,
      language: r.language,
      pushedAt: r.pushed_at,
      fork: r.fork,
    }));
  return {
    user,
    fetchedAt: new Date().toISOString(),
    source: "live",
    repos,
    contributions,
    languages,
  };
}
