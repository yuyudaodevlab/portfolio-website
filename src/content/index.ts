import { en } from "./en";
import { ja } from "./ja";
import type { Dictionary, Lang } from "./types";

export { LANGS } from "./types";
export type { Dictionary, Lang } from "./types";

const DICTS: Record<Lang, Dictionary> = { ja, en };

export function isLang(value: string): value is Lang {
  return value === "ja" || value === "en";
}

export function getDictionary(lang: Lang): Dictionary {
  return DICTS[lang];
}
