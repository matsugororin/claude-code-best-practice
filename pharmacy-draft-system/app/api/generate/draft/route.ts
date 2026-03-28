import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { IntermediateJSONSchema, WarningSchema } from "@/lib/schemas";
import { generateDraft, sectionsToFullText } from "@/server/services/generation/draft-generator";
import { prisma } from "@/server/db";

const DraftRequestSchema = z.object({
  sessionId: z.string().cuid(),
  structured: IntermediateJSONSchema,
  warnings: z.array(WarningSchema),
});

/**
 * POST /api/generate/draft
 * Step 2: Generate SOAP sections from structured intermediate JSON.
 * Persists draft record to DB.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = DraftRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "リクエスト内容が正しくありません", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { sessionId, structured, warnings } = parsed.data;

    // Verify session exists
    const session = await prisma.generationSession.findUnique({ where: { id: sessionId } });
    if (!session) {
      return NextResponse.json({ error: "セッションが見つかりません" }, { status: 404 });
    }

    // Generate draft sections
    const sections = generateDraft(structured, warnings);
    const finalText = sectionsToFullText(sections);

    // Persist draft
    const draft = await prisma.draftRecord.create({
      data: {
        sessionId,
        sectionS: sections.S,
        sectionO: sections.O,
        sectionA: sections.A,
        sectionEp: sections.Ep,
        sectionOP: sections.OP,
        finalText,
        status: "draft",
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        sessionId,
        actionType: "generate",
        payloadJson: {
          step: "draft",
          draftId: draft.id,
          warningCount: warnings.length,
          hasCritical: warnings.some((w) => w.severity === "critical"),
        },
      },
    });

    return NextResponse.json({
      sessionId,
      draftId: draft.id,
      sections,
      warnings,
    });
  } catch (error) {
    console.error("[/api/generate/draft]", error);
    return NextResponse.json({ error: "下書き生成中にエラーが発生しました" }, { status: 500 });
  }
}
