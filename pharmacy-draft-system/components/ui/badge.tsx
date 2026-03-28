import { cn } from "@/lib/utils/cn";
import type { WarningSeverity } from "@/lib/types";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "outline" | "secondary" | "destructive";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        variant === "default" && "bg-primary/20 text-primary ring-primary/30",
        variant === "outline" && "bg-transparent text-foreground ring-border",
        variant === "secondary" && "bg-secondary text-secondary-foreground ring-secondary",
        variant === "destructive" && "bg-destructive/20 text-red-300 ring-destructive/30",
        className
      )}
    >
      {children}
    </span>
  );
}

const SEVERITY_STYLES: Record<WarningSeverity, string> = {
  critical: "bg-red-950 text-red-300 ring-red-500/50",
  warning: "bg-orange-950 text-orange-300 ring-orange-500/50",
  caution: "bg-yellow-950 text-yellow-300 ring-yellow-600/50",
  info: "bg-blue-950 text-blue-300 ring-blue-500/50",
};

export function SeverityBadge({ severity }: { severity: WarningSeverity }) {
  const labels: Record<WarningSeverity, string> = {
    critical: "重大",
    warning: "警告",
    caution: "注意",
    info: "情報",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ring-1 ring-inset",
        SEVERITY_STYLES[severity]
      )}
    >
      {labels[severity]}
    </span>
  );
}
