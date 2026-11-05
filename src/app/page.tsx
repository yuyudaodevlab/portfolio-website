import { ArrowUpRight, GitBranch, Code2 } from 'lucide-react';
import { Navigation, HeroVisual, MagneticLink, ScrollDirector, ScrollCue } from '@/components/ExperienceShell';
import CollaborativeCanvas from '@/components/CollaborativeCanvas';
import PortfolioSections from '@/components/PortfolioSections';

export default function Home() {
  return <><Navigation/><ScrollDirector/><main>
    <section id="home" className="hero">
      <div className="hero-topline"><span><span className="status-dot"/> CREATIVE DEVELOPER & SYSTEMS ENGINEER</span><span>BASED IN JAPAN <span className="timezone"> / JST</span></span></div>
      <div className="hero-content">
        <div className="hero-copy"><p className="eyebrow"><span>01 / INITIALIZATION</span><span className="tiny-line"/> HELLO, WORLD.</p>
          <h1>アイデアを、<br/><span className="hero-gradient">動くシステムへ。</span></h1>
          <p className="hero-english">Building the web.<br/><em>One commit at a time.</em></p>
          <p className="hero-description">コード、デザイン、AI、そしてインフラ。<br/>あらゆる技術をつなぎ、まだない体験をつくる。</p>
          <div className="hero-actions"><MagneticLink href="#building" className="primary-button">制作のプロセスを見る <ArrowUpRight size={17}/></MagneticLink><a href="#about" className="text-link">プロフィールへ <ArrowUpRight size={15}/></a></div>
        </div>
        <HeroVisual/>
        <div className="floating-commit"><span className="commit-icon"><GitBranch size={17}/></span><div><span className="mono">initial commit</span><small>すべては、ひとつのアイデアから。</small></div><span className="commit-hash">a1b2c3d</span></div>
      </div>
      <div className="hero-bottom"><ScrollCue/><span className="hero-bottom-note"><Code2 size={14}/> DESIGNED IN CODE. BUILT WITH INTENT.</span></div>
    </section>
    <div className="chapter-divider"><span className="mono"><GitBranch size={14}/> feature / portfolio</span><span>ひとつのアイデアが、かたちになるまで。</span><span className="mono">SCROLL TO BUILD ↓</span></div>
    <CollaborativeCanvas/>
    <PortfolioSections/>
  </main><footer className="footer"><a href="#home" className="brand">yuyudao<span className="brand-dot">.</span></a><span>Built with curiosity. Committed to possibility.</span><a href="#home">トップへ戻る ↑</a></footer></>;
}
