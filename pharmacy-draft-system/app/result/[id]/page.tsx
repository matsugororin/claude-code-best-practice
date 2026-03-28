import { notFound } from "next/navigation";
import { DraftViewer } from "@/features/result/components/DraftViewer";
import type { DraftSections, Warning, Domain } from "@/lib/types";

interface Props {
  params: { id: string };
}

async function getDraft(id: string) {
  // Server-side data fetch — directly call Prisma (avoids HTTP round-trip)
  const { prisma } = await import("@/server/db");

  const draft = await prisma.draftRecord.findUnique({
    where: { id },
    include: { session: true },
  });

  return draft;
}

export default async function ResultPage({ params }: Props) {
  const draft = await getDraft(params.id);

  if (!draft) {
    notFound();
  }

  const warnings = (draft.session.warnings as unknown as Warning[]) ?? [];

  const sections: DraftSections = {
    S: draft.sectionS,
    O: draft.sectionO,
    A: draft.sectionA,
    Ep: draft.sectionEp,
    OP: draft.sectionOP,
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-foreground">薬歴下書き</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          各セクションを確認・編集し、問題なければ「確定保存」してください
        </p>
      </div>
      <DraftViewer
        draftId={draft.id}
        initialSections={sections}
        warnings={warnings}
        domain={draft.session.domain as Domain}
        diseases={draft.session.diseases as string[]}
        prescriptionType={draft.session.prescriptionType}
        status={draft.status as "draft" | "confirmed"}
      />
    </div>
  );
}
