import { describe, it, expect } from "vitest";
import {
  extractMedications,
  extractMedicationNames,
  getMedicationMaster,
} from "../server/services/extraction/medication-extractor";

describe("MedicationExtractor", () => {
  describe("extractMedicationNames", () => {
    it("matches medication by canonical name", () => {
      const result = extractMedicationNames("フルチカゾン点鼻液を処方されました", "ent");
      expect(result).toContain("フルチカゾン点鼻液");
    });

    it("matches medication by alias (brand name)", () => {
      const result = extractMedicationNames("アレグラを飲んでいます", "ent");
      expect(result).toContain("フェキソフェナジン");
    });

    it("matches medication by alias (another brand name)", () => {
      const result = extractMedicationNames("デザレックスを処方されています", "ent");
      expect(result).toContain("デスロラタジン");
    });

    it("matches mental medication by canonical name", () => {
      const result = extractMedicationNames("レクサプロ10mg新規処方", "mental");
      expect(result).toContain("エスシタロプラム");
    });

    it("matches mental medication by alias", () => {
      const result = extractMedicationNames("ジェイゾロフト25mgを開始しました", "mental");
      expect(result).toContain("セルトラリン");
    });

    it("returns empty array when no medications detected", () => {
      const result = extractMedicationNames("特に薬はありません", "ent");
      expect(result).toHaveLength(0);
    });

    it("detects multiple medications from single text", () => {
      const result = extractMedicationNames(
        "アレグラとフルナーゼを処方されました",
        "ent"
      );
      expect(result).toContain("フェキソフェナジン");
      expect(result).toContain("フルチカゾン点鼻液");
    });

    it("deduplicates when same medication appears twice", () => {
      const result = extractMedicationNames("アレグラとフェキソフェナジンを服用", "ent");
      const fexoCount = result.filter((m) => m === "フェキソフェナジン").length;
      expect(fexoCount).toBe(1);
    });

    it("filters by domain — does not match cross-domain without filter", () => {
      // Without domain filter, both domains should work
      const allResult = extractMedicationNames("レクサプロとアレグラを飲んでいます");
      expect(allResult).toContain("エスシタロプラム");
      expect(allResult).toContain("フェキソフェナジン");
    });
  });

  describe("extractMedications", () => {
    it("returns match details including category and domain", () => {
      const matches = extractMedications("ジルテック服用中", "ent");
      expect(matches).toHaveLength(1);
      expect(matches[0].canonicalName).toBe("セチリジン");
      expect(matches[0].category).toBe("antihistamine");
      expect(matches[0].matchedAlias).toBe("ジルテック");
    });
  });

  describe("getMedicationMaster", () => {
    it("returns master data for a canonical name", () => {
      const master = getMedicationMaster("エスシタロプラム");
      expect(master).toBeDefined();
      expect(master?.category).toBe("ssri");
      expect(master?.domain).toBe("mental");
    });

    it("returns undefined for unknown name", () => {
      const master = getMedicationMaster("存在しない薬");
      expect(master).toBeUndefined();
    });
  });
});
