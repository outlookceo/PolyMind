import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "PolyMind - Multi AI Thinking Space",
  description:
    "Create a thinking space where multiple AI agents discuss, challenge, and summarize ideas together."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body>{children}</body>
    </html>
  );
}
