import type { MentalIntermediateJSON, DraftSections, Warning } from "@/lib/types";
import { getMedicationMasters } from "../extraction/medication-extractor";
import type { MedicationMasterData } from "@/lib/types";

/**
 * Builds the Mental [S] section
 * Safety-first: does not fabricate clinical history not present in input
 */
function buildSectionS(payload: MentalIntermediateJSON): string {
  const { diseases, symptoms, subjectiveNotes, mentalFields, prescriptionType } = payload;

  const diseaseStr = diseases.join("・") || "精神科・心療内科疾患";

  const chiefStr =
    mentalFields.chiefComplaint.length > 0
      ? mentalFields.chiefComplaint.join("、") + "の訴えあり"
      : symptoms.length > 0
        ? symptoms.join("、") + "の訴えあり"
        : "訴えあり";

  const sleepNote =
    mentalFields.sleepType.length > 0
      ? `不眠のタイプ：${mentalFields.sleepType.join("・")}。`
      : "";

  const prescriptionNote =
    prescriptionType === "new"
      ? "今回新規処方。"
      : prescriptionType === "changed"
        ? "今回処方変更あり。"
        : "継続処方にて来局。";

  const interruptionNote = mentalFields.interruptionHistory
    ? "自己中断の既往あり。"
    : "";

  const subjectiveStr =
    subjectiveNotes.length > 0
      ? `患者より「${subjectiveNotes.slice(0, 2).join("」「")}」との訴えあり。`
      : "";

  return [
    `${diseaseStr}にて来局。${chiefStr}。`,
    sleepNote,
    prescriptionNote,
    interruptionNote,
    subjectiveStr,
  ]
    .filter(Boolean)
    .join("");
}

/**
 * Builds the Mental [O] section
 */
function buildSectionO(payload: MentalIntermediateJSON): string {
  const { detectedMedications, prescriptionType, labs, mentalFields } = payload;

  const medStr =
    detectedMedications.length > 0
      ? detectedMedications.join("、")
      : "（処方内容は処方箋にて確認）";

  const prescTypeStr = {
    do: "Do処方（前回と同内容）",
    new: "新規処方",
    changed: "処方変更あり",
  }[prescriptionType];

  const phaseStr = {
    new: "新規導入",
    increased: "増量",
    continued: "継続",
    tapered: "減量中",
  }[mentalFields.treatmentPhase];

  const labStr =
    Object.keys(labs).length > 0
      ? `検査値：${Object.entries(labs)
          .map(([k, v]) => `${k} ${v}`)
          .join("、")}。`
      : "";

  return `${prescTypeStr}（${phaseStr}）。処方内容：${medStr}。${labStr}`.trimEnd();
}

/**
 * Builds the Mental [A] section — safety-first assessment
 * Avoids diagnostic assertions; focuses on observable and disclosed information
 */
function buildSectionA(
  payload: MentalIntermediateJSON,
  warnings: Warning[],
  masters: MedicationMasterData[]
): string {
  const { diseases, mentalFields, riskFlags } = payload;
  const diseaseStr = diseases.join("・") || "精神科・心療内科疾患";
  const cautionNotes: string[] = [];

  // Treatment phase notes
  if (mentalFields.treatmentPhase === "new") {
    cautionNotes.push("新規投与のため効果発現まで数週間かかることに留意が必要");
  }
  if (mentalFields.treatmentPhase === "increased") {
    cautionNotes.push("増量時のため賦活症候群・副作用の変化に注意が必要");
  }
  if (mentalFields.treatmentPhase === "tapered") {
    cautionNotes.push("減量中のため中断症候群の症状出現に留意が必要");
  }

  // Category-based notes
  const hasSSRI = masters.some((m) => m.category === "ssri");
  const hasSNRI = masters.some((m) => m.category === "snri");
  const hasBenzo = masters.some(
    (m) => m.category === "benzodiazepine" || m.category === "non_benzo_hypnotic"
  );

  if ((hasSSRI || hasSNRI) && mentalFields.treatmentPhase !== "continued") {
    cautionNotes.push("抗うつ薬の効果発現・副作用出現を経過観察中");
  }
  if (hasBenzo) {
    cautionNotes.push("依存・離脱リスクのある薬剤が含まれており、継続的な評価が必要");
  }

  // Risk flags from input
  if (riskFlags.length > 0) {
    cautionNotes.push(`リスク事項（${riskFlags.join("・")}）について確認・対応が必要`);
  }

  if (mentalFields.daytimeSleepiness) {
    cautionNotes.push("日中の眠気が報告されており転倒・事故リスクに留意が必要");
  }
  if (mentalFields.interruptionHistory) {
    cautionNotes.push("自己中断歴があるため服薬継続支援を強化する必要がある");
  }

  // Critical warnings always appear in A section
  const criticalWarnings = warnings.filter((w) => w.severity === "critical");
  const criticalStr =
    criticalWarnings.length > 0
      ? `【重要事項】${criticalWarnings.map((w) => w.message).join("；")}。`
      : "";

  const cautionStr = cautionNotes.length > 0 ? `${cautionNotes.join("。")}。` : "";

  return `${diseaseStr}に対する薬物療法として適切と考えられる。${cautionStr}${criticalStr}`.trimEnd();
}

/**
 * Builds the Mental [Ep] section — medication counseling
 * Safety: guidance content comes only from verified master data, not generated text
 */
function buildSectionEp(
  payload: MentalIntermediateJSON,
  masters: MedicationMasterData[]
): string {
  const { mentalFields } = payload;
  const parts: string[] = [];

  for (const master of masters) {
    const guidance = master.guidanceJson as {
      mainPoints: string[];
      sideEffects: string[];
      usageNotes: string[];
    };

    // Select points based on treatment phase
    const points = [...guidance.mainPoints];
    if (mentalFields.treatmentPhase === "new" || mentalFields.treatmentPhase === "increased") {
      points.push(...guidance.sideEffects.slice(0, 2));
    }
    points.push(...guidance.usageNotes.slice(0, 1));

    if (points.length > 0) {
      parts.push(`【${master.name}】患者へ、${points.slice(0, 4).join("。")}。`);
    }
  }

  // Fallback
  if (parts.length === 0) {
    parts.push("患者へ処方薬の用法・用量・副作用について説明した。気になる症状は必ず医師・薬剤師へ相談するよう案内した。");
  }

  // Safety flags always get explicit counseling
  if (mentalFields.suicidalIdeationFlag) {
    parts.push(
      "【安全確認】希死念慮・自傷念慮に関して、症状が強まった場合は医療機関・相談窓口へ速やかに連絡するよう案内した。"
    );
  }
  if (mentalFields.interruptionHistory) {
    parts.push(
      "自己中断の既往があるため、服薬継続の重要性を改めて説明した。中断したい場合は必ず医師へ相談するよう案内した。"
    );
  }
  if (mentalFields.manicSwitchConcernFlag) {
    parts.push(
      "気分の急な高揚・睡眠減少・多弁・活動性の急激な増加がみられた場合は受診するよう案内した。"
    );
  }

  return parts.join("\n");
}

/**
 * Builds the Mental [OP] section — follow-up items
 */
function buildSectionOP(
  payload: MentalIntermediateJSON,
  masters: MedicationMasterData[]
): string {
  const { mentalFields } = payload;
  const points: string[] = [];

  // Core follow-up
  points.push("次回来局時に気分・睡眠・食欲・副作用の有無について確認する予定とした。");

  // Phase-specific follow-up
  if (mentalFields.treatmentPhase === "new") {
    points.push("新規薬剤の効果発現・初期副作用（特に賦活症候群）について次回確認する予定とした。");
  }
  if (mentalFields.treatmentPhase === "increased") {
    points.push("増量後の効果変化・副作用の出現について次回確認する予定とした。");
  }
  if (mentalFields.treatmentPhase === "tapered") {
    points.push("減量に伴う離脱症状の有無・気分の変化について次回確認する予定とした。");
  }

  // Safety flags follow-up
  if (mentalFields.suicidalIdeationFlag) {
    points.push(
      "【要確認】希死念慮に関して次回も必ず確認する予定とした。症状の変化があれば速やかに医師へ連絡する体制を確認した。"
    );
  }
  if (mentalFields.interruptionHistory) {
    points.push("服薬継続状況・中断の有無を次回確認する予定とした。");
  }
  if (mentalFields.daytimeSleepiness) {
    points.push("日中の眠気の改善状況・転倒の有無を次回確認する予定とした。");
  }

  // Benzodiazepine long-term check
  const hasBenzo = masters.some(
    (m) => m.category === "benzodiazepine" || m.category === "non_benzo_hypnotic"
  );
  if (hasBenzo) {
    points.push("依存性リスクのある薬剤の継続必要性について次回医師との確認を促す予定とした。");
  }

  return points.join("\n");
}

/**
 * Mental health domain draft generator.
 * Safety is the primary design principle — no fabrication, no diagnostic assertions.
 */
export function generateMentalDraft(
  payload: MentalIntermediateJSON,
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
