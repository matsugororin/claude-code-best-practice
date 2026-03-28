import { describe, it, expect } from "vitest";
import { generateWarnings, hasCriticalWarning } from "../server/services/warning/warning-generator";
import type { ENTIntermediateJSON, MentalIntermediateJSON } from "../lib/types";

const baseENT: ENTIntermediateJSON = {
  domain: "ent",
  freeText: "test",
  prescriptionType: "do",
  diseases: ["アレルギー性鼻炎"],
  detectedMedications: [],
  symptoms: [],
  labs: {},
  subjectiveNotes: [],
  riskFlags: [],
  guidancePoints: [],
  followUpPoints: [],
  warnings: [],
  entFields: {
    symptomCategory: [],
    patientType: "adult",
    seasonal: false,
    firstVisitLike: "continued",
  },
};

const baseMental: MentalIntermediateJSON = {
  domain: "mental",
  freeText: "test",
  prescriptionType: "continued",
  diseases: ["うつ状態"],
  detectedMedications: [],
  symptoms: [],
  labs: {},
  subjectiveNotes: [],
  riskFlags: [],
  guidancePoints: [],
  followUpPoints: [],
  warnings: [],
  mentalFields: {
    chiefComplaint: [],
    sleepType: [],
    treatmentPhase: "continued",
    daytimeSleepiness: false,
    interruptionHistory: false,
    suicidalIdeationFlag: false,
    activationConcernFlag: false,
    manicSwitchConcernFlag: false,
  },
};

describe("WarningGenerator", () => {
  describe("Critical safety warnings", () => {
    it("generates critical warning for suicidalIdeationFlag", () => {
      const payload: MentalIntermediateJSON = {
        ...baseMental,
        mentalFields: { ...baseMental.mentalFields, suicidalIdeationFlag: true },
      };
      const warnings = generateWarnings(payload);
      const critical = warnings.filter((w) => w.severity === "critical");
      expect(critical).toHaveLength(1);
      expect(critical[0].ruleName).toBe("suicidal_ideation_flag");
    });

    it("generates critical warning for manicSwitchConcernFlag", () => {
      const payload: MentalIntermediateJSON = {
        ...baseMental,
        mentalFields: { ...baseMental.mentalFields, manicSwitchConcernFlag: true },
      };
      const warnings = generateWarnings(payload);
      const critical = warnings.filter((w) => w.severity === "critical");
      expect(critical.some((w) => w.ruleName === "manic_switch_concern")).toBe(true);
    });

    it("does NOT generate suicidal warning when flag is false", () => {
      const warnings = generateWarnings(baseMental);
      expect(warnings.some((w) => w.ruleName === "suicidal_ideation_flag")).toBe(false);
    });
  });

  describe("Treatment phase warnings", () => {
    it("generates warning for new antidepressant", () => {
      const payload: MentalIntermediateJSON = {
        ...baseMental,
        prescriptionType: "new",
        mentalFields: { ...baseMental.mentalFields, treatmentPhase: "new" },
      };
      const warnings = generateWarnings(payload);
      expect(warnings.some((w) => w.ruleName === "new_antidepressant_guidance")).toBe(true);
      expect(warnings.some((w) => w.ruleName === "new_prescription_counseling")).toBe(true);
    });

    it("generates caution for increased dose", () => {
      const payload: MentalIntermediateJSON = {
        ...baseMental,
        mentalFields: { ...baseMental.mentalFields, treatmentPhase: "increased" },
      };
      const warnings = generateWarnings(payload);
      expect(warnings.some((w) => w.ruleName === "increased_dose_guidance")).toBe(true);
    });
  });

  describe("ENT warnings", () => {
    it("generates info warning for child patient", () => {
      const payload: ENTIntermediateJSON = {
        ...baseENT,
        entFields: { ...baseENT.entFields, patientType: "child" },
      };
      const warnings = generateWarnings(payload);
      expect(warnings.some((w) => w.ruleName === "child_patient_guidance")).toBe(true);
    });

    it("generates caution for exacerbated visit", () => {
      const payload: ENTIntermediateJSON = {
        ...baseENT,
        entFields: { ...baseENT.entFields, firstVisitLike: "exacerbated" },
      };
      const warnings = generateWarnings(payload);
      expect(warnings.some((w) => w.ruleName === "exacerbated_visit")).toBe(true);
    });
  });

  describe("Cross-domain warnings", () => {
    it("generates info for changed prescription", () => {
      const payload: ENTIntermediateJSON = { ...baseENT, prescriptionType: "changed" };
      const warnings = generateWarnings(payload);
      expect(warnings.some((w) => w.ruleName === "changed_prescription_followup")).toBe(true);
    });
  });

  describe("Sorting and deduplication", () => {
    it("sorts critical warnings first", () => {
      const payload: MentalIntermediateJSON = {
        ...baseMental,
        prescriptionType: "new",
        mentalFields: {
          ...baseMental.mentalFields,
          suicidalIdeationFlag: true,
          treatmentPhase: "new",
        },
      };
      const warnings = generateWarnings(payload);
      expect(warnings[0].severity).toBe("critical");
    });

    it("deduplicates identical messages", () => {
      const payload: MentalIntermediateJSON = {
        ...baseMental,
        detectedMedications: ["エスシタロプラム"],
        mentalFields: { ...baseMental.mentalFields, treatmentPhase: "new" },
      };
      const warnings = generateWarnings(payload);
      const messages = warnings.map((w) => w.message);
      const unique = new Set(messages);
      expect(messages.length).toBe(unique.size);
    });
  });

  describe("hasCriticalWarning", () => {
    it("returns true when critical warning exists", () => {
      expect(hasCriticalWarning([{ severity: "critical", message: "test" }])).toBe(true);
    });

    it("returns false when no critical warnings", () => {
      expect(hasCriticalWarning([{ severity: "warning", message: "test" }])).toBe(false);
    });

    it("returns false for empty array", () => {
      expect(hasCriticalWarning([])).toBe(false);
    });
  });
});
