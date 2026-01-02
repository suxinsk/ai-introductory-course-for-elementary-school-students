import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Course - 探秘人工智能",
  description: "做 AI 的聪明小主人",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
