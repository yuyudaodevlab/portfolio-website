"use client";

import Link from "next/link";
import { requestCompleteOnNextLoad } from "@/components/build/engine";
import type { Lang } from "@/content/types";
import styles from "./site.module.css";

/**
 * JA / EN 切り替え。切り替えたら演出はキャンセルし、新しい言語のページは完成状態で出す（再生は Rebuild）。
 */
export function LangSwitch({ lang, label }: { lang: Lang; label: string }) {
  const items: { code: Lang; text: string; name: string }[] = [
    { code: "ja", text: "JA", name: "日本語" },
    { code: "en", text: "EN", name: "English" },
  ];
  return (
    <nav className={styles.lang} aria-label={label}>
      {items.map((it, i) => (
        <span key={it.code}>
          {i > 0 ? <span className={styles.sep} aria-hidden="true">/</span> : null}
          {it.code === lang ? (
            <span className={styles.current} aria-current="page" lang={it.code}>
              <span aria-hidden="true">{it.text}</span>
              <span className="sr-only">{it.name}</span>
            </span>
          ) : (
            <Link
              href={`/${it.code}`}
              hrefLang={it.code}
              lang={it.code}
              className={styles.langLink}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                requestCompleteOnNextLoad();
                // 新しい言語のページが一瞬でも空で描かれないように、先に隠しを解除する
                document.documentElement.dataset.build = "off";
              }}
            >
              <span aria-hidden="true">{it.text}</span>
              <span className="sr-only">{it.name}</span>
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
