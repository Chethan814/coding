import { useState, useEffect } from "react";
import { Play, Send, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface CodeEditorProps {
  onRun?: (code: string, language: string, stdin: string) => void;
  onSubmit?: (code: string, language: string) => void;
  defaultStdin?: string;
}

const TEMPLATES: Record<string, string> = {
  c: `// C Language - Competitive Programming Template
#include <stdio.h>

int main() {
    int a, b;
    
    // IMPORTANT: Read input from stdin
    // Example: Reading two space-separated integers
    if (scanf("%d %d", &a, &b) == 2) {
        // Print output to stdout
        printf("%d\\n", a + b);
    }
    
    return 0;
}`,
  python: `# Python 3 - Competitive Programming Template
import sys

def solve():
    # IMPORTANT: Read input from stdin
    # Example: Reading all numbers from space-separated input
    line = sys.stdin.read()
    if line:
        nums = list(map(int, line.split()))
        
        # Print results to stdout
        if len(nums) >= 2:
            print(nums[0] + nums[1])

if __name__ == "__main__":
    solve()`,
  java: `// Java - Competitive Programming Template
// IMPORTANT: Use "public class Main" for Judge0
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        
        // IMPORTANT: Read input from System.in
        // Example: Reading integers until EOF
        if (sc.hasNextInt()) {
            int a = sc.nextInt();
            int b = sc.nextInt();
            
            // Print output to System.out
            System.out.println(a + b);
        }
    }
}`,
};

const CodeEditor = ({ onRun, onSubmit, defaultStdin = "" }: CodeEditorProps) => {
  const [language, setLanguage] = useState("python"); // Changed default to Python for convenience
  const [code, setCode] = useState(TEMPLATES.python);
  const [stdin, setStdin] = useState(defaultStdin);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (defaultStdin && !stdin) {
      setStdin(defaultStdin);
    }
  }, [defaultStdin]);

  const handleLanguageChange = (val: string) => {
    setLanguage(val);
    setCode(TEMPLATES[val] || "");
  };

  const handleRun = () => {
    setIsRunning(true);
    onRun?.(code, language, stdin);
    // Loading state is now handled by the parent's response
    setTimeout(() => setIsRunning(false), 3000);
  };

  const handleSubmit = () => {
    onSubmit?.(code, language);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="panel-header flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Editor</span>
        </div>
        <Select value={language} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-28 h-7 text-xs bg-muted border-border focus:ring-1 focus:ring-primary">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="c">C (GCC)</SelectItem>
            <SelectItem value="python">Python 3</SelectItem>
            <SelectItem value="java">Java 17</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0 flex">
            {/* Line numbers */}
            <div className="w-12 bg-muted/50 border-r border-border py-3 text-right pr-2 overflow-hidden">
              {code.split("\n").map((_, i) => (
                <div key={i} className="font-mono text-xs text-muted-foreground leading-5">
                  {i + 1}
                </div>
              ))}
            </div>
            {/* Code area */}
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 bg-transparent p-3 font-mono text-xs leading-5 text-foreground resize-none outline-none overflow-auto"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Stdin */}
        <div className="border-t border-border">
          <div className="px-3 py-1.5 text-xs text-muted-foreground uppercase tracking-wider">
            Stdin
          </div>
          <Textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="Enter input..."
            className="border-0 rounded-none bg-transparent font-mono text-xs h-16 resize-none focus-visible:ring-0"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 p-3 border-t border-border">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleRun}
            disabled={isRunning}
            className="font-mono text-xs"
          >
            <Play className="h-3 w-3 mr-1" />
            {isRunning ? "Running..." : "Run Code"}
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            className="font-mono text-xs bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Send className="h-3 w-3 mr-1" />
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
