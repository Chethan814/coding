import { Terminal, CheckCircle, XCircle, AlertCircle, ArrowRight, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

interface OutputPanelProps {
  output?: string;
  error?: string;
  status?: "idle" | "running" | "success" | "error";
  failureDetails?: {
    input: string;
    expected: string;
    actual: string;
    error?: string;
  } | null;
  time?: string;
  memory?: number;
  nextProblemId?: string | null;
  prevProblemId?: string | null;
}

const OutputPanel = ({
  output = "",
  error = "",
  status = "idle",
  failureDetails = null,
  time,
  memory,
  nextProblemId = null,
  prevProblemId = null
}: OutputPanelProps) => {
  const router = useRouter();
  const statusConfig = {
    idle: { icon: Terminal, color: "text-muted-foreground", label: "Ready" },
    running: { icon: Terminal, color: "text-primary animate-pulse", label: "Executing..." },
    success: { icon: CheckCircle, color: "text-success", label: "Accepted" },
    error: { icon: XCircle, color: "text-destructive", label: "Attempt Failed" },
  };

  const current = statusConfig[status];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="panel-header flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Console</span>
        <div className={cn("flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border bg-muted/50", current.color)}>
          <current.icon className="h-3 w-3" />
          <span className="font-mono">{current.label}</span>
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {status === "idle" && (
          <div className="text-muted-foreground text-xs font-mono h-full flex items-center justify-center opacity-50 italic">
            Waiting for execution...
          </div>
        )}

        {failureDetails && (
          <div className="space-y-3 bg-destructive/5 border border-destructive/20 rounded-lg p-3">
            <div className="flex items-center gap-2 text-destructive font-bold text-xs uppercase">
              <AlertCircle className="h-3.5 w-3.5" />
              Failed Test Case Breakdown
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
               <div className="space-y-1">
                 <p className="text-[10px] text-muted-foreground uppercase">Input</p>
                 <pre className="bg-muted p-2 rounded text-[11px] font-mono whitespace-pre-wrap">{failureDetails.input}</pre>
               </div>
               <div className="space-y-1">
                 <p className="text-[10px] text-muted-foreground uppercase">Expected Output</p>
                 <pre className="bg-success/10 border border-success/20 p-2 rounded text-[11px] font-mono text-success whitespace-pre-wrap">{failureDetails.expected}</pre>
               </div>
               <div className="space-y-1">
                 <p className="text-[10px] text-muted-foreground uppercase">Actual Output</p>
                 <pre className="bg-destructive/10 border border-destructive/20 p-2 rounded text-[11px] font-mono text-destructive whitespace-pre-wrap">{failureDetails.actual || "(Empty)"}</pre>
               </div>
            </div>
          </div>
        )}

        {error && !failureDetails && (
          <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
             <p className="text-[10px] font-bold text-destructive uppercase mb-1">Execution Error</p>
             <pre className="font-mono text-xs text-destructive whitespace-pre-wrap">{error}</pre>
          </div>
        )}

        {output && (
          <div className="space-y-4">
             <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Standard Output</p>
                    {(time || memory) && (
                      <div className="flex gap-3 text-[9px] font-mono text-muted-foreground uppercase">
                          {time && <span>Time: {time}s</span>}
                          {memory && <span>Memory: {(memory / 1024).toFixed(1)}MB</span>}
                      </div>
                    )}
                </div>
                <pre className="font-mono text-xs text-foreground bg-muted/20 p-3 rounded-lg border border-border/50 whitespace-pre-wrap">
                  {output}
                </pre>
             </div>

             {status === "success" && (
                <div className="flex items-center gap-3 pt-2">
                   {prevProblemId && (
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => router.push(`/contest/${prevProblemId}`)}
                        className="font-mono text-xs gap-2"
                      >
                         Previous
                      </Button>
                   )}
                   {nextProblemId && (
                      <Button 
                        size="sm" 
                        onClick={() => router.push(`/contest/${nextProblemId}`)}
                        className="bg-success text-success-foreground hover:bg-success/90 font-mono text-xs gap-2"
                      >
                         Next Challenge <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                   )}
                   <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => router.push("/contest")}
                      className="border-primary/20 text-primary hover:bg-primary/5 font-mono text-xs gap-2"
                   >
                      <LayoutGrid className="h-3.5 w-3.5" /> Back to Arena
                   </Button>
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OutputPanel;
