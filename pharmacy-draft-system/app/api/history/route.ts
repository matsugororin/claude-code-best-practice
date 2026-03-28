import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import type { HistoryItem, Warning } from "@/lib/types";

/**
 * GET /api/history
 * Returns recent generation sessions with draft status summary.
 * Query params: limit (default 20), offset (default 0), domain (optional filter)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);
    const offset = Number(searchParams.get("offset") ?? 0);
    const domain = searchParams.get("domain");

    const sessions = await prisma.generationSession.findMany({
      where: domain ? { domain } : undefined,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        drafts: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const items: HistoryItem[] = sessions.map((session) => {
      const latestDraft = session.drafts[0];
      const warnings = (session.warnings as unknown as Warning[]) ?? [];
      return {
        sessionId: session.id,
        draftId: latestDraft?.id ?? "",
        domain: session.domain as "ent" | "mental",
        diseases: session.diseases as string[],
        prescriptionType: session.prescriptionType as "do" | "new" | "changed",
        status: (latestDraft?.status ?? "draft") as "draft" | "confirmed",
        warningCount: warnings.length,
        hasCritical: warnings.some((w) => w.severity === "critical"),
        createdAt: session.createdAt.toISOString(),
        confirmedAt: latestDraft?.confirmedAt?.toISOString() ?? null,
      };
    });

    const total = await prisma.generationSession.count({
      where: domain ? { domain } : undefined,
    });

    return NextResponse.json({ items, total, limit, offset });
  } catch (error) {
    console.error("[GET /api/history]", error);
    return NextResponse.json({ error: "履歴の取得中にエラーが発生しました" }, { status: 500 });
  }
}
