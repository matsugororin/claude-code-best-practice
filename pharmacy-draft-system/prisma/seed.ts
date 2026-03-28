/**
 * Database seed script
 * Run: pnpm db:seed
 *
 * Seeds: MedicationMaster, DiseaseTemplate, WarningRule
 * Does NOT seed patient data (never seeded — privacy).
 */

import { PrismaClient } from "@prisma/client";

// Import master data (uses path aliases resolved at runtime via tsx)
const ENT_MEDICATIONS_MODULE = require("../data/masters/ent-medications");
const MENTAL_MEDICATIONS_MODULE = require("../data/masters/mental-medications");
const WARNING_RULES_MODULE = require("../data/masters/warning-rules");
const DISEASE_TEMPLATES_MODULE = require("../data/masters/disease-templates");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ─── MedicationMaster ────────────────────────────────────────────────────
  const allMedications = [
    ...ENT_MEDICATIONS_MODULE.ENT_MEDICATIONS,
    ...MENTAL_MEDICATIONS_MODULE.MENTAL_MEDICATIONS,
  ];

  let medCount = 0;
  for (const med of allMedications) {
    await prisma.medicationMaster.upsert({
      where: { name: med.name },
      create: {
        name: med.name,
        aliases: med.aliases,
        category: med.category,
        domain: med.domain,
        guidanceJson: med.guidanceJson,
        warningJson: med.warningJson,
        active: true,
      },
      update: {
        aliases: med.aliases,
        category: med.category,
        domain: med.domain,
        guidanceJson: med.guidanceJson,
        warningJson: med.warningJson,
        active: true,
      },
    });
    medCount++;
  }
  console.log(`  ✓ MedicationMaster: ${medCount} records`);

  // ─── DiseaseTemplate ─────────────────────────────────────────────────────
  const templates = DISEASE_TEMPLATES_MODULE.DISEASE_TEMPLATES;
  let tmplCount = 0;
  for (const tmpl of templates) {
    await prisma.diseaseTemplate.upsert({
      where: { domain_diseaseName: { domain: tmpl.domain, diseaseName: tmpl.diseaseName } },
      create: {
        domain: tmpl.domain,
        diseaseName: tmpl.diseaseName,
        templateJson: tmpl.templateJson,
        active: true,
      },
      update: {
        templateJson: tmpl.templateJson,
        active: true,
      },
    });
    tmplCount++;
  }
  console.log(`  ✓ DiseaseTemplate: ${tmplCount} records`);

  // ─── WarningRule ─────────────────────────────────────────────────────────
  const rules = WARNING_RULES_MODULE.WARNING_RULES;
  let ruleCount = 0;
  for (const rule of rules) {
    await prisma.warningRule.upsert({
      where: { ruleName: rule.ruleName },
      create: {
        domain: rule.domain,
        ruleName: rule.ruleName,
        conditionJson: rule.conditionJson,
        severity: rule.severity,
        message: rule.message,
        active: true,
      },
      update: {
        domain: rule.domain,
        conditionJson: rule.conditionJson,
        severity: rule.severity,
        message: rule.message,
        active: true,
      },
    });
    ruleCount++;
  }
  console.log(`  ✓ WarningRule: ${ruleCount} records`);

  console.log("✅ Seed complete");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
