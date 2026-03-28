"use client";

import { useState, useCallback } from "react";
import type { DraftSections, Warning, Domain } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WarningPanel } from "@/components/ui/warning-panel";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Edit2, Save, CheckCircle, Loader2 } from "lucide-react";

// ─── Section component with inline edit + copy ────────────────────────────────

interface SectionProps {
  label: string;
  sectionKey: keyof DraftSections;
  value: string;
  onEdit: (key: keyof DraftSections, value: string) => void;
  isEditing: boolean;
  setEditing: (key: keyof DraftSections | null) => void;
}

function Section({ label, sectionKey, value, onEdit, isEditing, setEditing }: SectionProps) {
  const [copied, setCopied] = useState(false);
  const [editValue, setEditValue] = useState(value);

  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function handleSave() {
    onEdit(sectionKey, editValue);
    setEditing(null);
  }

  function handleCancel() {
    setEditValue(value);
    setEditing(null);
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-secondary/50">
        <span className="text-xs font-bold text-primary tracking-wider">[{label}]</span>
        <div className="flex items-center gap-1">
          {!isEditing && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  setEditValue(value);
                  setEditing(sectionKey);
                }}
                title="編集"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleCopy}
                title="このセクションをコピー"
              >
                {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
              </Button>
            </>
          )}
          {isEditing && (
            <>
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={handleCancel}>
                キャンセル
              </Button>
              <Button size="sm" className="h-6 text-xs" onClick={handleSave}>
                <Save className="h-3 w-3 mr-1" />
                保存
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="px-4 py-3">
        {isEditing ? (
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            rows={Math.max(3, (editValue.match(/\n/g) ?? []).length + 2)}
            className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            autoFocus
          />
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">{value}</p>
        )}
      </div>
    </div>
  );
}

// ─── Main viewer ──────────────────────────────────────────────────────────────

interface DraftViewerProps {
  draftId: string;
  initialSections: DraftSections;
  warnings: Warning[];
  domain: Domain;
  diseases: string[];
  prescriptionType: string;
  status: "draft" | "confirmed";
}

export function DraftViewer({
  draftId,
  initialSections,
  warnings,
  domain,
  diseases,
  prescriptionType,
  status: initialStatus,
}: DraftViewerProps) {
  const [sections, setSections] = useState<DraftSections>(initialSections);
  const [editingSection, setEditingSection] = useState<keyof DraftSections | null>(null);
  const [status, setStatus] = useState(initialStatus);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [fullCopied, setFullCopied] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const prescriptionLabel: Record<string, string> = {
    do: "Do処方",
    new: "新規処方",
    changed: "処方変更",
  };

  const criticalWarnings = warnings.filter((w) => w.severity === "critical");
  const otherWarnings = warnings.filter((w) => w.severity !== "critical");

  const handleEdit = useCallback(
    async (key: keyof DraftSections, value: string) => {
      setSections((prev) => ({ ...prev, [key]: value }));
      setIsSaving(true);
      try {
        await fetch(`/api/drafts/${draftId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [`section${key}`]: value }),
        });
        setSaveMessage("保存しました");
        setTimeout(() => setSaveMessage(null), 2000);
      } catch {
        setSaveMessage("保存に失敗しました");
      } finally {
        setIsSaving(false);
      }
    },
    [draftId]
  );

  async function handleConfirm() {
    setIsConfirming(true);
    try {
      const res = await fetch(`/api/drafts/${draftId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "confirmed" }),
      });
      if (res.ok) {
        setStatus("confirmed");
      }
    } finally {
      setIsConfirming(false);
    }
  }

  function handleFullCopy() {
    const text = [
      `[S] ${sections.S}`,
      `[O] ${sections.O}`,
      `[A] ${sections.A}`,
      `[Ep] ${sections.Ep}`,
      `[OP] ${sections.OP}`,
    ].join("\n\n");

    navigator.clipboard.writeText(text).then(() => {
      setFullCopied(true);
      setTimeout(() => setFullCopied(false), 2000);
    });
  }

  const SECTION_LABELS: [keyof DraftSections, string][] = [
    ["S", "S: 患者訴え・服薬状況"],
    ["O", "O: 処方内容・客観的情報"],
    ["A", "A: 評価・注意点"],
    ["Ep", "Ep: 服薬指導内容"],
    ["OP", "OP: 次回確認事項"],
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* ─── Left: Draft sections ─────────────────────────────────────────── */}
      <div className="lg:col-span-3 space-y-3">
        {/* Critical warnings at top */}
        {criticalWarnings.length > 0 && (
          <div className="rounded-lg border-2 border-red-500 bg-red-950/30 p-4">
            <p className="mb-2 text-xs font-bold text-red-300 uppercase tracking-wider">重大な警告</p>
            <WarningPanel warnings={criticalWarnings} compact />
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Badge variant={domain === "ent" ? "default" : "secondary"}>
              {domain === "ent" ? "耳鼻科" : "メンタル"}
            </Badge>
            <Badge variant="outline">{prescriptionLabel[prescriptionType]}</Badge>
            {status === "confirmed" && (
              <Badge className="bg-green-900 text-green-300">確定済み</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {saveMessage && (
              <span className="text-xs text-muted-foreground">{saveMessage}</span>
            )}
            {isSaving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            <Button variant="outline" size="sm" onClick={handleFullCopy}>
              {fullCopied ? (
                <><Check className="h-3 w-3" /> コピー済み</>
              ) : (
                <><Copy className="h-3 w-3" /> 全文コピー</>
              )}
            </Button>
            {status !== "confirmed" && (
              <Button size="sm" onClick={handleConfirm} disabled={isConfirming}>
                {isConfirming ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <><CheckCircle className="h-3 w-3" /> 確定保存</>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Disease tags */}
        <div className="flex flex-wrap gap-1.5">
          {diseases.map((d) => (
            <span key={d} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs">
              {d}
            </span>
          ))}
        </div>

        {/* Sections */}
        {SECTION_LABELS.map(([key, label]) => (
          <Section
            key={key}
            label={label}
            sectionKey={key}
            value={sections[key]}
            onEdit={handleEdit}
            isEditing={editingSection === key}
            setEditing={setEditingSection}
          />
        ))}
      </div>

      {/* ─── Right: Warnings + Basis ─────────────────────────────────────── */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>
              警告 ({warnings.length})
              {criticalWarnings.length > 0 && (
                <span className="ml-2 text-xs text-red-400">重大 {criticalWarnings.length}件</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WarningPanel warnings={warnings} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>生成根拠（簡易）</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1.5">
            <p>• 自由記述からルールベースで医薬品を抽出</p>
            <p>• 疾患・処方区分・領域に基づきテンプレートを選択</p>
            <p>• マスタデータの服薬指導内容を組み合わせて文章化</p>
            <p>• 安全警告ルールにより{warnings.length}件の警告を生成</p>
            <p className="mt-2 pt-2 border-t border-border text-yellow-600">
              ⚠ この下書きはAIによるものです。必ず薬剤師が確認・修正してください。
            </p>
          </CardContent>
        </Card>

        {otherWarnings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>その他の注意点</CardTitle>
            </CardHeader>
            <CardContent>
              <WarningPanel warnings={otherWarnings} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
