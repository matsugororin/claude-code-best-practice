import type {
  ParseRequest,
  IntermediateJSON,
  ENTIntermediateJSON,
  MentalIntermediateJSON,
  ENTFields,
  MentalFields,
} from "@/lib/types";
import { extractMedicationNames } from "../extraction/medication-extractor";

/**
 * Extracts symptom keywords from free text.
 * Rule-based — does not invent symptoms not present in input.
 */
function extractSymptoms(freeText: string, domain: "ent" | "mental"): string[] {
  const symptoms: string[] = [];

  if (domain === "ent") {
    const ENT_SYMPTOM_KEYWORDS = [
      "鼻汁", "鼻水", "鼻づまり", "鼻閉", "くしゃみ", "耳痛", "耳が痛い",
      "咽頭痛", "喉が痛い", "喉の痛み", "発熱", "熱", "咳", "耳閉感",
      "難聴", "聞こえにくい", "耳鳴り", "副鼻腔炎", "花粉",
    ];
    for (const kw of ENT_SYMPTOM_KEYWORDS) {
      if (freeText.includes(kw) && !symptoms.includes(kw)) {
        symptoms.push(kw);
      }
    }
  } else {
    const MENTAL_SYMPTOM_KEYWORDS = [
      "眠れない", "不眠", "途中で目が覚める", "早く目が覚める", "中途覚醒",
      "早朝覚醒", "入眠困難", "気分が落ち込む", "気分が重い", "気力がない",
      "やる気が出ない", "不安", "焦燥", "焦り", "動悸", "倦怠感", "疲れやすい",
      "食欲がない", "食欲低下", "集中力低下", "涙が出る", "死にたい", "消えたい",
    ];
    for (const kw of MENTAL_SYMPTOM_KEYWORDS) {
      if (freeText.includes(kw) && !symptoms.includes(kw)) {
        symptoms.push(kw);
      }
    }
  }

  return symptoms;
}

/**
 * Extracts subjective notes — patient's own statements about medication/condition.
 * Conservative: only extracts clearly stated phrases, never fabricates.
 */
function extractSubjectiveNotes(freeText: string): string[] {
  const notes: string[] = [];

  // Pattern: "〜と言っている", "〜とのこと", "〜の訴え"
  const SUBJECTIVE_PATTERNS = [
    /「([^」]{1,80})」/g,  // quoted speech
    /([^。\n]{4,60})(と言っている|とのこと|との訴え|と話している)/g,
  ];

  for (const pattern of SUBJECTIVE_PATTERNS) {
    const matches = freeText.matchAll(pattern);
    for (const match of matches) {
      const note = match[1]?.trim();
      if (note && !notes.includes(note)) {
        notes.push(note);
      }
    }
  }

  return notes;
}

/**
 * Extract lab values if mentioned (e.g., "CRP 0.5", "好酸球 8%")
 * Conservative: only extracts numeric values paired with known lab names
 */
function extractLabs(freeText: string): Record<string, string> {
  const labs: Record<string, string> = {};
  const LAB_KEYWORDS = [
    "CRP", "WBC", "好酸球", "IgE", "血圧", "体温", "SpO2",
    "ALT", "AST", "BUN", "Cr", "Hb",
  ];

  for (const lab of LAB_KEYWORDS) {
    const match = freeText.match(new RegExp(`${lab}[\\s:：]*([\\d.]+)\\s*(%|mg\\/dL|μg\\/dL|U\\/L|mmHg|℃|IU\\/mL)?`));
    if (match) {
      labs[lab] = match[1] + (match[2] ?? "");
    }
  }

  return labs;
}

/**
 * Build default ENT fields from request, with safe defaults
 */
function buildENTFields(req: ParseRequest): ENTFields {
  const base = req.entFields ?? {};
  return {
    symptomCategory: base.symptomCategory ?? [],
    patientType: base.patientType ?? "adult",
    seasonal: base.seasonal ?? false,
    firstVisitLike: base.firstVisitLike ?? "continued",
  };
}

/**
 * Build default Mental fields from request, with safe defaults.
 * Critical safety flags default to false — must be explicitly set.
 */
function buildMentalFields(req: ParseRequest): MentalFields {
  const base = req.mentalFields ?? {};
  return {
    chiefComplaint: base.chiefComplaint ?? [],
    sleepType: base.sleepType ?? [],
    treatmentPhase: base.treatmentPhase ?? "continued",
    daytimeSleepiness: base.daytimeSleepiness ?? false,
    interruptionHistory: base.interruptionHistory ?? false,
    // Safety flags: never default to true — must be explicitly declared
    suicidalIdeationFlag: base.suicidalIdeationFlag ?? false,
    activationConcernFlag: base.activationConcernFlag ?? false,
    manicSwitchConcernFlag: base.manicSwitchConcernFlag ?? false,
  };
}

/**
 * Main structured parser.
 * Converts raw ParseRequest → IntermediateJSON.
 *
 * Key principle: only represents information PRESENT in the input.
 * Never infers diagnoses, lab values, or history that wasn't provided.
 */
export function parseToIntermediate(req: ParseRequest): IntermediateJSON {
  const { domain, freeText, prescriptionType, diseases } = req;

  const detectedMedications = extractMedicationNames(freeText, domain);
  const symptoms = extractSymptoms(freeText, domain);
  const subjectiveNotes = extractSubjectiveNotes(freeText);
  const labs = extractLabs(freeText);

  const base = {
    freeText,
    prescriptionType,
    diseases,
    detectedMedications,
    symptoms,
    labs,
    subjectiveNotes,
    riskFlags: [],      // populated by warning generator
    guidancePoints: [], // populated by section generator
    followUpPoints: [], // populated by section generator
    warnings: [],       // populated by warning generator
  };

  if (domain === "ent") {
    const result: ENTIntermediateJSON = {
      ...base,
      domain: "ent",
      entFields: buildENTFields(req),
    };
    return result;
  } else {
    const mentalFields = buildMentalFields(req);

    // Populate riskFlags from mental safety fields
    const riskFlags: string[] = [];
    if (mentalFields.suicidalIdeationFlag) riskFlags.push("希死念慮");
    if (mentalFields.activationConcernFlag) riskFlags.push("賦活症候群リスク");
    if (mentalFields.manicSwitchConcernFlag) riskFlags.push("躁転懸念");
    if (mentalFields.interruptionHistory) riskFlags.push("自己中断歴あり");

    const result: MentalIntermediateJSON = {
      ...base,
      domain: "mental",
      mentalFields,
      riskFlags,
    };
    return result;
  }
}
