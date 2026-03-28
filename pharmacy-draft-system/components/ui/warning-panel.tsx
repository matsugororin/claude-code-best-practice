import { cn } from "@/lib/utils/cn";
import { AlertTriangle, AlertCircle, Info, ShieldAlert } from "lucide-react";
import type { Warning, WarningSeverity } from "@/lib/types";
import { SeverityBadge } from "./badge";

const SEVERITY_CONFIG: Record<
  WarningSeverity,
  { containerClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  critical: { containerClass: "border-red-500 bg-red-950/50", icon: ShieldAlert },
  warning: { containerClass: "border-orange-500 bg-orange-950/50", icon: AlertCircle },
  caution: { containerClass: "border-yellow-600 bg-yellow-950/50", icon: AlertTriangle },
  info: { containerClass: "border-blue-500 bg-blue-950/50", icon: Info },
};

interface WarningPanelProps {
  warnings: Warning[];
  compact?: boolean;
  className?: string;
}

export function WarningPanel({ warnings, compact = false, className }: WarningPanelProps) {
  if (warnings.length === 0) {
    return (
      <div className={cn("rounded-lg border border-border bg-muted/20 p-3 text-xs text-muted-foreground", className)}>
        警告事項なし
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {warnings.map((w, i) => {
        const { containerClass, icon: Icon } = SEVERITY_CONFIG[w.severity];
        return (
          <div
            key={i}
            className={cn("flex gap-2.5 rounded-lg border p-3", containerClass)}
          >
            <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              {!compact && (
                <div className="mb-1">
                  <SeverityBadge severity={w.severity} />
                </div>
              )}
              <p className="text-xs leading-relaxed">{w.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
