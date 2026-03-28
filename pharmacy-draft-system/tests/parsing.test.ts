import { describe, it, expect } from "vitest";
import { parseToIntermediate } from "../server/services/parsing/structured-parser";
import type { ParseRequest, ENTIntermediateJSON, MentalIntermediateJSON } from "../lib/types";

describe("StructuredParser", () => {
  describe("ENT domain", () => {
    const baseENTRequest: ParseRequest = {
      domain: "ent",
      freeText: "アレルギー性鼻炎。アレグラとフルナーゼを処方。くしゃみ・鼻水の訴えあり。",
      prescriptionType: "do",
      diseases: ["アレルギー性鼻炎"],
      entFields: {
        symptomCategory: ["くしゃみ", "鼻汁"],
        patientType: "adult",
        seasonal: true,
        firstVisitLike: "continued",
      },
    };

    it("produces domain: ent output", () => {
      const result = parseToIntermediate(baseENTRequest) as ENTIntermediateJSON;
      expect(result.domain).toBe("ent");
    });

    it("extracts medications from free text", () => {
      const result = parseToIntermediate(baseENTRequest) as ENTIntermediateJSON;
      expect(result.detectedMedications).toContain("フェキソフェナジン");
      expect(result.detectedMedications).toContain("フルチカゾン点鼻液");
    });

    it("extracts symptoms from free text", () => {
      const result = parseToIntermediate(baseENTRequest) as ENTIntermediateJSON;
      expect(result.symptoms).toContain("くしゃみ");
      expect(result.symptoms).toContain("鼻水");
    });

    it("preserves entFields", () => {
      const result = parseToIntermediate(baseENTRequest) as ENTIntermediateJSON;
      expect(result.entFields.patientType).toBe("adult");
      expect(result.entFields.seasonal).toBe(true);
    });

    it("preserves prescriptionType", () => {
      const result = parseToIntermediate(baseENTRequest) as ENTIntermediateJSON;
      expect(result.prescriptionType).toBe("do");
    });

    it("preserves diseases array", () => {
      const result = parseToIntermediate(baseENTRequest) as ENTIntermediateJSON;
      expect(result.diseases).toContain("アレルギー性鼻炎");
    });

    it("defaults patientType to adult when not provided", () => {
      const req: ParseRequest = { ...baseENTRequest, entFields: undefined };
      const result = parseToIntermediate(req) as ENTIntermediateJSON;
      expect(result.entFields.patientType).toBe("adult");
    });
  });

  describe("Mental domain", () => {
    const baseMentalRequest: ParseRequest = {
      domain: "mental",
      freeText: "不眠の訴えあり。入眠困難が続いている。レクサプロ10mg新規処方。不安感も強い。",
      prescriptionType: "new",
      diseases: ["不眠", "うつ状態"],
      mentalFields: {
        chiefComplaint: ["不眠", "不安"],
        sleepType: ["入眠困難"],
        treatmentPhase: "new",
        daytimeSleepiness: false,
        interruptionHistory: false,
        suicidalIdeationFlag: false,
        activationConcernFlag: true,
        manicSwitchConcernFlag: false,
      },
    };

    it("produces domain: mental output", () => {
      const result = parseToIntermediate(baseMentalRequest) as MentalIntermediateJSON;
      expect(result.domain).toBe("mental");
    });

    it("extracts mental medications", () => {
      const result = parseToIntermediate(baseMentalRequest) as MentalIntermediateJSON;
      expect(result.detectedMedications).toContain("エスシタロプラム");
    });

    it("populates riskFlags from activationConcernFlag", () => {
      const result = parseToIntermediate(baseMentalRequest) as MentalIntermediateJSON;
      expect(result.riskFlags).toContain("賦活症候群リスク");
    });

    it("does NOT populate suicidalIdeation riskFlag when false", () => {
      const result = parseToIntermediate(baseMentalRequest) as MentalIntermediateJSON;
      expect(result.riskFlags).not.toContain("希死念慮");
    });

    it("populates suicidalIdeation riskFlag when true", () => {
      const req: ParseRequest = {
        ...baseMentalRequest,
        mentalFields: { ...baseMentalRequest.mentalFields, suicidalIdeationFlag: true },
      };
      const result = parseToIntermediate(req) as MentalIntermediateJSON;
      expect(result.riskFlags).toContain("希死念慮");
    });

    it("safety: suicidalIdeationFlag defaults to false when not provided", () => {
      const req: ParseRequest = { ...baseMentalRequest, mentalFields: undefined };
      const result = parseToIntermediate(req) as MentalIntermediateJSON;
      // Critical safety: must never default to true
      expect(result.mentalFields.suicidalIdeationFlag).toBe(false);
      expect(result.mentalFields.manicSwitchConcernFlag).toBe(false);
    });

    it("extracts symptoms from free text", () => {
      const result = parseToIntermediate(baseMentalRequest) as MentalIntermediateJSON;
      expect(result.symptoms).toContain("不眠");
    });
  });

  describe("Lab extraction", () => {
    it("extracts CRP value from free text", () => {
      const req: ParseRequest = {
        domain: "ent",
        freeText: "副鼻腔炎。CRP 0.8 上昇あり。",
        prescriptionType: "new",
        diseases: ["急性鼻副鼻腔炎"],
      };
      const result = parseToIntermediate(req);
      expect(result.labs["CRP"]).toBe("0.8");
    });
  });
});
