import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

interface WarningOverlayProps {
  message?: string;
  warningCount?: number;
  maxWarnings?: number;
  visible?: boolean;
}

const WarningOverlay = ({
  message = "Tab switch detected",
  warningCount = 1,
  maxWarnings = 3,
  visible = false,
}: WarningOverlayProps) => {
  const [show, setShow] = useState(visible);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="panel max-w-md w-full mx-4 p-6 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-warning mx-auto" />
        <h3 className="text-lg font-semibold text-foreground">Warning Issued</h3>
        <p className="text-sm text-muted-foreground">{message}</p>
        <div className="font-mono text-2xl font-bold text-warning">
          {warningCount} / {maxWarnings}
        </div>
        <p className="text-xs text-muted-foreground">
          Reaching {maxWarnings} warnings will result in disqualification.
        </p>
        <button
          onClick={() => setShow(false)}
          className="mt-4 px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
        >
          I Understand
        </button>
      </div>
    </div>
  );
};

export default WarningOverlay;
