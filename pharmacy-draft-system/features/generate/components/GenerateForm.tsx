"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  Domain,
  PrescriptionType,
  ENTSymptomCategory,
  ENTPatientType,
  ENTFirstVisitType,
  MentalChiefComplaint,
  MentalSleepType,
  MentalTreatmentPhase,
  Warning,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WarningPanel } from "@/components/ui/warning-panel";
import { Mic, Loader2, Zap, Brain } from "lucide-react";

// ─── Disease options by domain ───────────────────────────────────────────────

const ENT_DISEASES = ["アレルギー性鼻炎", "急性鼻副鼻腔炎", "小児急性中耳炎", "慢性副鼻腔炎", "その他"];
const MENTAL_DISEASES = ["不眠", "うつ状態", "うつ病", "不安症状", "その他"];

const ENT_SYMPTOMS: ENTSymptomCategory[] = [
  "鼻汁", "鼻閉", "くしゃみ", "耳痛", "咽頭痛", "発熱", "咳", "耳閉感", "難聴",
];
const MENTAL_COMPLAINTS: MentalChiefComplaint[] = ["不眠", "不安", "気分低下", "焦燥", "その他"];
const MENTAL_SLEEP_TYPES: MentalSleepType[] = ["入眠困難", "中途覚醒", "早朝覚醒"];

// ─── Types ────────────────────────────────────────────────────────────────────

interface PreviewState {
  detectedMedications: string[];
  warnings: Warning[];
  sessionId: string;
}

// ─── Toggle chip component ────────────────────────────────────────────────────

function ToggleChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
        selected
          ? "bg-primary/20 border-primary text-primary"
          : "bg-transparent border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function GenerateForm() {
  const router = useRouter();

  // Core state
  const [domain, setDomain] = useState<Domain>("ent");
  const [freeText, setFreeText] = useState("");
  const [prescriptionType, setPrescriptionType] = useState<PrescriptionType>("do");
  const [selectedDiseases, setSelectedDiseases] = useState<string[]>([]);

  // ENT-specific
  const [entSymptoms, setEntSymptoms] = useState<ENTSymptomCategory[]>([]);
  const [patientType, setPatientType] = useState<ENTPatientType>("adult");
  const [seasonal, setSeasonal] = useState(false);
  const [firstVisitLike, setFirstVisitLike] = useState<ENTFirstVisitType>("continued");

  // Mental-specific
  const [mentalComplaints, setMentalComplaints] = useState<MentalChiefComplaint[]>([]);
  const [sleepTypes, setSleepTypes] = useState<MentalSleepType[]>([]);
  const [treatmentPhase, setTreatmentPhase] = useState<MentalTreatmentPhase>("continued");
  const [daytimeSleepiness, setDaytimeSleepiness] = useState(false);
  const [interruptionHistory, setInterruptionHistory] = useState(false);
  const [suicidalIdeationFlag, setSuicidalIdeationFlag] = useState(false);
  const [activationConcernFlag, setActivationConcernFlag] = useState(false);
  const [manicSwitchConcernFlag, setManicSwitchConcernFlag] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);

  const diseases = domain === "ent" ? ENT_DISEASES : MENTAL_DISEASES;

  function toggleDisease(d: string) {
    setSelectedDiseases((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  }

  function toggleMulti<T>(arr: T[], item: T, setArr: (v: T[]) => void) {
    setArr(arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]);
  }

  // Voice input stub
  function handleVoiceInput() {
    alert("音声入力はMVPでは未実装です（Web Speech API等で実装予定）");
  }

  async function handleGenerate() {
    if (!freeText.trim()) {
      setError("自由記述を入力してください");
      return;
    }
    if (selectedDiseases.length === 0) {
      setError("疾患を1つ以上選択してください");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Parse
      const parseRes = await fetch("/api/generate/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain,
          freeText,
          prescriptionType,
          diseases: selectedDiseases,
          entFields:
            domain === "ent"
              ? { symptomCategory: entSymptoms, patientType, seasonal, firstVisitLike }
              : undefined,
          mentalFields:
            domain === "mental"
              ? {
                  chiefComplaint: mentalComplaints,
                  sleepType: sleepTypes,
                  treatmentPhase,
                  daytimeSleepiness,
                  interruptionHistory,
                  suicidalIdeationFlag,
                  activationConcernFlag,
                  manicSwitchConcernFlag,
                }
              : undefined,
        }),
      });

      if (!parseRes.ok) {
        const err = await parseRes.json();
        throw new Error(err.error ?? "解析エラー");
      }

      const parseData = await parseRes.json();
      setPreview({
        detectedMedications: parseData.detectedMedications,
        warnings: parseData.warnings,
        sessionId: parseData.sessionId,
      });

      // Step 2: Generate draft
      const draftRes = await fetch("/api/generate/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: parseData.sessionId,
          structured: parseData.structured,
          warnings: parseData.warnings,
        }),
      });

      if (!draftRes.ok) {
        const err = await draftRes.json();
        throw new Error(err.error ?? "下書き生成エラー");
      }

      const draftData = await draftRes.json();
      router.push(`/result/${draftData.draftId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* ─── Left: Input Form ─────────────────────────────────────────────── */}
      <div className="lg:col-span-3 space-y-4">

        {/* Domain selector */}
        <Card>
          <CardHeader>
            <CardTitle>領域選択</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setDomain("ent"); setSelectedDiseases([]); }}
                className={`flex items-center gap-2 flex-1 justify-center rounded-lg border py-3 text-sm font-medium transition-colors ${
                  domain === "ent"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                <Zap className="h-4 w-4" />
                耳鼻科（時短重視）
              </button>
              <button
                type="button"
                onClick={() => { setDomain("mental"); setSelectedDiseases([]); }}
                className={`flex items-center gap-2 flex-1 justify-center rounded-lg border py-3 text-sm font-medium transition-colors ${
                  domain === "mental"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                <Brain className="h-4 w-4" />
                メンタル（安全重視）
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Free text input */}
        <Card>
          <CardHeader>
            <CardTitle>自由記述 <span className="text-destructive">*</span></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <textarea
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder={
                  domain === "ent"
                    ? "例：アレルギー性鼻炎、くしゃみ・鼻水多い。フルナーゼ点鼻・アレグラ継続。花粉の季節で悪化。"
                    : "例：不眠の訴えあり。入眠困難が続いている。レクサプロ10mg新規処方。不安感も強い。"
                }
                rows={5}
                className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              <button
                type="button"
                onClick={handleVoiceInput}
                className="absolute bottom-2 right-2 rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title="音声入力（スタブ）"
              >
                <Mic className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{freeText.length} / 2000文字</p>
          </CardContent>
        </Card>

        {/* Prescription type */}
        <Card>
          <CardHeader>
            <CardTitle>処方区分 <span className="text-destructive">*</span></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {(["do", "new", "changed"] as PrescriptionType[]).map((type) => (
                <ToggleChip
                  key={type}
                  label={
                    type === "do" ? "Do処方（継続）" : type === "new" ? "新規処方" : "処方変更あり"
                  }
                  selected={prescriptionType === type}
                  onClick={() => setPrescriptionType(type)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Disease selection */}
        <Card>
          <CardHeader>
            <CardTitle>疾患選択 <span className="text-destructive">*</span></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {diseases.map((d) => (
                <ToggleChip
                  key={d}
                  label={d}
                  selected={selectedDiseases.includes(d)}
                  onClick={() => toggleDisease(d)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Domain-specific fields */}
        {domain === "ent" && (
          <Card>
            <CardHeader>
              <CardTitle>耳鼻科詳細</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 text-xs text-muted-foreground">症状</p>
                <div className="flex flex-wrap gap-1.5">
                  {ENT_SYMPTOMS.map((s) => (
                    <ToggleChip
                      key={s}
                      label={s}
                      selected={entSymptoms.includes(s)}
                      onClick={() => toggleMulti(entSymptoms, s, setEntSymptoms)}
                    />
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-xs">
                <div>
                  <p className="mb-1.5 text-muted-foreground">患者タイプ</p>
                  <div className="flex gap-1.5">
                    <ToggleChip label="成人" selected={patientType === "adult"} onClick={() => setPatientType("adult")} />
                    <ToggleChip label="小児" selected={patientType === "child"} onClick={() => setPatientType("child")} />
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-muted-foreground">来局パターン</p>
                  <div className="flex gap-1.5">
                    <ToggleChip label="初回" selected={firstVisitLike === "first"} onClick={() => setFirstVisitLike("first")} />
                    <ToggleChip label="継続" selected={firstVisitLike === "continued"} onClick={() => setFirstVisitLike("continued")} />
                    <ToggleChip label="増悪" selected={firstVisitLike === "exacerbated"} onClick={() => setFirstVisitLike("exacerbated")} />
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-muted-foreground">季節性</p>
                  <ToggleChip label="季節性あり" selected={seasonal} onClick={() => setSeasonal(!seasonal)} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {domain === "mental" && (
          <Card>
            <CardHeader>
              <CardTitle>メンタル詳細</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 text-xs text-muted-foreground">主訴</p>
                <div className="flex flex-wrap gap-1.5">
                  {MENTAL_COMPLAINTS.map((c) => (
                    <ToggleChip key={c} label={c} selected={mentalComplaints.includes(c)} onClick={() => toggleMulti(mentalComplaints, c, setMentalComplaints)} />
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs text-muted-foreground">不眠のタイプ</p>
                <div className="flex flex-wrap gap-1.5">
                  {MENTAL_SLEEP_TYPES.map((t) => (
                    <ToggleChip key={t} label={t} selected={sleepTypes.includes(t)} onClick={() => toggleMulti(sleepTypes, t, setSleepTypes)} />
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs text-muted-foreground">治療フェーズ</p>
                <div className="flex flex-wrap gap-1.5">
                  {([["new", "新規"], ["increased", "増量"], ["continued", "継続"], ["tapered", "減量"]] as [MentalTreatmentPhase, string][]).map(([val, label]) => (
                    <ToggleChip key={val} label={label} selected={treatmentPhase === val} onClick={() => setTreatmentPhase(val)} />
                  ))}
                </div>
              </div>
              {/* Safety flags */}
              <div>
                <p className="mb-2 text-xs text-muted-foreground font-medium text-orange-400">安全確認フラグ</p>
                <div className="space-y-2">
                  {[
                    [suicidalIdeationFlag, setSuicidalIdeationFlag, "希死念慮・自傷念慮の疑い", true] as const,
                    [activationConcernFlag, setActivationConcernFlag, "賦活症候群が懸念される", false] as const,
                    [manicSwitchConcernFlag, setManicSwitchConcernFlag, "躁転の懸念あり", true] as const,
                    [interruptionHistory, setInterruptionHistory, "自己中断の既往あり", false] as const,
                    [daytimeSleepiness, setDaytimeSleepiness, "日中の眠気あり", false] as const,
                  ].map(([val, setter, label, isCritical]) => (
                    <label key={label} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={val}
                        onChange={(e) => setter(e.target.checked)}
                        className="rounded border-border"
                      />
                      <span className={`text-xs ${isCritical ? "text-red-300" : "text-foreground"}`}>
                        {isCritical ? "⚠ " : ""}{label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error display */}
        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Generate button */}
        <Button
          onClick={handleGenerate}
          disabled={isLoading || !freeText.trim() || selectedDiseases.length === 0}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              生成中...
            </>
          ) : (
            "薬歴下書きを生成"
          )}
        </Button>
      </div>

      {/* ─── Right: Preview ─────────────────────────────────────────────────── */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>検出結果プレビュー</CardTitle>
          </CardHeader>
          <CardContent>
            {preview ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">検出された医薬品</p>
                  {preview.detectedMedications.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {preview.detectedMedications.map((med) => (
                        <span key={med} className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                          {med}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">自由記述から医薬品は検出されませんでした</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">入力後、「生成」ボタンを押すと検出結果が表示されます</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>警告プレビュー</CardTitle>
          </CardHeader>
          <CardContent>
            {preview ? (
              <WarningPanel warnings={preview.warnings} />
            ) : (
              <p className="text-xs text-muted-foreground">生成後に警告が表示されます</p>
            )}
          </CardContent>
        </Card>

        <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">注意事項</p>
          <p>• AI出力は下書きです。必ず薬剤師が確認・修正してください</p>
          <p>• 入力にない情報は補完されません</p>
          <p>• 診断・医療判断の代替ではありません</p>
        </div>
      </div>
    </div>
  );
}
