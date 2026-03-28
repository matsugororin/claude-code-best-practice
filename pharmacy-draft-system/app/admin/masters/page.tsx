export const dynamic = "force-dynamic";

import { prisma } from "@/server/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

async function getMasters() {
  const [medications, diseaseTemplates, warningRules] = await Promise.all([
    prisma.medicationMaster.findMany({ where: { active: true }, orderBy: [{ domain: "asc" }, { category: "asc" }] }),
    prisma.diseaseTemplate.findMany({ where: { active: true }, orderBy: [{ domain: "asc" }] }),
    prisma.warningRule.findMany({ where: { active: true }, orderBy: [{ severity: "asc" }] }),
  ]);
  return { medications, diseaseTemplates, warningRules };
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-950 text-red-300",
  warning: "bg-orange-950 text-orange-300",
  caution: "bg-yellow-950 text-yellow-300",
  info: "bg-blue-950 text-blue-300",
};

export default async function MastersPage() {
  const { medications, diseaseTemplates, warningRules } = await getMasters();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold">マスタデータ確認</h1>
        <p className="mt-1 text-sm text-muted-foreground">社内管理用の閲覧専用画面です</p>
      </div>

      {/* Medications */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          薬剤マスタ ({medications.length}件)
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {medications.map((med) => (
            <Card key={med.id} className="p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm font-medium">{med.name}</p>
                <div className="flex gap-1 flex-shrink-0">
                  <Badge variant={med.domain === "ent" ? "default" : "secondary"} className="text-[10px]">
                    {med.domain === "ent" ? "耳鼻科" : med.domain === "mental" ? "メンタル" : "共通"}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-1.5">カテゴリ: {med.category}</p>
              <p className="text-xs text-muted-foreground">
                別名: {(med.aliases as string[]).slice(0, 3).join("、")}
                {(med.aliases as string[]).length > 3 ? "…" : ""}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Disease templates */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          疾患テンプレート ({diseaseTemplates.length}件)
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {diseaseTemplates.map((t) => (
            <Card key={t.id} className="p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium">{t.diseaseName}</p>
                <Badge variant={t.domain === "ent" ? "default" : "secondary"} className="text-[10px]">
                  {t.domain === "ent" ? "耳鼻科" : "メンタル"}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Warning rules */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          警告ルール ({warningRules.length}件)
        </h2>
        <div className="space-y-2">
          {warningRules.map((rule) => (
            <div key={rule.id} className={cn("rounded-lg border p-3", SEVERITY_COLORS[rule.severity] ?? "")}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase">{rule.severity}</span>
                <span className="text-xs text-muted-foreground">— {rule.ruleName}</span>
                <Badge variant="outline" className="text-[10px]">
                  {rule.domain === "ent" ? "耳鼻科" : rule.domain === "mental" ? "メンタル" : "共通"}
                </Badge>
              </div>
              <p className="text-xs leading-relaxed">{rule.message}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
