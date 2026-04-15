import { Badge } from "@/components/ui/badge";

interface Example {
  input: string;
  output: string;
  explanation?: string;
}

interface ProblemPanelProps {
  title?: string;
  difficulty?: "Easy" | "Medium" | "Hard";
  points?: number;
  description?: string;
  constraints?: string | string[];
  examples?: Example[];
}

const ProblemPanel = ({
  title = "Two Sum",
  difficulty = "Medium",
  points = 100,
  description = "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
  constraints = "2 ≤ nums.length ≤ 10⁴\n-10⁹ ≤ nums[i] ≤ 10⁹\n-10⁹ ≤ target ≤ 10⁹\nOnly one valid answer exists.",
  examples = [
    {
      input: "nums = [2,7,11,15], target = 9",
      output: "[0,1]",
      explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
    },
    {
      input: "nums = [3,2,4], target = 6",
      output: "[1,2]",
    },
  ],
}: ProblemPanelProps) => {
  const difficultyColor = {
    Easy: "text-success border-success",
    Medium: "text-warning border-warning",
    Hard: "text-destructive border-destructive",
  };

  const renderConstraints = () => {
    if (Array.isArray(constraints)) return constraints;
    if (typeof constraints === "string") return constraints.split("\n");
    return [];
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="panel-header flex items-center justify-between">
        <span>Problem</span>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={difficultyColor[difficulty]}>
            {difficulty}
          </Badge>
          <Badge variant="outline" className="border-primary text-primary font-mono">
            {points} pts
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 text-sm">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>

        <div className="text-secondary-foreground leading-relaxed whitespace-pre-line">
          {description}
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <div className="h-1 w-1 bg-primary rounded-full" />
            Constraints
          </h3>
          <div className="space-y-1.5 ml-3">
            {renderConstraints().filter(c => c.trim()).map((c, i) => (
              <div key={i} className="font-mono text-[11px] text-muted-foreground/80 leading-relaxed">
                • {c}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground">
            Examples
          </h3>
          {examples.map((ex, i) => (
            <div key={i} className="bg-muted rounded-md p-3 space-y-2 border border-border">
              <div>
                <span className="text-xs text-muted-foreground">Input:</span>
                <pre className="font-mono text-xs text-foreground mt-1">{ex.input}</pre>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Output:</span>
                <pre className="font-mono text-xs text-foreground mt-1">{ex.output}</pre>
              </div>
              {ex.explanation && (
                <div>
                  <span className="text-xs text-muted-foreground">Explanation:</span>
                  <p className="text-xs text-secondary-foreground mt-1">{ex.explanation}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
           <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
             <div className="h-1.5 w-1.5 bg-primary rounded-full animate-pulse" />
             Execution Rules
           </h3>
           <p className="text-[11px] text-muted-foreground leading-relaxed">
             Your code must read from <span className="text-primary font-bold">Standard Input (stdin)</span> and print its results to <span className="text-primary font-bold">Standard Output (stdout)</span>.
           </p>
           <ul className="text-[10px] space-y-1 text-muted-foreground/80 list-disc ml-4">
             <li>C: Use <code className="text-primary">scanf</code> or <code className="text-primary">gets</code></li>
             <li>Python: Use <code className="text-primary">input()</code> or <code className="text-primary">sys.stdin</code></li>
             <li>Java: Use <code className="text-primary">Scanner(System.in)</code> inside <code className="text-primary">public class Main</code></li>
           </ul>
        </div>
      </div>
    </div>
  );
};

export default ProblemPanel;
