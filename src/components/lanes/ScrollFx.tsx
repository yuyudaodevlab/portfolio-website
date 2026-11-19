"use client";

import { useEffect } from "react";

/** セクション見出しのわずかな視差（最大 ±12px）。reduced-motion では何もしない。 */
export function ScrollFx() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const els = [...document.querySelectorAll<HTMLElement>("[data-parallax]")];
    const ac = new AbortController();
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      for (const el of els) {
        const r = el.parentElement!.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) continue;
        const offset = Math.max(-12, Math.min(12, (r.top + r.height / 2 - vh / 2) * -0.04));
        el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true, signal: ac.signal });
    update();
    return () => {
      ac.abort();
      if (raf) cancelAnimationFrame(raf);
      els.forEach((el) => (el.style.transform = ""));
    };
  }, []);
  return null;
}
