// ─── Domain types ─────────────────────────────────────────────────────────────

export type Domain = "ent" | "mental";
export type PrescriptionType = "do" | "new" | "changed";
export type DraftStatus = "draft" | "confirmed";
export type WarningSeverity = "info" | "caution" | "warning" | "critical";
export type AuditActionType = "generate" | "edit" | "confirm" | "copy" | "view";

// ─── ENT-specific fields (耳鼻科) ────────────────────────────────────────────

export type ENTSymptomCategory =
  | "鼻汁"
  | "鼻閉"
  | "くしゃみ"
  | "耳痛"
  | "咽頭痛"
  | "発熱"
  | "咳"
  | "耳閉感"
  | "難聴";

export type ENTPatientType = "adult" | "child";
export type ENTFirstVisitType = "first" | "continued" | "exacerbated";

export interface ENTFields {
  symptomCategory: ENTSymptomCategory[];
  patientType: ENTPatientType;
  seasonal: boolean;
  firstVisitLike: ENTFirstVisitType;
}

// ─── Mental-specific fields (メンタル) ───────────────────────────────────────

export type MentalChiefComplaint = "不眠" | "不安" | "気分低下" | "焦燥" | "その他";
export type MentalSleepType = "入眠困難" | "中途覚醒" | "早朝覚醒";
export type MentalTreatmentPhase = "new" | "increased" | "continued" | "tapered";

export interface MentalFields {
  chiefComplaint: MentalChiefComplaint[];
  sleepType: MentalSleepType[];
  treatmentPhase: MentalTreatmentPhase;
  daytimeSleepiness: boolean;
  interruptionHistory: boolean;
  /** Must trigger critical warning if true */
  suicidalIdeationFlag: boolean;
  /** Antidepressant activation syndrome concern */
  activationConcernFlag: boolean;
  /** Manic switch concern (bipolar risk) */
  manicSwitchConcernFlag: boolean;
}

// ─── Base intermediate JSON ───────────────────────────────────────────────────

export interface BaseIntermediateJSON {
  domain: Domain;
  freeText: string;
  prescriptionType: PrescriptionType;
  diseases: string[];
  detectedMedications: string[];
  symptoms: string[];
  labs: Record<string, string>;
  subjectiveNotes: string[];
  riskFlags: string[];
  guidancePoints: string[];
  followUpPoints: string[];
  warnings: string[];
}

export interface ENTIntermediateJSON extends BaseIntermediateJSON {
  domain: "ent";
  entFields: ENTFields;
}

export interface MentalIntermediateJSON extends BaseIntermediateJSON {
  domain: "mental";
  mentalFields: MentalFields;
}

export type IntermediateJSON = ENTIntermediateJSON | MentalIntermediateJSON;

// ─── Warning ─────────────────────────────────────────────────────────────────

export interface Warning {
  severity: WarningSeverity;
  message: string;
  ruleName?: string;
}

// ─── Draft sections (薬歴) ───────────────────────────────────────────────────

export interface DraftSections {
  /** S: 患者訴え・服薬状況・不安 */
  S: string;
  /** O: 処方内容・検査値・変更内容 */
  O: string;
  /** A: 評価・注意点 */
  A: string;
  /** Ep: 服薬指導内容 */
  Ep: string;
  /** OP: 次回確認事項 */
  OP: string;
}

// ─── API request/response types ──────────────────────────────────────────────

export interface ParseRequest {
  domain: Domain;
  freeText: string;
  prescriptionType: PrescriptionType;
  diseases: string[];
  entFields?: Partial<ENTFields>;
  mentalFields?: Partial<MentalFields>;
}

export interface ParseResponse {
  structured: IntermediateJSON;
  detectedMedications: string[];
  warnings: Warning[];
}

export interface DraftRequest {
  sessionId: string;
  structured: IntermediateJSON;
  warnings: Warning[];
}

export interface DraftResponse {
  sessionId: string;
  draftId: string;
  sections: DraftSections;
  warnings: Warning[];
}

export interface DraftUpdateRequest {
  sectionS?: string;
  sectionO?: string;
  sectionA?: string;
  sectionEp?: string;
  sectionOP?: string;
  status?: DraftStatus;
}

// ─── History list item ───────────────────────────────────────────────────────

export interface HistoryItem {
  sessionId: string;
  draftId: string;
  domain: Domain;
  diseases: string[];
  prescriptionType: PrescriptionType;
  status: DraftStatus;
  warningCount: number;
  hasCritical: boolean;
  createdAt: string;
  confirmedAt: string | null;
}

// ─── Master data types ───────────────────────────────────────────────────────

export interface MedicationGuidance {
  mainPoints: string[];
  sideEffects: string[];
  usageNotes: string[];
}

export interface MedicationWarningCondition {
  patientType?: ENTPatientType;
  prescriptionType?: PrescriptionType;
  message: string;
  severity: WarningSeverity;
}

export interface MedicationMasterData {
  name: string;
  aliases: string[];
  category: string;
  domain: Domain | "both";
  guidanceJson: MedicationGuidance;
  warningJson: MedicationWarningCondition[];
}

export interface DiseaseTemplateData {
  domain: Domain;
  diseaseName: string;
  templateJson: Partial<DraftSections>;
}

export interface WarningRuleCondition {
  field: string;
  equals?: unknown;
  contains?: unknown;
  gt?: number;
  lt?: number;
  truthy?: boolean;
}

export interface WarningRuleData {
  domain: Domain | "both";
  ruleName: string;
  conditionJson: WarningRuleCondition;
  severity: WarningSeverity;
  message: string;
}
