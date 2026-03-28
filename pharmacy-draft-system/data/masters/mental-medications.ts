import type { MedicationMasterData } from "@/lib/types";

/**
 * Mental health medication master data
 * Safety-first: all entries include appropriate warnings for pharmacist review
 */
export const MENTAL_MEDICATIONS: MedicationMasterData[] = [
  // ─── SSRI ─────────────────────────────────────────────────────────────────
  {
    name: "エスシタロプラム",
    aliases: ["レクサプロ", "エスシタロプラムシュウ酸塩"],
    category: "ssri",
    domain: "mental",
    guidanceJson: {
      mainPoints: [
        "効果が出るまでに2〜4週間程度かかることを説明した",
        "症状が改善してきても自己判断で服用を中止しないよう説明した",
        "医師の指示に従い継続することが重要であることを説明した",
      ],
      sideEffects: [
        "服用開始初期に吐き気・頭痛・不安感が一時的に生じることがある旨を説明した",
        "これらの初期副作用は多くの場合1〜2週間で軽減することを説明した",
        "眠気・口渇・性機能障害が生じることがある旨を説明した",
      ],
      usageNotes: [
        "気になる症状（特に不安の増強・焦燥感・眠れなくなった等）が出た場合は受診するよう案内した",
        "急に服用をやめると中断症候群が生じることがあることを説明した",
      ],
    },
    warningJson: [
      {
        message: "SSRI新規開始：賦活症候群（焦燥・不眠・衝動性の増強）に注意が必要。開始後2週間は特に経過観察を強化",
        severity: "warning",
      },
      {
        message: "SSRI：自己中断による中断症候群（めまい・しびれ・インフルエンザ様症状）のリスクあり",
        severity: "caution",
      },
    ],
  },
  {
    name: "パロキセチン",
    aliases: ["パキシル", "パロキセチン塩酸塩水和物", "パキシルCR"],
    category: "ssri",
    domain: "mental",
    guidanceJson: {
      mainPoints: [
        "効果発現まで2〜4週間かかることを説明した",
        "自己中断は避けるよう特に強調して説明した",
        "医師の指示なく量を変えないよう説明した",
      ],
      sideEffects: [
        "吐き気・眠気・口渇・便秘が生じることがある旨を説明した",
        "性機能障害が生じることがある旨を説明した",
      ],
      usageNotes: [
        "突然の中止は強い中断症候群を引き起こしやすいため、減量は必ず医師の指示に従うよう説明した",
      ],
    },
    warningJson: [
      {
        message: "パロキセチンは中断症候群のリスクが特に高い。急な中止・減量時は注意が必要",
        severity: "warning",
      },
      {
        message: "SSRI新規開始：賦活症候群のリスクに留意",
        severity: "warning",
      },
    ],
  },
  {
    name: "セルトラリン",
    aliases: ["ジェイゾロフト", "セルトラリン塩酸塩"],
    category: "ssri",
    domain: "mental",
    guidanceJson: {
      mainPoints: [
        "効果が出るまでに2〜4週間程度かかることを説明した",
        "自己中断しないよう説明した",
      ],
      sideEffects: [
        "服用開始初期に消化器症状（吐き気・下痢）が生じることがある旨を説明した",
        "眠気または不眠が生じることがある旨を説明した",
      ],
      usageNotes: ["食後に服用すると消化器症状が軽減することを説明した"],
    },
    warningJson: [
      {
        message: "SSRI新規開始：賦活症候群のリスクに留意",
        severity: "warning",
      },
    ],
  },
  // ─── SNRI ─────────────────────────────────────────────────────────────────
  {
    name: "デュロキセチン",
    aliases: ["サインバルタ", "デュロキセチン塩酸塩"],
    category: "snri",
    domain: "mental",
    guidanceJson: {
      mainPoints: [
        "うつ症状・不安症状・慢性疼痛に用いられることを説明した",
        "効果発現まで2〜4週間程度かかることを説明した",
        "自己中断しないよう説明した",
      ],
      sideEffects: [
        "吐き気・頭痛・口渇・眠気・発汗が生じることがある旨を説明した",
        "血圧が上昇することがある旨を説明した",
      ],
      usageNotes: ["血圧のある方は定期的な計測を勧めた"],
    },
    warningJson: [
      {
        message: "SNRI：高血圧患者への投与は血圧の変動に留意が必要",
        severity: "caution",
      },
      {
        message: "SNRI新規開始：賦活症候群のリスクに留意",
        severity: "warning",
      },
    ],
  },
  {
    name: "ベンラファキシン",
    aliases: ["イフェクサーSR", "ベンラファキシン塩酸塩"],
    category: "snri",
    domain: "mental",
    guidanceJson: {
      mainPoints: [
        "1日1回の服用であることを説明した",
        "効果発現まで数週間かかることを説明した",
        "自己中断しないよう説明した",
      ],
      sideEffects: ["吐き気・口渇・血圧上昇・中断症候群のリスクを説明した"],
      usageNotes: ["急に中止しないよう特に説明した"],
    },
    warningJson: [
      {
        message: "SNRI：中断症候群のリスクあり。急な中止は避けるよう指導",
        severity: "warning",
      },
    ],
  },
  // ─── NaSSA ────────────────────────────────────────────────────────────────
  {
    name: "ミルタザピン",
    aliases: ["リフレックス", "レメロン", "ミルタザピン"],
    category: "nassa",
    domain: "mental",
    guidanceJson: {
      mainPoints: [
        "就寝前服用が基本であることを説明した",
        "不眠・食欲低下を伴ううつ状態に用いられることを説明した",
        "効果発現まで2〜4週間かかることを説明した",
      ],
      sideEffects: [
        "眠気・体重増加・口渇が生じることがある旨を説明した",
        "就寝前に飲むことで日中の眠気を軽減できることを説明した",
      ],
      usageNotes: ["翌日への眠気が続く場合は医師へ相談するよう案内した"],
    },
    warningJson: [
      {
        message: "NaSSA：強い眠気・体重増加のリスクあり。翌日の眠気が続く場合は確認が必要",
        severity: "caution",
      },
    ],
  },
  // ─── Orexin受容体拮抗薬（不眠治療薬） ───────────────────────────────────
  {
    name: "スボレキサント",
    aliases: ["ベルソムラ", "スボレキサント"],
    category: "orexin_ra",
    domain: "mental",
    guidanceJson: {
      mainPoints: [
        "就寝直前に服用することを説明した",
        "入眠・中途覚醒・早朝覚醒のいずれにも効果が期待できることを説明した",
        "依存性・耐性が生じにくい睡眠薬であることを説明した",
      ],
      sideEffects: [
        "翌日の眠気・頭痛・悪夢が生じることがある旨を説明した",
        "服用後は車の運転・機械の操作を避けるよう案内した",
        "高齢者では転倒に注意が必要であることを説明した",
      ],
      usageNotes: [
        "食事と同時または直後の服用は効果発現が遅れることがあることを説明した",
        "飲酒との併用は避けるよう案内した",
      ],
    },
    warningJson: [
      {
        message: "オレキシン受容体拮抗薬：翌日の眠気・ふらつき・転倒に注意。特に高齢者は要注意",
        severity: "caution",
      },
    ],
  },
  {
    name: "レンボレキサント",
    aliases: ["デエビゴ", "レンボレキサント"],
    category: "orexin_ra",
    domain: "mental",
    guidanceJson: {
      mainPoints: [
        "就寝直前に服用することを説明した",
        "依存性が低く、長期使用にも比較的適していることを説明した",
      ],
      sideEffects: [
        "翌日の眠気・頭痛・悪夢が生じることがある旨を説明した",
        "ふらつき・転倒リスクに注意するよう説明した",
      ],
      usageNotes: ["飲酒との併用は避けるよう案内した"],
    },
    warningJson: [
      {
        message: "オレキシン受容体拮抗薬：翌日の眠気・転倒リスクに留意",
        severity: "caution",
      },
    ],
  },
  // ─── メラトニン受容体作動薬 ──────────────────────────────────────────────
  {
    name: "ラメルテオン",
    aliases: ["ロゼレム", "ラメルテオン"],
    category: "melatonin_ra",
    domain: "mental",
    guidanceJson: {
      mainPoints: [
        "就寝30分前の服用が推奨されることを説明した",
        "依存性・耐性が生じにくい睡眠薬であることを説明した",
        "入眠困難に主に用いられることを説明した",
      ],
      sideEffects: [
        "翌日の眠気が生じることがある旨を説明した",
        "比較的副作用が少ない薬であることを説明した",
      ],
      usageNotes: [
        "高脂肪食後の服用は効果が高まる場合があることを説明した",
        "フルボキサミン（うつの薬）との併用は禁忌であることを確認した",
      ],
    },
    warningJson: [
      {
        message: "ラメルテオン：フルボキサミンとの併用禁忌。他科処方の確認が推奨される",
        severity: "warning",
      },
    ],
  },
  // ─── 非ベンゾジアゼピン系睡眠薬 ─────────────────────────────────────────
  {
    name: "ゾルピデム",
    aliases: ["マイスリー", "ゾルピデム酒石酸塩"],
    category: "non_benzo_hypnotic",
    domain: "mental",
    guidanceJson: {
      mainPoints: [
        "就寝直前に服用することを説明した",
        "主に入眠困難に用いられることを説明した",
      ],
      sideEffects: [
        "翌日の眠気・ふらつき・転倒が生じることがある旨を説明した",
        "まれに服薬後の記憶が曖昧になることがある旨を説明した",
      ],
      usageNotes: [
        "飲酒との併用は厳禁であることを説明した",
        "長期連用による依存性のリスクについて説明した",
        "急な中止は避けるよう案内した",
      ],
    },
    warningJson: [
      {
        message: "非ベンゾジアゼピン系睡眠薬：長期連用による依存・耐性のリスクあり。急な中止は離脱症状に注意",
        severity: "warning",
      },
      {
        message: "ゾルピデム：飲酒との併用で呼吸抑制等の重篤な副作用のリスクあり",
        severity: "warning",
      },
    ],
  },
  {
    name: "エスゾピクロン",
    aliases: ["ルネスタ", "エスゾピクロン"],
    category: "non_benzo_hypnotic",
    domain: "mental",
    guidanceJson: {
      mainPoints: [
        "就寝直前に服用することを説明した",
        "入眠・中途覚醒に効果があることを説明した",
      ],
      sideEffects: [
        "苦味・翌日の眠気・ふらつきが生じることがある旨を説明した",
      ],
      usageNotes: [
        "飲酒との併用は避けるよう案内した",
        "長期連用による依存リスクについて説明した",
      ],
    },
    warningJson: [
      {
        message: "非ベンゾジアゼピン系：長期連用依存リスク・急な中止による離脱症状に注意",
        severity: "warning",
      },
    ],
  },
  // ─── ベンゾジアゼピン受容体作動薬 ───────────────────────────────────────
  {
    name: "ニトラゼパム",
    aliases: ["ベンザリン", "ネルボン", "ニトラゼパム"],
    category: "benzodiazepine",
    domain: "mental",
    guidanceJson: {
      mainPoints: [
        "就寝前の服用であることを説明した",
        "長期連用は依存性・耐性のリスクがある旨を説明した",
      ],
      sideEffects: [
        "翌日の眠気・ふらつき・転倒リスクを説明した",
        "筋弛緩作用に留意が必要であることを説明した",
      ],
      usageNotes: [
        "飲酒との併用は避けるよう案内した",
        "急な中止は避けるよう特に説明した",
        "高齢者では特に転倒に注意するよう案内した",
      ],
    },
    warningJson: [
      {
        message: "ベンゾジアゼピン系：依存・離脱リスクあり。長期連用・急な中止は避けるよう指導が必要",
        severity: "warning",
      },
      {
        message: "ベンゾジアゼピン系：高齢者では転倒・骨折リスクが増大する",
        severity: "caution",
      },
    ],
  },
  {
    name: "エチゾラム",
    aliases: ["デパス", "エチゾラム"],
    category: "benzodiazepine",
    domain: "mental",
    guidanceJson: {
      mainPoints: [
        "不安・緊張の緩和に用いられることを説明した",
        "頓用として使用する場合は用法・用量を守るよう説明した",
      ],
      sideEffects: [
        "眠気・ふらつき・記憶障害が生じることがある旨を説明した",
        "依存性のリスクについて説明した",
      ],
      usageNotes: [
        "飲酒との併用は避けるよう案内した",
        "急に中止しないよう説明した",
        "長期・大量使用は避けるよう説明した",
      ],
    },
    warningJson: [
      {
        message: "ベンゾジアゼピン系（エチゾラム）：依存性が高く長期連用は注意。急な中止による離脱症状のリスクあり",
        severity: "warning",
      },
    ],
  },
  // ─── 抗不安薬（頓用） ────────────────────────────────────────────────────
  {
    name: "ロラゼパム",
    aliases: ["ワイパックス", "ロラゼパム"],
    category: "anxiolytic_prn",
    domain: "mental",
    guidanceJson: {
      mainPoints: [
        "頓用（必要時服用）の場合は症状が強いときに限り服用するよう説明した",
        "1日の上限を守るよう説明した",
      ],
      sideEffects: ["眠気・ふらつきが生じることがある旨を説明した"],
      usageNotes: [
        "飲酒との併用は避けるよう案内した",
        "急な中止による離脱症状について説明した",
        "運転・機械操作には注意が必要な旨を案内した",
      ],
    },
    warningJson: [
      {
        message: "ベンゾジアゼピン系抗不安薬（頓用）：依存リスク・急な中断は避けるよう指導",
        severity: "warning",
      },
    ],
  },
];
