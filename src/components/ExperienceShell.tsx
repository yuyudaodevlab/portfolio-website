'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowDown, ArrowUpRight, GitBranch, Menu, X } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const GitUniverse = dynamic(() => import('./GitUniverse'), { ssr: false, loading: () => <div className="universe-loading"><GitBranch size={80} strokeWidth={.6}/></div> });
const navigation = [['about', '私について'], ['ecosystem', '技術'], ['experience', '活動'], ['achievements', '実績']] as const;

export function Navigation() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('');
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) setActive(entry.target.id); });
    }, { rootMargin: '-15% 0px -60% 0px' });
    document.querySelectorAll('main section[id]').forEach(el => observer.observe(el));
    const onProgress = (event: Event) => setCompact((event as CustomEvent<number>).detail > .01);
    window.addEventListener('portfolio-progress', onProgress);
    return () => { observer.disconnect(); window.removeEventListener('portfolio-progress', onProgress); };
  }, []);
  return <header className={`navigation ${compact ? 'is-compact' : ''}`}>
    <a className="brand" href="#home" aria-label="yuyudao トップ"><span className="brand-symbol"><GitBranch size={21}/></span><span>yuyudao<span className="brand-dot">.</span></span><span className="brand-sub"> / DEV LAB</span></a>
    <nav aria-label="メインナビゲーション" className={open ? 'nav-links is-open' : 'nav-links'}>
      {navigation.map(([id, text]) => <a key={id} href={`#${id}`} onClick={() => setOpen(false)} aria-current={active === id ? 'location' : undefined}>{text}</a>)}
    </nav>
    <a href="#contact" className="nav-contact">つながる <ArrowUpRight size={14}/></a>
    <button className="menu-toggle" aria-label={open ? 'メニューを閉じる' : 'メニューを開く'} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
  </header>;
}

export function HeroVisual() { return <div className="hero-universe"><GitUniverse/></div>; }

export function MagneticLink({ href, children, className = '' }: { href: string; children: React.ReactNode; className?: string }) {
  const [point, setPoint] = useState({x:0,y:0});
  const reduced = useReducedMotion();
  return <motion.a href={href} className={`magnetic-link ${className}`} animate={point} transition={{type:'spring',stiffness:220,damping:20}} onPointerMove={event => {
    if(reduced || event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    setPoint({x:(event.clientX - rect.left - rect.width/2)*.09,y:(event.clientY-rect.top-rect.height/2)*.13});
  }} onPointerLeave={() => setPoint({x:0,y:0})} whileTap={{scale:.97}}>{children}</motion.a>;
}

export function ScrollDirector() {
  const meter = useRef<HTMLSpanElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    const root = ScrollTrigger.create({start:0,end:'max',onUpdate:self => {
      if(meter.current) meter.current.style.transform = `scaleY(${self.progress})`;
      if(readout.current) readout.current.textContent = `${Math.round(self.progress*100).toString().padStart(2,'0')}%`;
      window.dispatchEvent(new CustomEvent('portfolio-progress',{detail:self.progress}));
    }});
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach(el => {
        gsap.fromTo(el,{y:26,opacity:.35},{y:0,opacity:1,ease:'power2.out',scrollTrigger:{trigger:el,start:'top 94%',end:'top 72%',scrub:true}});
      });
      gsap.utils.toArray<HTMLElement>('[data-cluster]').forEach(el => {
        gsap.fromTo(el,{clipPath:'inset(0 0 100% 0)'},{clipPath:'inset(0 0 0% 0)',ease:'none',scrollTrigger:{trigger:el,start:'top 92%',end:'top 62%',scrub:true}});
      });
      gsap.utils.toArray<HTMLElement>('[data-commit]').forEach(el => {
        gsap.fromTo(el,{ '--commit-progress': 0, borderColor:'rgba(167,139,250,.5)' },{'--commit-progress':1,borderColor:'rgba(255,255,255,.09)',scrollTrigger:{trigger:el,start:'top 92%',end:'top 65%',scrub:true}});
      });
      gsap.utils.toArray<SVGPathElement>('.final-merge path').forEach((path,i) => {
        const length = path.getTotalLength();
        gsap.fromTo(path,{strokeDasharray:length,strokeDashoffset:length},{strokeDashoffset:0,ease:'power2.inOut',scrollTrigger:{trigger:'.final-merge',start:`top ${95-i*3}%`,end:'center 45%',scrub:true}});
      });
    });
    const cleanups: (() => void)[] = [];
    document.querySelectorAll<HTMLElement>('[data-tilt]').forEach(card => {
      const move = (event: PointerEvent) => {
        if(event.pointerType !== 'mouse' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const r = card.getBoundingClientRect(), x=(event.clientX-r.left)/r.width, y=(event.clientY-r.top)/r.height;
        card.style.setProperty('--pointer-x',`${x*100}%`);card.style.setProperty('--pointer-y',`${y*100}%`);
        card.style.transform = `perspective(900px) rotateX(${(y-.5)*-5}deg) rotateY(${(x-.5)*5}deg)`;
      };
      const leave = () => {card.style.transform='';};
      card.addEventListener('pointermove',move); card.addEventListener('pointerleave',leave);
      cleanups.push(() => {card.removeEventListener('pointermove',move);card.removeEventListener('pointerleave',leave);});
    });
    const refresh = () => ScrollTrigger.refresh();
    document.fonts.ready.then(refresh);
    window.addEventListener('load',refresh);
    const timer = window.setTimeout(refresh,400);
    return () => {clearTimeout(timer);window.removeEventListener('load',refresh);root.kill();media.revert();cleanups.forEach(fn=>fn());};
  }, []);
  return <aside className="scroll-meter" aria-hidden="true"><span className="meter-label">HEAD</span><span className="meter-track"><span ref={meter}/></span><span ref={readout}>00%</span></aside>;
}

export function ScrollCue() {return <a href="#building" className="scroll-cue"><span className="scroll-cue-icon"><ArrowDown size={15}/></span><span>スクロールして、つくる過程へ</span><span className="mono">01 — 07</span></a>;}
