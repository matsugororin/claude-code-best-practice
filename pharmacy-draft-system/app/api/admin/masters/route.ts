export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";

/**
 * GET /api/admin/masters
 * Read-only view of all master data tables (medications, disease templates, warning rules).
 * Internal tool only — no auth in MVP.
 */
export async function GET(_req: NextRequest) {
  try {
    const [medications, diseaseTemplates, warningRules] = await Promise.all([
      prisma.medicationMaster.findMany({
        where: { active: true },
        orderBy: [{ domain: "asc" }, { category: "asc" }, { name: "asc" }],
      }),
      prisma.diseaseTemplate.findMany({
        where: { active: true },
        orderBy: [{ domain: "asc" }, { diseaseName: "asc" }],
      }),
      prisma.warningRule.findMany({
        where: { active: true },
        orderBy: [{ domain: "asc" }, { severity: "asc" }, { ruleName: "asc" }],
      }),
    ]);

    return NextResponse.json({ medications, diseaseTemplates, warningRules });
  } catch (error) {
    console.error("[GET /api/admin/masters]", error);
    return NextResponse.json({ error: "マスタデータの取得中にエラーが発生しました" }, { status: 500 });
  }
}
