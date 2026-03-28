import type { DiseaseTemplateData } from "@/lib/types";

/**
 * Disease-specific section templates
 * Provides baseline text that the generator fills in with patient-specific data
 * Note: Templates use {placeholder} syntax — never insert fabricated clinical data
 */
export const DISEASE_TEMPLATES: DiseaseTemplateData[] = [
  // ─── ENT: アレルギー性鼻炎 ─────────────────────────────────────────────
  {
    domain: "ent",
    diseaseName: "アレルギー性鼻炎",
    templateJson: {
      S: "アレルギー性鼻炎にて来局。{symptoms}の訴えあり。{seasonal_note}",
      O: "{prescription_type_note}。処方内容：{medications}。",
      A: "アレルギー性鼻炎に対する治療として適切と考えられる。{medication_notes}",
      Ep: "{medication_guidance}",
      OP: "症状の改善状況・副作用の有無を次回確認する予定とした。",
    },
  },
  // ─── ENT: 急性鼻副鼻腔炎 ─────────────────────────────────────────────
  {
    domain: "ent",
    diseaseName: "急性鼻副鼻腔炎",
    templateJson: {
      S: "急性鼻副鼻腔炎にて来局。{symptoms}の訴えあり。",
      O: "{prescription_type_note}。処方内容：{medications}。",
      A: "急性鼻副鼻腔炎に対する治療として適切と考えられる。抗菌薬が含まれる場合は飲み切りの重要性に留意。",
      Ep: "{medication_guidance}",
      OP: "症状の改善状況を次回確認する予定とした。改善なければ再受診を案内した。",
    },
  },
  // ─── ENT: 小児急性中耳炎 ─────────────────────────────────────────────
  {
    domain: "ent",
    diseaseName: "小児急性中耳炎",
    templateJson: {
      S: "小児急性中耳炎にて保護者来局。{symptoms}の訴えあり。",
      O: "{prescription_type_note}。処方内容：{medications}。",
      A: "小児急性中耳炎に対する治療として適切と考えられる。保護者への丁寧な説明が重要。",
      Ep: "{medication_guidance}（保護者へ説明）",
      OP: "症状の改善状況・発熱の有無を次回確認する予定とした。悪化時は早期受診を案内した。",
    },
  },
  // ─── Mental: 不眠 ────────────────────────────────────────────────────
  {
    domain: "mental",
    diseaseName: "不眠",
    templateJson: {
      S: "不眠にて来局。{chief_complaint}の訴えあり。{sleep_type_note}",
      O: "{prescription_type_note}。処方内容：{medications}。",
      A: "不眠症状に対する薬物療法として適切と考えられる。{safety_notes}",
      Ep: "{medication_guidance}",
      OP: "睡眠状況（入眠・中途覚醒・日中の眠気）・副作用の有無を次回確認する予定とした。",
    },
  },
  // ─── Mental: うつ状態/うつ病 ──────────────────────────────────────────
  {
    domain: "mental",
    diseaseName: "うつ状態",
    templateJson: {
      S: "うつ状態にて来局。{chief_complaint}の訴えあり。",
      O: "{prescription_type_note}。処方内容：{medications}。",
      A: "うつ状態に対する薬物療法として適切と考えられる。{activation_note}{safety_notes}",
      Ep: "{medication_guidance}",
      OP: "気分・睡眠・食欲・副作用の有無を次回確認する予定とした。",
    },
  },
  {
    domain: "mental",
    diseaseName: "うつ病",
    templateJson: {
      S: "うつ病にて来局。{chief_complaint}の訴えあり。",
      O: "{prescription_type_note}。処方内容：{medications}。",
      A: "うつ病に対する薬物療法として適切と考えられる。{activation_note}{safety_notes}",
      Ep: "{medication_guidance}",
      OP: "気分・睡眠・食欲・副作用の有無を次回確認する予定とした。",
    },
  },
  // ─── Mental: 不安症状 ─────────────────────────────────────────────────
  {
    domain: "mental",
    diseaseName: "不安症状",
    templateJson: {
      S: "不安症状にて来局。{chief_complaint}の訴えあり。",
      O: "{prescription_type_note}。処方内容：{medications}。",
      A: "不安症状に対する薬物療法として適切と考えられる。{safety_notes}",
      Ep: "{medication_guidance}",
      OP: "不安症状の程度・副作用の有無・服薬継続状況を次回確認する予定とした。",
    },
  },
];
