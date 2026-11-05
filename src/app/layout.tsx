import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL('https://yuyudao-creative-dev-lab.jammyiris5.chatgpt.site'),
  title: 'yuyudao — Creative Developer & Systems Engineer',
  description: 'アイデアを、動くシステムへ。AI、フルスタック開発、インフラ、国際化をつなぐ、日本のテクノロジストのポートフォリオ。',
  openGraph: { title: 'yuyudao — Building the Web, One Commit at a Time.', description: 'コードから、次の可能性へ。共同編集とGitのネットワークでたどるポートフォリオ。', locale: 'ja_JP', type: 'website', images: [{ url: '/og-image.svg', width: 1200, height: 630 }] },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = { themeColor: '#07090f' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body><a className="skip-link" href="#about">本文へスキップ</a>{children}</body></html>;
}
