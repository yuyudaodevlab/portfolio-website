import styles from "./TypedHeadline.module.css";

type Props = {
  text: string;
  /** 打ち終わったら Archivo の width 軸をバネで伸ばす */
  stretch?: boolean;
  className?: string;
};

/**
 * オーバーレイ型のタイピング見出し。
 * 本文（data-full）は最初から全文が DOM にあり、組み立て中だけ透明になる。
 * エンジンは絶対配置のオーバーレイ（data-over）に「打った文字・キャレット・透明な残り」を並べるので、
 * 折り返し位置は本文と同じになり、レイアウトは一切動かない。
 */
export function TypedHeadline({ text, stretch, className }: Props) {
  return (
    <span
      className={className ? `${styles.typed} ${className}` : styles.typed}
      data-typed=""
      data-stretch={stretch ? "" : undefined}
    >
      <span className={styles.full} data-full="">
        {text}
      </span>
      <span className={styles.over} data-over="" aria-hidden="true" />
    </span>
  );
}
