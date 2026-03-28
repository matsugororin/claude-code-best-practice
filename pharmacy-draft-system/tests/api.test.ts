/**
 * API smoke tests
 * Tests the route handler logic directly without HTTP.
 * For full integration tests, use a test DB and supertest.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma
vi.mock("../server/db", () => ({
  prisma: {
    generationSession: {
      create: vi.fn().mockResolvedValue({
        id: "test-session-id",
        domain: "ent",
        freeText: "test",
        prescriptionType: "do",
        diseases: [],
        detectedMedications: [],
        structuredPayload: {},
        warnings: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
    draftRecord: {
      create: vi.fn().mockResolvedValue({
        id: "test-draft-id",
        sessionId: "test-session-id",
        sectionS: "[S]",
        sectionO: "[O]",
        sectionA: "[A]",
        sectionEp: "[Ep]",
        sectionOP: "[OP]",
        finalText: "",
        status: "draft",
        confirmedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn().mockResolvedValue({ id: "audit-id" }),
    },
  },
}));

describe("API Smoke Tests", () => {
  describe("ParseRequest validation", () => {
    it("ParseRequestSchema rejects empty freeText", async () => {
      const { ParseRequestSchema } = await import("../lib/schemas");
      const result = ParseRequestSchema.safeParse({
        domain: "ent",
        freeText: "",
        prescriptionType: "do",
        diseases: ["アレルギー性鼻炎"],
      });
      expect(result.success).toBe(false);
    });

    it("ParseRequestSchema rejects empty diseases array", async () => {
      const { ParseRequestSchema } = await import("../lib/schemas");
      const result = ParseRequestSchema.safeParse({
        domain: "ent",
        freeText: "テスト入力",
        prescriptionType: "do",
        diseases: [],
      });
      expect(result.success).toBe(false);
    });

    it("ParseRequestSchema accepts valid ENT input", async () => {
      const { ParseRequestSchema } = await import("../lib/schemas");
      const result = ParseRequestSchema.safeParse({
        domain: "ent",
        freeText: "アレルギー性鼻炎の患者",
        prescriptionType: "do",
        diseases: ["アレルギー性鼻炎"],
      });
      expect(result.success).toBe(true);
    });

    it("ParseRequestSchema accepts valid mental input", async () => {
      const { ParseRequestSchema } = await import("../lib/schemas");
      const result = ParseRequestSchema.safeParse({
        domain: "mental",
        freeText: "不眠の訴えあり",
        prescriptionType: "new",
        diseases: ["不眠"],
        mentalFields: {
          chiefComplaint: ["不眠"],
          sleepType: ["入眠困難"],
          treatmentPhase: "new",
          daytimeSleepiness: false,
          interruptionHistory: false,
          suicidalIdeationFlag: false,
          activationConcernFlag: false,
          manicSwitchConcernFlag: false,
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("DraftUpdateSchema", () => {
    it("accepts partial section updates", async () => {
      const { DraftUpdateSchema } = await import("../lib/schemas");
      const result = DraftUpdateSchema.safeParse({ sectionS: "更新されたSセクション" });
      expect(result.success).toBe(true);
    });

    it("accepts status confirmation", async () => {
      const { DraftUpdateSchema } = await import("../lib/schemas");
      const result = DraftUpdateSchema.safeParse({ status: "confirmed" });
      expect(result.success).toBe(true);
    });

    it("rejects invalid status value", async () => {
      const { DraftUpdateSchema } = await import("../lib/schemas");
      const result = DraftUpdateSchema.safeParse({ status: "invalid-status" });
      expect(result.success).toBe(false);
    });
  });

  describe("Full pipeline smoke test", () => {
    it("parse → generate pipeline produces valid sections", async () => {
      const { parseToIntermediate } = await import("../server/services/parsing/structured-parser");
      const { generateWarnings } = await import("../server/services/warning/warning-generator");
      const { generateDraft } = await import("../server/services/generation/draft-generator");

      const input = {
        domain: "ent" as const,
        freeText: "アレルギー性鼻炎。アレグラを継続処方。くしゃみ・鼻水の訴えあり。",
        prescriptionType: "do" as const,
        diseases: ["アレルギー性鼻炎"],
      };

      const structured = parseToIntermediate(input);
      const warnings = generateWarnings(structured);
      const sections = generateDraft(structured, warnings);

      expect(sections.S).toBeTruthy();
      expect(sections.O).toBeTruthy();
      expect(sections.A).toBeTruthy();
      expect(sections.Ep).toBeTruthy();
      expect(sections.OP).toBeTruthy();
    });

    it("mental pipeline with critical flags produces critical warnings", async () => {
      const { parseToIntermediate } = await import("../server/services/parsing/structured-parser");
      const { generateWarnings, hasCriticalWarning } = await import(
        "../server/services/warning/warning-generator"
      );

      const input = {
        domain: "mental" as const,
        freeText: "うつ状態。消えたいという気持ちがある。レクサプロ新規処方。",
        prescriptionType: "new" as const,
        diseases: ["うつ状態"],
        mentalFields: {
          suicidalIdeationFlag: true,
          treatmentPhase: "new" as const,
          chiefComplaint: ["気分低下" as const],
          sleepType: [],
          daytimeSleepiness: false,
          interruptionHistory: false,
          activationConcernFlag: false,
          manicSwitchConcernFlag: false,
        },
      };

      const structured = parseToIntermediate(input);
      const warnings = generateWarnings(structured);
      expect(hasCriticalWarning(warnings)).toBe(true);
    });
  });
});
