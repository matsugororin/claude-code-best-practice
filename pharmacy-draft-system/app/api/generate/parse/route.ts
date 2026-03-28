import { NextRequest, NextResponse } from "next/server";
import { ParseRequestSchema } from "@/lib/schemas";
import { parseToIntermediate } from "@/server/services/parsing/structured-parser";
import { generateWarnings } from "@/server/services/warning/warning-generator";
import { prisma } from "@/server/db";

/**
 * POST /api/generate/parse
 * Step 1: Parse free text into structured intermediate JSON and generate warnings.
 * Returns sessionId for use in the draft generation step.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ParseRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "入力内容が正しくありません", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const structured = parseToIntermediate(input);
    const warnings = generateWarnings(structured);

    // Persist session
    const session = await prisma.generationSession.create({
      data: {
        domain: structured.domain,
        freeText: structured.freeText,
        prescriptionType: structured.prescriptionType,
        diseases: structured.diseases,
        detectedMedications: structured.detectedMedications,
        structuredPayload: structured as object,
        warnings: warnings as object,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        sessionId: session.id,
        actionType: "generate",
        payloadJson: { step: "parse", domain: input.domain, medicationCount: structured.detectedMedications.length },
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      structured,
      detectedMedications: structured.detectedMedications,
      warnings,
    });
  } catch (error) {
    console.error("[/api/generate/parse]", error);
    return NextResponse.json({ error: "解析中にエラーが発生しました" }, { status: 500 });
  }
}
