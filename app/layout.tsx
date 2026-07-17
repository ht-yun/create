import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "折枝 · 互动叙事", template: "%s · 折枝" },
  description: "自由创作、分享并体验由选择生长出的互动故事。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
