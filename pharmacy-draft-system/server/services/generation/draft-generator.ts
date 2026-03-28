import type { IntermediateJSON, DraftSections, Warning } from "@/lib/types";
import { generateENTDraft } from "./ent-generator";
import { generateMentalDraft } from "./mental-generator";

/**
 * Main draft generator — dispatches to domain-specific generators.
 * All generation is rule-based in MVP; LLM integration point is documented below.
 *
 * To integrate LLM:
 * 1. Implement LLMClient (server/services/llm/types.ts)
 * 2. Inject via getLLMClient()
 * 3. Use structured payload as context to build LLM prompt
 * 4. Parse LLM response into DraftSections
 * 5. Apply post-processing safety filters
 */
export function generateDraft(
  payload: IntermediateJSON,
  warnings: Warning[]
): DraftSections {
  if (payload.domain === "ent") {
    return generateENTDraft(payload, warnings);
  } else {
    return generateMentalDraft(payload, warnings);
  }
}

/**
 * Converts DraftSections to a single formatted text block
 * for the "全文コピー" feature
 */
export function sectionsToFullText(sections: DraftSections): string {
  return [
    `[S] ${sections.S}`,
    `[O] ${sections.O}`,
    `[A] ${sections.A}`,
    `[Ep] ${sections.Ep}`,
    `[OP] ${sections.OP}`,
  ].join("\n\n");
}
