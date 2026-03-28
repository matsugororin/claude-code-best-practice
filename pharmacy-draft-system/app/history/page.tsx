import Link from "next/link";
import { prisma } from "@/server/db";
import type { Warning } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ShieldAlert, FileText, Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";

async function getHistory() {
  const sessions = await prisma.generationSession.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      drafts: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  return sessions;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function HistoryPage() {
  const sessions = await getHistory();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold">薬歴履歴一覧</h1>
        <p className="mt-1 text-sm text-muted-foreground">直近50件を表示</p>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">薬歴の生成履歴がまだありません</p>
          <Link
            href="/generate"
            className="mt-4 inline-block text-sm text-primary hover:underline"
          >
            新規生成する →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => {
            const latestDraft = session.drafts[0];
            const warnings = (session.warnings as Warning[]) ?? [];
            const hasCritical = warnings.some((w) => w.severity === "critical");
            const warningCount = warnings.length;
            const status = latestDraft?.status ?? "draft";
            const diseases = session.diseases as string[];

            return (
              <Link
                key={session.id}
                href={latestDraft ? `/result/${latestDraft.id}` : "#"}
                className="block"
              >
                <Card className={cn(
                  "p-4 transition-colors hover:border-primary/50",
                  hasCritical && "border-red-800/50"
                )}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-3 min-w-0">
                      {hasCritical && (
                        <ShieldAlert className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge variant={session.domain === "ent" ? "default" : "secondary"}>
                            {session.domain === "ent" ? "耳鼻科" : "メンタル"}
                          </Badge>
                          <Badge variant="outline">
                            {session.prescriptionType === "do"
                              ? "Do"
                              : session.prescriptionType === "new"
                                ? "新規"
                                : "変更"}
                          </Badge>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-xs font-medium",
                              status === "confirmed"
                                ? "bg-green-900/50 text-green-300"
                                : "bg-secondary text-muted-foreground"
                            )}
                          >
                            {status === "confirmed" ? "確定済み" : "下書き"}
                          </span>
                        </div>
                        <p className="text-sm text-foreground truncate">
                          {diseases.join("・") || "疾患不明"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {session.freeText.slice(0, 60)}
                          {session.freeText.length > 60 ? "…" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
                      {warningCount > 0 && (
                        <span className={cn(hasCritical ? "text-red-400" : "text-orange-400")}>
                          警告 {warningCount}件
                        </span>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(session.createdAt)}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
