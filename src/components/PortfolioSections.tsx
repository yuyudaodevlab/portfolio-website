import {
  ArrowDownRight,
  ArrowUpRight,
  Braces,
  Code2,
  Cpu,
  GitBranch,
  Globe2,
  Layers3,
  Server,
  Sparkles,
} from "lucide-react";
import { profile } from "../data/profile";
import "./portfolio-sections.css";

const clusterIcons = [Braces, Code2, Server, Cpu, Layers3];

export default function PortfolioSections() {
  return (
    <>
      <section className="section-shell ps-about" id="about" aria-labelledby="about-title">
        <div className="ps-about-top" data-reveal>
          <p className="eyebrow"><span>03</span> ABOUT / PROFILE</p>
          <span className="ps-location"><Globe2 size={14} /> BASED IN {profile.location.toUpperCase()}</span>
        </div>
        <div className="ps-about-grid">
          <div className="ps-about-copy" data-reveal>
            <h2 id="about-title">技術の可能性を、<br /><em>現実の価値へ。</em></h2>
            {profile.about.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            <div className="ps-focus-list" aria-label="Areas of focus">
              {profile.focus.map((item) => <span key={item}>{item}</span>)}
            </div>
          </div>
          <aside className="ps-about-aside" data-reveal>
            <div className="ps-orbit" aria-hidden="true">
              <div className="ps-orbit-ring ps-orbit-ring-one" />
              <div className="ps-orbit-ring ps-orbit-ring-two" />
              <span className="ps-orbit-center"><Sparkles size={22} /></span>
              <span className="ps-orbit-node ps-orbit-node-ai">AI</span>
              <span className="ps-orbit-node ps-orbit-node-code">&lt;/&gt;</span>
              <span className="ps-orbit-node ps-orbit-node-world">文 / A</span>
              <span className="ps-orbit-node ps-orbit-node-sys">SYS</span>
            </div>
            <p className="ps-aside-caption">ENGINEERING × LANGUAGE × PEOPLE</p>
          </aside>
        </div>
      </section>

      <section className="section-shell ps-ecosystem" id="ecosystem" aria-labelledby="ecosystem-title">
        <div className="ps-section-heading" data-reveal>
          <div><p className="eyebrow"><span>04</span> ECOSYSTEM / TOOLKIT</p><h2 id="ecosystem-title">技術を組み合わせ、<em>形にする。</em></h2></div>
          <p>目的に合わせて選び、組み合わせる。<br />日々の制作を支える技術とツール。</p>
        </div>
        <div className="ps-ecosystem-board">
          <div className="ps-ecosystem-core" aria-hidden="true"><span><Code2 size={24} /></span><small>TOOLKIT</small></div>
          {profile.technologies.map((cluster, index) => {
            const Icon = clusterIcons[index];
            return (
              <article className={`ps-cluster ps-cluster-${index + 1}`} data-cluster key={cluster.name}>
                <div className="ps-cluster-wire" aria-hidden="true" />
                <div className="ps-cluster-heading"><span className="ps-cluster-icon"><Icon size={16} /></span><h3>{cluster.name}</h3><span className="ps-cluster-index">0{index + 1}</span></div>
                <div className="ps-tech-list">{cluster.items.map((technology) => <span key={technology}>{technology}</span>)}</div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section-shell ps-experience" id="experience" aria-labelledby="experience-title">
        <div className="ps-section-heading" data-reveal>
          <div><p className="eyebrow"><span>05</span> EXPERIENCE / CONTRIBUTIONS</p><h2 id="experience-title">活動を通じて、<em>技術を届ける。</em></h2></div>
          <p>翻訳、校正、コミュニティ。<br />オープンな場で技術を届ける。</p>
        </div>
        <div className="ps-commit-list">
          {profile.experience.map((item, index) => (
            <article className="ps-commit" data-commit key={item.organization}>
              <div className="ps-commit-rail" aria-hidden="true"><span className="ps-commit-dot" />{index < profile.experience.length - 1 && <span className="ps-commit-line" />}</div>
              <div className="ps-commit-content">
                <div className="ps-commit-meta"><span><GitBranch size={13} /> {item.kind}</span><span>CONTRIBUTION 0{index + 1}</span></div>
                <h3>{item.organization}</h3>
                <p className="ps-commit-role">{item.role}</p>
                <p className="ps-commit-description">{item.description}</p>
                <div className="ps-experience-tags">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
              </div>
              <ArrowUpRight className="ps-commit-arrow" size={18} aria-hidden="true" />
            </article>
          ))}
        </div>
      </section>

      <section className="section-shell ps-achievements" id="achievements" aria-labelledby="achievements-title">
        <div className="ps-section-heading" data-reveal>
          <div><p className="eyebrow"><span>06</span> ACHIEVEMENTS / CREDENTIALS</p><h2 id="achievements-title">積み重ねた実績と、<em>学び。</em></h2></div>
          <p>積み重ねた活動と、<br />学びを示す認定資格。</p>
        </div>
        <div className="ps-achievement-layout">
          <ol className="ps-achievement-ledger">
            {profile.achievements.map((achievement) => (
              <li key={achievement.mark} data-reveal>
                <span className="ps-ledger-mark">{achievement.mark}</span>
                <div><h3>{achievement.title}</h3><p>{achievement.detail}</p></div>
                <ArrowDownRight size={15} aria-hidden="true" />
              </li>
            ))}
          </ol>
          <div className="ps-cert-column">
            <p className="ps-cert-label"><span /> GOOGLE CERTIFICATIONS <span className="ps-cert-count">04</span></p>
            <div className="ps-certificates">
              {profile.certifications.map((certification, index) => (
                <article className="ps-certificate" data-tilt data-reveal key={certification.name}>
                  <span className="ps-cert-number">0{index + 1}</span>
                  <div className="ps-cert-seal" aria-hidden="true"><Sparkles size={15} /></div>
                  <h3>{certification.name}</h3>
                  <span className="ps-cert-domain">{certification.domain}</span>
                  {certification.url && <a className="ps-cert-link" href={certification.url} target="_blank" rel="noreferrer">認定資格を見る <ArrowUpRight size={13} /></a>}
                  <span className="ps-cert-issuer">ISSUED BY GOOGLE</span>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell ps-contact" id="contact" aria-labelledby="contact-title">
        <div className="ps-contact-inner" data-reveal>
          <div className="ps-contact-graphic" aria-hidden="true">
            <svg className="final-merge" viewBox="0 0 900 250" role="presentation" preserveAspectRatio="xMidYMid meet">
              <defs><linearGradient id="ps-branch-gradient" x1="0" x2="1"><stop offset="0%" stopColor="#6d5ad1" stopOpacity=".3"/><stop offset="100%" stopColor="#b7a0ff"/></linearGradient></defs>
              <path className="ps-branch-line ps-branch-a" d="M30 38 H170 C205 38 205 74 240 74 H515 C555 74 555 125 595 125 H760 C798 125 798 125 835 125" />
              <path className="ps-branch-line ps-branch-b" d="M30 91 H155 C195 91 195 125 235 125 H510 C550 125 550 125 590 125" />
              <path className="ps-branch-line ps-branch-c" d="M30 145 H155 C195 145 195 125 235 125" />
              <path className="ps-branch-line ps-branch-d" d="M30 172 H170 C205 172 205 151 240 151 H515 C555 151 555 125 595 125" />
              <path className="ps-branch-line ps-branch-e" d="M30 218 H170 C205 218 205 179 240 179 H515 C555 179 555 125 595 125" />
              <path className="ps-branch-line ps-branch-main" d="M595 125 H835" />
              {[38, 91, 145, 172, 218].map((y) => <circle key={y} className="ps-branch-dot" cx="30" cy={y} r="5" />)}
              <circle className="ps-branch-merge" cx="595" cy="125" r="8" />
              <rect className="ps-main-node" x="835" y="97" width="58" height="56" rx="12" />
              <text className="ps-main-label" x="864" y="131" textAnchor="middle">MAIN</text>
              <text className="ps-branch-label" x="44" y="28">feature/design</text><text className="ps-branch-label" x="44" y="81">feature/engineering</text><text className="ps-branch-label" x="44" y="135">feature/infrastructure</text><text className="ps-branch-label" x="44" y="162">feature/localization</text><text className="ps-branch-label" x="44" y="208">feature/ai</text>
            </svg>
          </div>
          <p className="eyebrow"><span>07</span> CONTACT / NEXT CHAPTER</p>
          <h2 id="contact-title">次の可能性を、<br /><em>一緒に開発しよう。</em></h2>
          <p className="ps-contact-copy">技術、AI、ローカライズ。新しい協業やアイデアについて、気軽にお声がけください。</p>
          <div className="ps-contact-actions">
            {profile.contactUrl ? <a href={profile.contactUrl} target="_blank" rel="noreferrer">CONTACT <ArrowUpRight size={17} /></a> : <span className="ps-contact-pending">連絡先は準備中</span>}
            {profile.githubUrl && <a className="ps-github-link" href={profile.githubUrl} target="_blank" rel="noreferrer">GITHUB <ArrowUpRight size={16} /></a>}
          </div>
        </div>
      </section>
    </>
  );
}
