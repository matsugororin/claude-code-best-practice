import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/layout/NavBar";

export const metadata: Metadata = {
  title: "薬歴下書き支援システム",
  description: "耳鼻科・メンタル特化の薬歴下書き自動生成ツール（社内試験運用版）",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="dark">
      <body className="min-h-screen bg-background antialiased">
        <NavBar />
        <main className="container mx-auto px-4 py-6 max-w-7xl">{children}</main>
        <footer className="mt-12 border-t border-border py-4 text-center text-xs text-muted-foreground">
          <p>社内試験運用版 — AI出力は必ず薬剤師が確認・修正してください。医療判断の代替ではありません。</p>
        </footer>
      </body>
    </html>
  );
}
