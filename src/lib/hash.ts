/** 文字列から決定的な 7 桁のコミットハッシュ風の文字列を作る（FNV-1a）。 */
export function shortHash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  let h2 = h ^ 0x5bd1e995;
  h2 = Math.imul(h2 ^ (h2 >>> 15), 0x2c1b3c6d);
  const hex = ((h >>> 0).toString(16) + (h2 >>> 0).toString(16)).padStart(16, "0");
  return hex.slice(0, 7);
}
