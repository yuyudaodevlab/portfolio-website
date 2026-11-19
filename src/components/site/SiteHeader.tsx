import type { Dictionary, Lang } from "@/content/types";
import { LangSwitch } from "./LangSwitch";
import styles from "./site.module.css";

export function SiteHeader({ lang, t }: { lang: Lang; t: Dictionary }) {
  return (
    <header className={styles.header}>
      <a className={`${styles.home} mono`} href="#top">
        yuyudaodevlab
      </a>
      <LangSwitch lang={lang} label={t.ui.langLabel} />
    </header>
  );
}

export function SiteFooter({ t }: { t: Dictionary }) {
  return (
    <footer className={`${styles.footer} mono`}>
      <span>© {new Date().getFullYear()} Yuyudaodevlab</span>
      <span>{t.footer}</span>
    </footer>
  );
}
