import type { ElementType, ReactNode } from "react";
import type { AgentName } from "./agents";
import styles from "./Block.module.css";

type Props = {
  /** ツールチップに出す 1 行の JSX（このブロックを描画しているコンポーネント） */
  jsx: string;
  /** 必ずこのエージェントが担当する */
  agent?: AgentName;
  /** できればこのエージェントが担当する */
  prefer?: AgentName;
  kind?: "block" | "headline";
  /** 組み立て前も字形をスケルトン色で見せる（LCP 要素のヒーロー名用） */
  ghost?: boolean;
  as?: ElementType;
  className?: string;
  fillClassName?: string;
  children: ReactNode;
};

/**
 * ビルド対象のブロック。サーバーで描画される実 HTML で、子は .fill 1 つだけ。
 * 状態（empty / mark / rough / done）は data-state でエンジンが切り替える。
 */
export function Block({
  jsx,
  agent,
  prefer,
  kind = "block",
  ghost,
  as: Tag = "div",
  className,
  fillClassName,
  children,
}: Props) {
  return (
    <Tag
      className={className ? `${styles.block} ${className}` : styles.block}
      data-block=""
      data-jsx={jsx}
      data-agent={agent}
      data-agent-prefer={prefer}
      data-kind={kind}
      data-ghost={ghost ? "" : undefined}
    >
      <div className={fillClassName ? `${styles.fill} ${fillClassName}` : styles.fill}>{children}</div>
    </Tag>
  );
}
