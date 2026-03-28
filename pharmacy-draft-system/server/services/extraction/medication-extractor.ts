import { ENT_MEDICATIONS } from "@/data/masters/ent-medications";
import { MENTAL_MEDICATIONS } from "@/data/masters/mental-medications";
import type { Domain, MedicationMasterData } from "@/lib/types";

const ALL_MEDICATIONS = [...ENT_MEDICATIONS, ...MENTAL_MEDICATIONS];

/**
 * Extraction result with matched medication and its master record
 */
export interface ExtractionMatch {
  canonicalName: string;
  matchedAlias: string;
  category: string;
  domain: string;
  master: MedicationMasterData;
}

/**
 * Rule-based medication extractor.
 * Performs exact + alias matching against master data.
 * Does NOT use LLM — intentionally deterministic for safety.
 *
 * Design: all matches return the canonical name so downstream services
 * work with stable identifiers regardless of user's input phrasing.
 */
export function extractMedications(
  freeText: string,
  domain?: Domain
): ExtractionMatch[] {
  const source = domain
    ? ALL_MEDICATIONS.filter((m) => m.domain === domain || m.domain === "both")
    : ALL_MEDICATIONS;

  const matches: ExtractionMatch[] = [];
  const seenCanonical = new Set<string>();

  for (const med of source) {
    if (seenCanonical.has(med.name)) continue;

    const allNames = [med.name, ...(med.aliases as string[])];
    const matched = allNames.find((alias) =>
      freeText.includes(alias)
    );

    if (matched) {
      matches.push({
        canonicalName: med.name,
        matchedAlias: matched,
        category: med.category,
        domain: med.domain,
        master: med,
      });
      seenCanonical.add(med.name);
    }
  }

  return matches;
}

/**
 * Returns just the canonical names — convenience wrapper for API use
 */
export function extractMedicationNames(freeText: string, domain?: Domain): string[] {
  return extractMedications(freeText, domain).map((m) => m.canonicalName);
}

/**
 * Get master record for a given canonical medication name
 */
export function getMedicationMaster(canonicalName: string): MedicationMasterData | undefined {
  return ALL_MEDICATIONS.find((m) => m.name === canonicalName);
}

/**
 * Get master records for a list of canonical names
 */
export function getMedicationMasters(canonicalNames: string[]): MedicationMasterData[] {
  return canonicalNames
    .map(getMedicationMaster)
    .filter((m): m is MedicationMasterData => m !== undefined);
}
