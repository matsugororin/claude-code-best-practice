"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { FileText, History, Settings, PlusCircle } from "lucide-react";

const NAV_ITEMS = [
  { href: "/generate", label: "新規生成", icon: PlusCircle },
  { href: "/history", label: "履歴", icon: History },
  { href: "/admin/masters", label: "マスタ確認", icon: Settings },
] as const;

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex h-14 items-center justify-between">
          <Link href="/generate" className="flex items-center gap-2 font-semibold text-primary">
            <FileText className="h-5 w-5" />
            <span className="text-sm leading-tight">
              薬歴下書き<br />
              <span className="text-[10px] text-muted-foreground font-normal">耳鼻科・メンタル</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                  pathname.startsWith(href)
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
