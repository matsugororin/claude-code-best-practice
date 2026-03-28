import type { MedicationMasterData } from "@/lib/types";

/**
 * ENT medication master data
 * Used for rule-based extraction and guidance generation
 */
export const ENT_MEDICATIONS: MedicationMasterData[] = [
  // ─── 抗ヒスタミン薬 ───────────────────────────────────────────────────────
  {
    name: "セチリジン",
    aliases: ["ジルテック", "セチリジン塩酸塩", "アレルック"],
    category: "antihistamine",
    domain: "ent",
    guidanceJson: {
      mainPoints: [
        "1日1回就寝前の服用が基本であることを説明した",
        "アレルギー症状（くしゃみ・鼻汁・鼻閉）の改善に用いることを説明した",
      ],
      sideEffects: ["眠気が出ることがある旨を説明した", "口渇が生じることがある旨を説明した"],
      usageNotes: [
        "服用中の車の運転・機械の操作には注意が必要である旨を案内した",
        "アルコールとの併用は眠気が増強する可能性がある旨を説明した",
      ],
    },
    warningJson: [
      {
        message: "運転や機械操作を行う患者への抗ヒスタミン薬投与：眠気・注意力低下に留意が必要",
        severity: "caution",
      },
    ],
  },
  {
    name: "フェキソフェナジン",
    aliases: ["アレグラ", "フェキソフェナジン塩酸塩"],
    category: "antihistamine",
    domain: "ent",
    guidanceJson: {
      mainPoints: [
        "1日2回（朝・夕食前）の服用であることを説明した",
        "眠気が比較的少ない抗ヒスタミン薬であることを説明した",
      ],
      sideEffects: [
        "眠気は少ないが、まれに出現する場合があることを説明した",
        "口渇が生じることがある旨を説明した",
      ],
      usageNotes: [
        "グレープフルーツジュースとの同時服用は避けるよう案内した",
        "制酸薬との同時服用は吸収が低下する場合があることを説明した",
      ],
    },
    warningJson: [],
  },
  {
    name: "ロラタジン",
    aliases: ["クラリチン", "ロラタジン"],
    category: "antihistamine",
    domain: "ent",
    guidanceJson: {
      mainPoints: [
        "1日1回服用であることを説明した",
        "眠気が少ない非鎮静性抗ヒスタミン薬であることを説明した",
      ],
      sideEffects: ["まれに眠気が出ることがある旨を説明した"],
      usageNotes: ["食事の影響が少なく、いつ服用しても良いことを説明した"],
    },
    warningJson: [],
  },
  {
    name: "デスロラタジン",
    aliases: ["デザレックス", "デスロラタジン"],
    category: "antihistamine",
    domain: "ent",
    guidanceJson: {
      mainPoints: ["1日1回服用であることを説明した", "持続性の高い抗ヒスタミン薬であることを説明した"],
      sideEffects: ["眠気は少ないが個人差があることを説明した"],
      usageNotes: [],
    },
    warningJson: [],
  },
  {
    name: "オロパタジン",
    aliases: ["アレロック", "オロパタジン塩酸塩"],
    category: "antihistamine",
    domain: "ent",
    guidanceJson: {
      mainPoints: ["1日2回（朝・就寝前）の服用であることを説明した"],
      sideEffects: ["眠気・口渇が生じることがある旨を説明した"],
      usageNotes: ["服用中の車の運転・機械の操作には注意が必要である旨を案内した"],
    },
    warningJson: [
      {
        message: "オロパタジンは中等度の眠気を生じることがあり、運転に注意が必要",
        severity: "caution",
      },
    ],
  },
  // ─── ロイコトリエン受容体拮抗薬 ─────────────────────────────────────────
  {
    name: "モンテルカスト",
    aliases: ["シングレア", "キプレス", "モンテルカスト"],
    category: "leukotriene_antagonist",
    domain: "ent",
    guidanceJson: {
      mainPoints: [
        "1日1回就寝前の服用であることを説明した",
        "鼻閉症状に対して有効であることを説明した",
        "抗ヒスタミン薬と併用することが多い旨を説明した",
      ],
      sideEffects: [
        "まれに気分変動・不眠・悪夢が報告されていることを説明した",
        "精神神経系の副作用について気になる症状があれば医師へ相談するよう案内した",
      ],
      usageNotes: ["長期継続使用が多い薬であることを説明した"],
    },
    warningJson: [
      {
        message: "モンテルカスト：精神神経系副作用（気分変動・自傷念慮等）の報告があり、症状の変化に留意が必要",
        severity: "caution",
      },
    ],
  },
  // ─── 点鼻ステロイド ───────────────────────────────────────────────────────
  {
    name: "フルチカゾン点鼻液",
    aliases: ["フルナーゼ", "フルチカゾン", "アラミスト"],
    category: "nasal_steroid",
    domain: "ent",
    guidanceJson: {
      mainPoints: [
        "1日1〜2回、両鼻腔に噴霧することを説明した",
        "即効性はなく、効果が出るまで数日〜1〜2週間かかることを説明した",
        "継続的に使用することが重要であることを説明した",
      ],
      sideEffects: [
        "まれに鼻腔内の乾燥・刺激感が生じることがある旨を説明した",
        "全身性の副作用は少ない旨を説明した",
      ],
      usageNotes: [
        "使用手技（ボトルをよく振る、鼻の中壁側に向ける等）について説明した",
        "花粉症シーズンは症状が出る前から使用開始すると効果的であることを説明した",
      ],
    },
    warningJson: [],
  },
  {
    name: "モメタゾン点鼻液",
    aliases: ["ナゾネックス", "モメタゾンフランカルボン酸エステル"],
    category: "nasal_steroid",
    domain: "ent",
    guidanceJson: {
      mainPoints: [
        "1日1回の使用であることを説明した",
        "鼻炎症状の改善・維持のために継続使用が大切であることを説明した",
        "効果発現まで数日かかることを説明した",
      ],
      sideEffects: ["鼻腔内の刺激感、鼻出血が生じることがある旨を説明した"],
      usageNotes: ["正しい使用手技を指導した", "症状改善後も医師の指示に従い継続するよう案内した"],
    },
    warningJson: [],
  },
  // ─── 抗菌薬（耳鼻科で使用） ──────────────────────────────────────────────
  {
    name: "アモキシシリン",
    aliases: ["サワシリン", "アモキシシリン水和物", "パセトシン"],
    category: "antibiotic",
    domain: "ent",
    guidanceJson: {
      mainPoints: [
        "症状が改善しても処方された日数分を飲み切るよう説明した",
        "途中で自己中断すると耐性菌が生じやすくなることを説明した",
        "症状の改善が乏しい場合は再受診するよう案内した",
      ],
      sideEffects: [
        "下痢・軟便が生じることがある旨を説明した",
        "皮膚発疹等のアレルギー症状が出た場合は服用を中止し受診するよう案内した",
      ],
      usageNotes: ["食事の有無に関わらず服用できることを説明した"],
    },
    warningJson: [
      {
        message: "ペニシリン系抗菌薬：アレルギー歴の確認が必要",
        severity: "caution",
      },
    ],
  },
  {
    name: "クラリスロマイシン",
    aliases: ["クラリシッド", "クラリス", "クラリスロマイシン"],
    category: "antibiotic",
    domain: "ent",
    guidanceJson: {
      mainPoints: [
        "処方日数分を最後まで飲み切るよう説明した",
        "途中で中断しないよう説明した",
        "症状が改善しなければ再受診するよう案内した",
      ],
      sideEffects: [
        "苦味・胃部不快感・下痢が生じることがある旨を説明した",
        "他の薬との相互作用に注意が必要な薬であることを説明した",
      ],
      usageNotes: ["食後に服用すると消化器症状が軽減することを説明した"],
    },
    warningJson: [
      {
        message: "クラリスロマイシンは多くの薬物相互作用あり。他科処方・市販薬の確認が推奨される",
        severity: "caution",
      },
    ],
  },
  // ─── 去痰薬 ───────────────────────────────────────────────────────────────
  {
    name: "カルボシステイン",
    aliases: ["ムコダイン", "カルボシステイン"],
    category: "expectorant",
    domain: "ent",
    guidanceJson: {
      mainPoints: [
        "痰や鼻水を出やすくするための薬であることを説明した",
        "1日3回、食後の服用であることを説明した",
      ],
      sideEffects: ["胃部不快感が生じることがある旨を説明した"],
      usageNotes: ["水分を十分に摂ることで効果が高まることを説明した"],
    },
    warningJson: [],
  },
  {
    name: "アンブロキソール",
    aliases: ["ムコソルバン", "アンブロキソール塩酸塩"],
    category: "expectorant",
    domain: "ent",
    guidanceJson: {
      mainPoints: [
        "痰の粘度を下げ排出を助ける薬であることを説明した",
        "1日3回の服用であることを説明した",
      ],
      sideEffects: ["胃部不快感が生じることがある旨を説明した"],
      usageNotes: ["水分を積極的に摂るよう案内した"],
    },
    warningJson: [],
  },
  // ─── 点耳薬 ───────────────────────────────────────────────────────────────
  {
    name: "タリビッド耳科用液",
    aliases: ["オフロキサシン耳科用液", "タリビッド点耳"],
    category: "otic",
    domain: "ent",
    guidanceJson: {
      mainPoints: [
        "点耳の手順（横になり患耳を上に向け、静かに点耳後しばらくそのままにする）を説明した",
        "処方された回数・量を守るよう説明した",
      ],
      sideEffects: ["刺激感・耳の痒みが生じることがある旨を説明した"],
      usageNotes: ["使用前に手を洗うよう案内した", "容器の先端を耳・手に触れさせないよう説明した"],
    },
    warningJson: [],
  },
];
