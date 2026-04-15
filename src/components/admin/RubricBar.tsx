import { cn } from "@/lib/utils";

interface RubricBarProps {
  value: number;
  max: number;
  label?: string;
  showLabel?: boolean;
  compact?: boolean;
}

const RubricBar = ({ value, max, label = "", showLabel = true, compact = false }: RubricBarProps) => {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const color =
    pct === 100 ? "bg-success" : pct > 0 ? "bg-warning" : "bg-destructive/60";
  const textColor =
    pct === 100 ? "text-success" : pct > 0 ? "text-warning" : "text-destructive";

  return (
    <div className={cn("space-y-1", compact && "space-y-0.5")}>
      {showLabel && (
        <div className="flex justify-between text-xs font-mono">
          <span className="text-muted-foreground">{label}</span>
          <span className={cn("font-semibold", textColor)}>
            {value}/{max}
          </span>
        </div>
      )}
      <div className={cn("w-full rounded-full bg-secondary overflow-hidden", compact ? "h-1.5" : "h-2")}>
        <div
          className={cn("h-full rounded-full transition-all duration-500 ease-out", color)}
          style={{ width: `${Math.max(pct, pct > 0 ? 6 : 0)}%` }}
        />
      </div>
    </div>
  );
};

export default RubricBar;
