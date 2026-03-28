import type { WarningRuleData } from "@/lib/types";

/**
 * Warning rules evaluated against structured intermediate JSON
 * Critical rules (suicidal ideation, manic switch) must always surface prominently
 */
export const WARNING_RULES: WarningRuleData[] = [
  // ─── Critical mental safety rules ─────────────────────────────────────────
  {
    domain: "mental",
    ruleName: "suicidal_ideation_flag",
    conditionJson: { field: "mentalFields.suicidalIdeationFlag", equals: true },
    severity: "critical",
    message:
      "【要注意】希死念慮・自傷念慮の可能性が示唆されています。安全確認の強化・緊急対応の準備を検討し、必要時は医師へ速やかに連絡してください。",
  },
  {
    domain: "mental",
    ruleName: "manic_switch_concern",
    conditionJson: { field: "mentalFields.manicSwitchConcernFlag", equals: true },
    severity: "critical",
    message:
      "【要注意】躁転（双極性障害へのシフト）の懸念があります。気分の高揚・活動性増加・睡眠減少等の症状変化を確認し、医師へ報告することを検討してください。",
  },
  {
    domain: "mental",
    ruleName: "activation_syndrome_risk",
    conditionJson: { field: "mentalFields.activationConcernFlag", equals: true },
    severity: "warning",
    message:
      "賦活症候群（焦燥感・不眠・衝動性の増強）のリスクに留意が必要です。抗うつ薬開始・増量後2週間は特に注意して経過を確認してください。",
  },
  {
    domain: "mental",
    ruleName: "interruption_history_followup",
    conditionJson: { field: "mentalFields.interruptionHistory", equals: true },
    severity: "warning",
    message:
      "自己中断の既往があります。服薬継続の重要性を再確認し、中断の原因（副作用・費用・効果不満等）を把握してフォローを強化してください。",
  },
  // ─── Mental treatment phase warnings ──────────────────────────────────────
  {
    domain: "mental",
    ruleName: "new_antidepressant_guidance",
    conditionJson: { field: "mentalFields.treatmentPhase", equals: "new" },
    severity: "warning",
    message:
      "抗うつ薬の新規開始です。効果発現まで2〜4週間かかること、初期副作用の可能性、自己中断を避けることを必ず説明してください。",
  },
  {
    domain: "mental",
    ruleName: "increased_dose_guidance",
    conditionJson: { field: "mentalFields.treatmentPhase", equals: "increased" },
    severity: "caution",
    message: "増量時です。賦活症候群・副作用の変化に注意し、患者への確認を強化してください。",
  },
  {
    domain: "mental",
    ruleName: "tapered_dose_guidance",
    conditionJson: { field: "mentalFields.treatmentPhase", equals: "tapered" },
    severity: "caution",
    message:
      "減量中です。中断症候群の症状（めまい・しびれ・インフルエンザ様症状）が出た場合は服用を中止せず受診するよう案内してください。",
  },
  {
    domain: "mental",
    ruleName: "daytime_sleepiness_check",
    conditionJson: { field: "mentalFields.daytimeSleepiness", equals: true },
    severity: "caution",
    message:
      "日中の眠気が報告されています。睡眠薬・抗不安薬の種類・用量の適切性を確認し、転倒・運転リスクについて説明してください。",
  },
  // ─── ENT rules ────────────────────────────────────────────────────────────
  {
    domain: "ent",
    ruleName: "child_patient_guidance",
    conditionJson: { field: "entFields.patientType", equals: "child" },
    severity: "info",
    message:
      "小児患者です。保護者向けの表現で服薬指導を行い、用量・用法・保管方法を丁寧に説明してください。",
  },
  {
    domain: "ent",
    ruleName: "antibiotic_adherence",
    conditionJson: { field: "detectedMedications", contains: "antibiotic" },
    severity: "caution",
    message:
      "抗菌薬が含まれています。症状が改善しても飲み切ること、自己中断しないことを必ず説明してください。",
  },
  {
    domain: "ent",
    ruleName: "exacerbated_visit",
    conditionJson: { field: "entFields.firstVisitLike", equals: "exacerbated" },
    severity: "caution",
    message:
      "症状増悪の来院です。前回との変化点を確認し、治療方針変更の背景について患者へ丁寧に説明してください。",
  },
  // ─── Cross-domain rules ───────────────────────────────────────────────────
  {
    domain: "both",
    ruleName: "changed_prescription_followup",
    conditionJson: { field: "prescriptionType", equals: "changed" },
    severity: "info",
    message: "処方変更があります。変更内容（薬剤・用量）と変更理由を患者へ説明し、前回との違いを確認してください。",
  },
  {
    domain: "both",
    ruleName: "new_prescription_counseling",
    conditionJson: { field: "prescriptionType", equals: "new" },
    severity: "info",
    message: "新規処方です。初めての服用であることを確認し、用法・用量・保管方法・副作用について丁寧に説明してください。",
  },
];
