import type { ENTIntermediateJSON, DraftSections, Warning } from "@/lib/types";
import { getMedicationMasters } from "../extraction/medication-extractor";
import type { MedicationMasterData } from "@/lib/types";

/**
 * Builds the ENT [S] section — patient's subjective report
 */
function buildSectionS(payload: ENTIntermediateJSON): string {
  const { diseases, symptoms, subjectiveNotes, entFields, prescriptionType } = payload;

  const diseaseStr = diseases.join("・") || "耳鼻科疾患";
  const symptomStr = symptoms.length > 0 ? symptoms.join("、") : "訴えあり";

  let patientTypeStr = "";
  if (entFields.patientType === "child") {
    patientTypeStr = "（小児）保護者より、";
  }

  const seasonalNote = entFields.seasonal ? "季節性アレルギーの季節に一致している。" : "";
  const visitNote =
    entFields.firstVisitLike === "first"
      ? "今回初回来局。"
      : entFields.firstVisitLike === "exacerbated"
        ? "前回より症状が増悪している旨の訴えあり。"
        : "";

  const prescriptionNote =
    prescriptionType === "new"
      ? "今回新規処方。"
      : prescriptionType === "changed"
        ? "今回処方変更あり。"
        : "継続処方にて来局。";

  const subjectiveStr =
    subjectiveNotes.length > 0 ? `患者より「${subjectiveNotes.slice(0, 2).join("」「")}」との訴えあり。` : "";

  return [
    `${patientTypeStr}${diseaseStr}にて来局。${symptomStr}の訴えあり。`,
    seasonalNote,
    visitNote,
    prescriptionNote,
    subjectiveStr,
  ]
    .filter(Boolean)
    .join("");
}

/**
 * Builds the ENT [O] section — objective findings and prescription content
 */
function buildSectionO(payload: ENTIntermediateJSON): string {
  const { detectedMedications, prescriptionType, labs } = payload;

  const medStr =
    detectedMedications.length > 0
      ? detectedMedications.join("、")
      : "（処方内容は処方箋にて確認）";

  const prescTypeStr = {
    do: "Do処方（前回と同内容）",
    new: "新規処方",
    changed: "処方変更あり",
  }[prescriptionType];

  const labStr =
    Object.keys(labs).length > 0
      ? `検査値：${Object.entries(labs)
          .map(([k, v]) => `${k} ${v}`)
          .join("、")}。`
      : "";

  return `${prescTypeStr}。処方内容：${medStr}。${labStr}`.trimEnd();
}

/**
 * Builds the ENT [A] section — assessment and notes
 */
function buildSectionA(
  payload: ENTIntermediateJSON,
  warnings: Warning[],
  masters: MedicationMasterData[]
): string {
  const { diseases, entFields } = payload;

  const diseaseStr = diseases.join("・") || "耳鼻科疾患";
  const cautionNotes: string[] = [];

  // Child-specific note
  if (entFields.patientType === "child") {
    cautionNotes.push("小児患者のため保護者への説明を重視した");
  }

  // Category-specific assessment notes
  for (const master of masters) {
    if (master.category === "antihistamine") {
      cautionNotes.push("抗ヒスタミン薬：眠気・口渇・運転への影響に留意が必要");
    }
    if (master.category === "antibiotic") {
      cautionNotes.push("抗菌薬：服用完遂の重要性、中断防止に留意が必要");
    }
    if (master.category === "nasal_steroid") {
      cautionNotes.push("点鼻ステロイド：即効性がないことへの誤解防止、継続使用の指導が重要");
    }
  }

  // Warning-derived notes
  const cautionWarnings = warnings
    .filter((w) => w.severity === "caution" || w.severity === "warning")
    .slice(0, 2);

  const warningNoteStr =
    cautionWarnings.length > 0
      ? `注意事項：${cautionWarnings.map((w) => w.message).join("；")}。`
      : "";

  const cautionStr = cautionNotes.length > 0 ? `${cautionNotes.join("。")}。` : "";

  return `${diseaseStr}に対する治療として適切と考えられる。${cautionStr}${warningNoteStr}`.trimEnd();
}

/**
 * Builds the ENT [Ep] section — medication counseling content
 */
function buildSectionEp(
  payload: ENTIntermediateJSON,
  masters: MedicationMasterData[]
): string {
  const { entFields } = payload;
  const isChild = entFields.patientType === "child";
  const addressee = isChild ? "保護者へ" : "患者へ";
  const parts: string[] = [];

  for (const master of masters) {
    const guidance = master.guidanceJson as {
      mainPoints: string[];
      sideEffects: string[];
      usageNotes: string[];
    };

    const allPoints = [
      ...guidance.mainPoints,
      ...guidance.sideEffects.slice(0, 2),
      ...guidance.usageNotes.slice(0, 1),
    ];

    if (allPoints.length > 0) {
      parts.push(`【${master.name}】${addressee}、${allPoints.slice(0, 3).join("。")}。`);
    }
  }

  // Fallback if no medications detected
  if (parts.length === 0) {
    parts.push(
      `${addressee}、処方薬の用法・用量・保管方法について説明した。副作用が出た場合は受診するよう案内した。`
    );
  }

  // Child-specific addition
  if (isChild) {
    parts.push("保護者へ薬の保管（子どもの手の届かない場所）について説明した。");
  }

  return parts.join("\n");
}

/**
 * Builds the ENT [OP] section — follow-up points
 */
function buildSectionOP(
  payload: ENTIntermediateJSON,
  masters: MedicationMasterData[]
): string {
  const points: string[] = ["次回来局時に症状の改善状況・副作用の有無を確認する予定とした。"];

  const hasAntibiotic = masters.some((m) => m.category === "antibiotic");
  if (hasAntibiotic) {
    points.push("抗菌薬の服用完遂について確認する予定とした。症状改善がなければ早期受診を勧めた。");
  }

  if (payload.entFields.firstVisitLike === "exacerbated") {
    points.push("増悪の原因・治療効果について次回詳細に確認する予定とした。");
  }

  if (payload.entFields.patientType === "child") {
    points.push("保護者より服薬状況の報告を受ける予定とした。");
  }

  return points.join("\n");
}

/**
 * ENT domain draft generator.
 * Generates all 5 SOAP sections from structured ENT data.
 */
export function generateENTDraft(
  payload: ENTIntermediateJSON,
  warnings: Warning[]
): DraftSections {
  const masters = getMedicationMasters(payload.detectedMedications);

  return {
    S: buildSectionS(payload),
    O: buildSectionO(payload),
    A: buildSectionA(payload, warnings, masters),
    Ep: buildSectionEp(payload, masters),
    OP: buildSectionOP(payload, masters),
  };
}
