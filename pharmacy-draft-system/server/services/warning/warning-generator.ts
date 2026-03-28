import type { IntermediateJSON, Warning, WarningRuleData, WarningSeverity } from "@/lib/types";
import { WARNING_RULES } from "@/data/masters/warning-rules";
import { getMedicationMasters } from "../extraction/medication-extractor";

/**
 * Resolves a dot-notation field path against a nested object.
 * e.g., "mentalFields.suicidalIdeationFlag" → obj.mentalFields.suicidalIdeationFlag
 */
function resolveField(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc !== null && typeof acc === "object") {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/**
 * Evaluates a single warning rule condition against the structured payload.
 */
function evaluateCondition(
  payload: IntermediateJSON,
  rule: WarningRuleData
): boolean {
  const { conditionJson } = rule;
  const value = resolveField(payload as unknown as Record<string, unknown>, conditionJson.field);

  if (conditionJson.equals !== undefined) {
    return value === conditionJson.equals;
  }
  if (conditionJson.truthy !== undefined) {
    return conditionJson.truthy ? Boolean(value) : !value;
  }
  if (conditionJson.contains !== undefined && Array.isArray(value)) {
    return (value as unknown[]).some((v) => {
      if (typeof v === "object" && v !== null) {
        return (v as Record<string, unknown>).category === conditionJson.contains;
      }
      return v === conditionJson.contains;
    });
  }

  return false;
}

/**
 * Generates warnings from medication master data.
 * Each detected medication may carry its own warning conditions.
 */
function generateMedicationWarnings(payload: IntermediateJSON): Warning[] {
  const warnings: Warning[] = [];
  const masters = getMedicationMasters(payload.detectedMedications);

  for (const master of masters) {
    const conditions = master.warningJson as Array<{
      message: string;
      severity: WarningSeverity;
      patientType?: string;
      prescriptionType?: string;
    }>;

    for (const condition of conditions) {
      // Check if condition is applicable
      if (condition.patientType !== undefined) {
        const patientType =
          payload.domain === "ent"
            ? (payload as { entFields: { patientType: string } }).entFields?.patientType
            : undefined;
        if (patientType !== condition.patientType) continue;
      }
      if (condition.prescriptionType !== undefined) {
        if (payload.prescriptionType !== condition.prescriptionType) continue;
      }

      warnings.push({
        severity: condition.severity,
        message: condition.message,
        ruleName: `med:${master.name}`,
      });
    }
  }

  return warnings;
}

/**
 * Deduplicates warnings by message content (prevents double-firing from
 * medication master + rule-based evaluation)
 */
function deduplicateWarnings(warnings: Warning[]): Warning[] {
  const seen = new Set<string>();
  return warnings.filter((w) => {
    if (seen.has(w.message)) return false;
    seen.add(w.message);
    return true;
  });
}

/**
 * Sort by severity: critical > warning > caution > info
 */
const SEVERITY_ORDER: Record<WarningSeverity, number> = {
  critical: 0,
  warning: 1,
  caution: 2,
  info: 3,
};

function sortBySeverity(warnings: Warning[]): Warning[] {
  return [...warnings].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  );
}

/**
 * Main warning generator.
 * Evaluates all active rules + medication-specific warnings.
 *
 * Critical safety principle: critical severity warnings are NEVER suppressed.
 * They must always surface for pharmacist review.
 */
export function generateWarnings(payload: IntermediateJSON): Warning[] {
  const warnings: Warning[] = [];

  // 1. Evaluate rule-based warnings
  const applicableRules = WARNING_RULES.filter(
    (rule) => rule.domain === payload.domain || rule.domain === "both"
  );

  for (const rule of applicableRules) {
    if (evaluateCondition(payload, rule)) {
      warnings.push({
        severity: rule.severity,
        message: rule.message,
        ruleName: rule.ruleName,
      });
    }
  }

  // 2. Generate medication-specific warnings
  const medWarnings = generateMedicationWarnings(payload);
  warnings.push(...medWarnings);

  // 3. Deduplicate and sort
  return sortBySeverity(deduplicateWarnings(warnings));
}

/**
 * Checks if any critical warnings are present (used for UI emphasis)
 */
export function hasCriticalWarning(warnings: Warning[]): boolean {
  return warnings.some((w) => w.severity === "critical");
}
