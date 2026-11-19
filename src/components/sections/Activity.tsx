import { Block } from "@/components/build/Block";
import type { Dictionary, Lang } from "@/content/types";
import type { GithubData } from "@/lib/github";
import { ContributionCalendar } from "./ContributionCalendar";
import { Section } from "./Section";
import s from "./sections.module.css";

const formatDate = (iso: string) => iso.slice(0, 10);

function ActivitySummary({ t, data }: { t: Dictionary; data: GithubData }) {
  const total = data.contributions?.total;
  return (
    <div className={s.summary}>
      {total != null ? (
        <p className={s.bigNumber}>
          <span className={s.bigValue}>{total.toLocaleString("en-US")}</span>
          <span className={s.bigLabel}>{t.activity.contributionsLabel}</span>
        </p>
      ) : (
        <p className={s.para}>{t.activity.unavailable}</p>
      )}
      <p className={`${s.fetched} mono`}>{t.activity.fetchedAt(formatDate(data.fetchedAt), data.source === "snapshot")}</p>
    </div>
  );
}

function LanguageShare({ t, data }: { t: Dictionary; data: GithubData }) {
  const top = data.languages.slice(0, 6);
  const rest = data.languages.slice(6).reduce((a, l) => a + l.ratio, 0);
  const rows = rest > 0.001 ? [...top, { name: "Other", bytes: 0, ratio: rest }] : top;
  return (
    <figure className={s.langs}>
      <figcaption className={s.subhead}>{t.activity.languagesLabel}</figcaption>
      <div className={s.langBar} aria-hidden="true">
        {rows.map((l, i) => (
          <span key={l.name} style={{ flexGrow: l.ratio, opacity: Math.max(0.18, 1 - i * 0.15) }} />
        ))}
      </div>
      <ul className={`${s.langList} mono`}>
        {rows.map((l) => (
          <li key={l.name}>
            <span>{l.name}</span>
            <span className={s.dim}>{(l.ratio * 100).toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

function RepoList({ t, data }: { t: Dictionary; data: GithubData }) {
  return (
    <div>
      <h3 className={s.subhead}>{t.activity.reposLabel}</h3>
      <ul className={s.repos}>
        {data.repos.map((r) => (
          <li key={r.name} className={s.repo}>
            <a className={`link ${s.repoName}`} href={r.url}>
              {r.name}
            </a>
            <span className={`${s.repoLang} mono`}>{r.language ?? "—"}</span>
            <span className={`${s.repoDate} mono`}>
              <span className="sr-only">{t.activity.updated} </span>
              {formatDate(r.pushedAt)}
            </span>
            {r.description ? <span className={s.repoDesc}>{r.description}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Activity({ t, lang, data }: { t: Dictionary; lang: Lang; data: GithubData }) {
  return (
    <Section id="activity" title={t.sections.activity.title}>
      <Block jsx={`<ActivitySummary user="${data.user}" />`} className={s.activitySummary}>
        <ActivitySummary t={t} data={data} />
      </Block>
      {data.contributions ? (
        <Block jsx="<ContributionCalendar weeks={53} />" className={s.calendarBlock}>
          <ContributionCalendar weeks={data.contributions.weeks} lang={lang} label={t.activity.calendarLabel(data.contributions.total)} less={t.activity.less} more={t.activity.more} />
        </Block>
      ) : null}
      {data.languages.length ? (
        <Block jsx="<LanguageShare />" className={s.langBlock}>
          <LanguageShare t={t} data={data} />
        </Block>
      ) : null}
      {data.repos.length ? (
        <Block jsx={`<RepoList count={${data.repos.length}} />`} className={s.repoBlock}>
          <RepoList t={t} data={data} />
        </Block>
      ) : null}
    </Section>
  );
}
