import { describe, it, expect } from "vitest";
import { generateDraft, sectionsToFullText } from "../server/services/generation/draft-generator";
import type { ENTIntermediateJSON, MentalIntermediateJSON, Warning } from "../lib/types";

const baseENT: ENTIntermediateJSON = {
  domain: "ent",
  freeText: "アレルギー性鼻炎。アレグラを処方。くしゃみ・鼻水の訴えあり。",
  prescriptionType: "do",
  diseases: ["アレルギー性鼻炎"],
  detectedMedications: ["フェキソフェナジン"],
  symptoms: ["くしゃみ", "鼻水"],
  labs: {},
  subjectiveNotes: [],
  riskFlags: [],
  guidancePoints: [],
  followUpPoints: [],
  warnings: [],
  entFields: {
    symptomCategory: ["くしゃみ", "鼻汁"],
    patientType: "adult",
    seasonal: true,
    firstVisitLike: "continued",
  },
};

const baseMental: MentalIntermediateJSON = {
  domain: "mental",
  freeText: "不眠の訴え。レクサプロ新規処方。",
  prescriptionType: "new",
  diseases: ["不眠", "うつ状態"],
  detectedMedications: ["エスシタロプラム"],
  symptoms: ["不眠"],
  labs: {},
  subjectiveNotes: [],
  riskFlags: ["賦活症候群リスク"],
  guidancePoints: [],
  followUpPoints: [],
  warnings: [],
  mentalFields: {
    chiefComplaint: ["不眠"],
    sleepType: ["入眠困難"],
    treatmentPhase: "new",
    daytimeSleepiness: false,
    interruptionHistory: false,
    suicidalIdeationFlag: false,
    activationConcernFlag: true,
    manicSwitchConcernFlag: false,
  },
};

describe("DraftGenerator", () => {
  describe("ENT draft generation", () => {
    it("generates all 5 sections", () => {
      const sections = generateDraft(baseENT, []);
      expect(sections.S).toBeTruthy();
      expect(sections.O).toBeTruthy();
      expect(sections.A).toBeTruthy();
      expect(sections.Ep).toBeTruthy();
      expect(sections.OP).toBeTruthy();
    });

    it("S section contains disease name", () => {
      const sections = generateDraft(baseENT, []);
      expect(sections.S).toContain("アレルギー性鼻炎");
    });

    it("S section contains symptoms", () => {
      const sections = generateDraft(baseENT, []);
      expect(sections.S).toMatch(/くしゃみ|鼻水/);
    });

    it("S section mentions seasonal factor", () => {
      const sections = generateDraft(baseENT, []);
      expect(sections.S).toContain("季節性");
    });

    it("O section contains prescription type", () => {
      const sections = generateDraft(baseENT, []);
      expect(sections.O).toContain("Do処方");
    });

    it("O section contains medication name", () => {
      const sections = generateDraft(baseENT, []);
      expect(sections.O).toContain("フェキソフェナジン");
    });

    it("Ep section contains medication guidance", () => {
      const sections = generateDraft(baseENT, []);
      expect(sections.Ep).toContain("フェキソフェナジン");
    });

    it("child patient generates parent-addressed Ep", () => {
      const childPayload: ENTIntermediateJSON = {
        ...baseENT,
        entFields: { ...baseENT.entFields, patientType: "child" },
      };
      const sections = generateDraft(childPayload, []);
      expect(sections.S).toContain("小児");
      expect(sections.Ep).toMatch(/保護者/);
    });
  });

  describe("Mental draft generation", () => {
    const warnings: Warning[] = [
      { severity: "warning", message: "SSRI新規開始：賦活症候群のリスクに留意" },
    ];

    it("generates all 5 sections", () => {
      const sections = generateDraft(baseMental, warnings);
      expect(sections.S).toBeTruthy();
      expect(sections.O).toBeTruthy();
      expect(sections.A).toBeTruthy();
      expect(sections.Ep).toBeTruthy();
      expect(sections.OP).toBeTruthy();
    });

    it("O section shows treatment phase", () => {
      const sections = generateDraft(baseMental, warnings);
      expect(sections.O).toContain("新規導入");
    });

    it("Ep section contains SSRI guidance", () => {
      const sections = generateDraft(baseMental, warnings);
      // Should mention effect takes weeks
      expect(sections.Ep).toMatch(/週間|効果|自己中断/);
    });

    it("A section mentions risk flags", () => {
      const sections = generateDraft(baseMental, warnings);
      expect(sections.A).toMatch(/賦活|副作用|新規/);
    });

    it("suicidal ideation generates safety counseling in Ep", () => {
      const payload: MentalIntermediateJSON = {
        ...baseMental,
        mentalFields: { ...baseMental.mentalFields, suicidalIdeationFlag: true },
        riskFlags: ["希死念慮"],
      };
      const criticalWarning: Warning[] = [
        { severity: "critical", message: "希死念慮の可能性", ruleName: "suicidal_ideation_flag" },
      ];
      const sections = generateDraft(payload, criticalWarning);
      expect(sections.Ep).toContain("安全確認");
      expect(sections.A).toContain("重要事項");
    });

    it("interruption history generates follow-up in OP", () => {
      const payload: MentalIntermediateJSON = {
        ...baseMental,
        mentalFields: { ...baseMental.mentalFields, interruptionHistory: true },
        riskFlags: ["自己中断歴あり"],
      };
      const sections = generateDraft(payload, []);
      expect(sections.OP).toContain("服薬継続");
    });
  });

  describe("Does NOT generate prohibited content", () => {
    it("S section does not contain fabricated diagnoses", () => {
      const sections = generateDraft(baseENT, []);
      // Should not contain diagnostic assertions not in input
      expect(sections.S).not.toContain("糖尿病");
      expect(sections.S).not.toContain("高血圧");
    });

    it("A section does not use definitive diagnostic language", () => {
      const sections = generateDraft(baseMental, []);
      // Should use hedged language, not "確定診断"
      expect(sections.A).not.toContain("確定診断");
      expect(sections.A).not.toContain("と診断された");
    });
  });

  describe("sectionsToFullText", () => {
    it("formats all sections with labels", () => {
      const sections = generateDraft(baseENT, []);
      const text = sectionsToFullText(sections);
      expect(text).toContain("[S]");
      expect(text).toContain("[O]");
      expect(text).toContain("[A]");
      expect(text).toContain("[Ep]");
      expect(text).toContain("[OP]");
    });
  });
});
