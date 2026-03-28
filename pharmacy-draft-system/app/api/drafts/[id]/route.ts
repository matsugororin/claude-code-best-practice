import { NextRequest, NextResponse } from "next/server";
import { DraftUpdateSchema } from "@/lib/schemas";
import { sectionsToFullText } from "@/server/services/generation/draft-generator";
import { prisma } from "@/server/db";
import type { DraftSections } from "@/lib/types";

type RouteContext = { params: { id: string } };

/**
 * GET /api/drafts/:id
 * Retrieve a draft record with its session and warnings
 */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const draft = await prisma.draftRecord.findUnique({
      where: { id: params.id },
      include: { session: true },
    });

    if (!draft) {
      return NextResponse.json({ error: "下書きが見つかりません" }, { status: 404 });
    }

    // Audit: view
    await prisma.auditLog.create({
      data: {
        sessionId: draft.sessionId,
        actionType: "view",
        payloadJson: { draftId: draft.id },
      },
    });

    return NextResponse.json({
      draft: {
        id: draft.id,
        sessionId: draft.sessionId,
        sections: {
          S: draft.sectionS,
          O: draft.sectionO,
          A: draft.sectionA,
          Ep: draft.sectionEp,
          OP: draft.sectionOP,
        },
        finalText: draft.finalText,
        status: draft.status,
        confirmedAt: draft.confirmedAt,
        createdAt: draft.createdAt,
        updatedAt: draft.updatedAt,
      },
      session: {
        id: draft.session.id,
        domain: draft.session.domain,
        diseases: draft.session.diseases,
        prescriptionType: draft.session.prescriptionType,
        detectedMedications: draft.session.detectedMedications,
        warnings: draft.session.warnings,
        createdAt: draft.session.createdAt,
      },
    });
  } catch (error) {
    console.error("[GET /api/drafts/:id]", error);
    return NextResponse.json({ error: "取得中にエラーが発生しました" }, { status: 500 });
  }
}

/**
 * PATCH /api/drafts/:id
 * Edit sections or confirm a draft.
 * Immutable audit trail: every edit is logged.
 */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const body = await req.json();
    const parsed = DraftUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "更新内容が正しくありません", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const draft = await prisma.draftRecord.findUnique({ where: { id: params.id } });
    if (!draft) {
      return NextResponse.json({ error: "下書きが見つかりません" }, { status: 404 });
    }

    const { sectionS, sectionO, sectionA, sectionEp, sectionOP, status } = parsed.data;

    // Build updated sections for finalText regeneration
    const updatedSections: DraftSections = {
      S: sectionS ?? draft.sectionS,
      O: sectionO ?? draft.sectionO,
      A: sectionA ?? draft.sectionA,
      Ep: sectionEp ?? draft.sectionEp,
      OP: sectionOP ?? draft.sectionOP,
    };
    const finalText = sectionsToFullText(updatedSections);

    const updated = await prisma.draftRecord.update({
      where: { id: params.id },
      data: {
        sectionS: updatedSections.S,
        sectionO: updatedSections.O,
        sectionA: updatedSections.A,
        sectionEp: updatedSections.Ep,
        sectionOP: updatedSections.OP,
        finalText,
        ...(status ? { status } : {}),
        ...(status === "confirmed" ? { confirmedAt: new Date() } : {}),
      },
    });

    // Audit every mutation
    const actionType = status === "confirmed" ? "confirm" : "edit";
    await prisma.auditLog.create({
      data: {
        sessionId: draft.sessionId,
        actionType,
        payloadJson: {
          draftId: draft.id,
          changedFields: Object.keys(parsed.data),
          status: updated.status,
        },
      },
    });

    return NextResponse.json({ draft: updated });
  } catch (error) {
    console.error("[PATCH /api/drafts/:id]", error);
    return NextResponse.json({ error: "更新中にエラーが発生しました" }, { status: 500 });
  }
}
