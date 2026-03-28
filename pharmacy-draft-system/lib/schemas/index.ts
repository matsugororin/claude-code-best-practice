import { z } from "zod";

// ─── Base enums ───────────────────────────────────────────────────────────────

export const DomainSchema = z.enum(["ent", "mental"]);
export const PrescriptionTypeSchema = z.enum(["do", "new", "changed"]);
export const DraftStatusSchema = z.enum(["draft", "confirmed"]);
export const WarningSeveritySchema = z.enum(["info", "caution", "warning", "critical"]);

// ─── ENT fields ───────────────────────────────────────────────────────────────

export const ENTSymptomCategorySchema = z.enum([
  "鼻汁",
  "鼻閉",
  "くしゃみ",
  "耳痛",
  "咽頭痛",
  "発熱",
  "咳",
  "耳閉感",
  "難聴",
]);

export const ENTPatientTypeSchema = z.enum(["adult", "child"]);
export const ENTFirstVisitTypeSchema = z.enum(["first", "continued", "exacerbated"]);

export const ENTFieldsSchema = z.object({
  symptomCategory: z.array(ENTSymptomCategorySchema),
  patientType: ENTPatientTypeSchema,
  seasonal: z.boolean(),
  firstVisitLike: ENTFirstVisitTypeSchema,
});

// ─── Mental fields ────────────────────────────────────────────────────────────

export const MentalChiefComplaintSchema = z.enum([
  "不眠",
  "不安",
  "気分低下",
  "焦燥",
  "その他",
]);

export const MentalSleepTypeSchema = z.enum(["入眠困難", "中途覚醒", "早朝覚醒"]);
export const MentalTreatmentPhaseSchema = z.enum(["new", "increased", "continued", "tapered"]);

export const MentalFieldsSchema = z.object({
  chiefComplaint: z.array(MentalChiefComplaintSchema),
  sleepType: z.array(MentalSleepTypeSchema),
  treatmentPhase: MentalTreatmentPhaseSchema,
  daytimeSleepiness: z.boolean(),
  interruptionHistory: z.boolean(),
  suicidalIdeationFlag: z.boolean(),
  activationConcernFlag: z.boolean(),
  manicSwitchConcernFlag: z.boolean(),
});

// ─── Intermediate JSON (the structured representation of parsed input) ────────

const BaseIntermediateSchema = z.object({
  freeText: z.string().min(1, "自由記述は必須です"),
  prescriptionType: PrescriptionTypeSchema,
  diseases: z.array(z.string()),
  detectedMedications: z.array(z.string()),
  symptoms: z.array(z.string()),
  labs: z.record(z.string(), z.string()),
  subjectiveNotes: z.array(z.string()),
  riskFlags: z.array(z.string()),
  guidancePoints: z.array(z.string()),
  followUpPoints: z.array(z.string()),
  warnings: z.array(z.string()),
});

export const ENTIntermediateSchema = BaseIntermediateSchema.extend({
  domain: z.literal("ent"),
  entFields: ENTFieldsSchema,
});

export const MentalIntermediateSchema = BaseIntermediateSchema.extend({
  domain: z.literal("mental"),
  mentalFields: MentalFieldsSchema,
});

export const IntermediateJSONSchema = z.discriminatedUnion("domain", [
  ENTIntermediateSchema,
  MentalIntermediateSchema,
]);

// ─── Warning ──────────────────────────────────────────────────────────────────

export const WarningSchema = z.object({
  severity: WarningSeveritySchema,
  message: z.string(),
  ruleName: z.string().optional(),
});

// ─── Draft sections ───────────────────────────────────────────────────────────

export const DraftSectionsSchema = z.object({
  S: z.string(),
  O: z.string(),
  A: z.string(),
  Ep: z.string(),
  OP: z.string(),
});

// ─── API request schemas ──────────────────────────────────────────────────────

export const ParseRequestSchema = z.object({
  domain: DomainSchema,
  freeText: z.string().min(1, "自由記述は必須です").max(2000, "自由記述は2000文字以内にしてください"),
  prescriptionType: PrescriptionTypeSchema,
  diseases: z.array(z.string()).min(1, "疾患を1つ以上選択してください"),
  entFields: ENTFieldsSchema.partial().optional(),
  mentalFields: MentalFieldsSchema.partial().optional(),
});

export const DraftRequestSchema = z.object({
  sessionId: z.string().cuid(),
  structured: IntermediateJSONSchema,
  warnings: z.array(WarningSchema),
});

export const DraftUpdateSchema = z.object({
  sectionS: z.string().optional(),
  sectionO: z.string().optional(),
  sectionA: z.string().optional(),
  sectionEp: z.string().optional(),
  sectionOP: z.string().optional(),
  status: DraftStatusSchema.optional(),
});

// ─── Type exports (inferred from schemas) ────────────────────────────────────

export type ParseRequestInput = z.infer<typeof ParseRequestSchema>;
export type DraftUpdateInput = z.infer<typeof DraftUpdateSchema>;
