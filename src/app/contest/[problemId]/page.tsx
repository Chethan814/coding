"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import ProblemPanel from "@/components/ProblemPanel";
import CodeEditor from "@/components/CodeEditor";
import OutputPanel from "@/components/OutputPanel";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function ProblemPage() {
  const { problemId } = useParams() as { problemId: string };
  const router = useRouter();
  
  const [problem, setProblem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState("00:00:00");
  
  // Output panel state
  const [outputVal, setOutputVal] = useState<string>("");
  const [errorVal, setErrorVal] = useState<string>("");
  const [outputStatus, setOutputStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [failureDetails, setFailureDetails] = useState<any>(null);
  const [execTime, setExecTime] = useState<string>("");
  const [execMemory, setExecMemory] = useState<number>(0);
  const [nextProblemId, setNextProblemId] = useState<string | null>(null);

  // Timer logic
  useEffect(() => {
    let timer: any;
    async function startTimer() {
      const { data } = await supabase.from("events").select("end_time").limit(1).single();
      if (data?.end_time) {
        const endTime = new Date(data.end_time).getTime();
        
        timer = setInterval(() => {
          const now = new Date().getTime();
          const diff = endTime - now;
          
          if (diff <= 0) {
            setTimeLeft("00:00:00");
            clearInterval(timer);
            toast.error("Contest has ended!");
            router.push("/summary");
          } else {
            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft(
              `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
            );
          }
        }, 1000);
      }
    }
    startTimer();
    return () => clearInterval(timer);
  }, [router]);

  useEffect(() => {
    async function fetchProblem() {
      const { data: prob } = await supabase
        .from("problems")
        .select("*")
        .eq("id", problemId)
        .single();
        
      if (prob) {
        setProblem(prob);
        // Also fetch first test case for default Run input
        const { data: tcs } = await supabase
          .from("test_cases")
          .select("input")
          .eq("problem_id", problemId)
          .limit(1);
        
        if (tcs && tcs.length > 0) {
           setProblem(prev => ({ ...prev, firstTestCase: tcs[0].input }));
        }

        // Fetch NEXT problem ID based on order_index
        const { data: allProbs } = await supabase
          .from("problems")
          .select("id, order_index")
          .order("order_index", { ascending: true });
        
        if (allProbs) {
          const currentIndex = allProbs.findIndex(p => p.id === problemId);
          if (currentIndex !== -1 && currentIndex < allProbs.length - 1) {
            setNextProblemId(allProbs[currentIndex + 1].id);
          } else {
            setNextProblemId(null);
          }
        }
      }
      setLoading(false);
    }
    if (problemId) fetchProblem();
  }, [problemId]);

  const handleRun = async (code: string, language: string, stdin: string) => {
    setOutputStatus("running");
    setErrorVal("");
    setOutputVal("Compiling and executing...");
    setFailureDetails(null);
    try {
      // REQUEST PAYLOAD LOG
      console.log("🚀 SENDING RUN REQUEST:", { source_code: code, language, stdin });

      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          source_code: code, 
          language: language, 
          stdin: stdin 
        })
      });
      const result = await res.json();
      
      // RESPONSE LOG
      console.log("📥 RECEIVED EXEC RESPONSE:", result);
      
      if (result.error) {
        setErrorVal(result.error);
        setOutputStatus("error");
        return;
      }
      
      setOutputVal(result.stdout || "");
      setExecTime(result.time || "");
      setExecMemory(result.memory || 0);
      
      if (result.stderr || (result.status && result.status.id !== 3)) {
        setErrorVal(result.stderr || result.compile_output || result.status?.description || "Runtime Error");
        setOutputStatus("error");
      } else {
        setOutputStatus("success");
      }
    } catch (e: any) {
      setErrorVal("Connection lost or server error. Please try again.");
      setOutputStatus("error");
    }
  };

  const handleSubmit = async (code: string, language: string) => {
    setOutputStatus("running");
    setErrorVal("");
    setOutputVal("Evaluating your solution against all test cases...");
    setFailureDetails(null);
    
    // Get user/team from local storage
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;

    try {
      // SUBMIT PAYLOAD LOG
      console.log("🔥 SENDING SUBMISSION:", { problemId, language, teamId: user?.teamId });

      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          problemId, 
          code, 
          language,
          userId: user?.id,
          teamId: user?.teamId
        })
      });
      const result = await res.json();
      
      // SUBMIT RESPONSE LOG
      console.log("🏆 SUBMISSION RESULT:", result);
      
      if (result.error) throw new Error(result.error);

      if (result.status === "error" || result.status === "wrong") {
        setOutputStatus("error");
        setErrorVal(result.message);
        if (result.failureDetails) {
          setFailureDetails(result.failureDetails);
          setOutputVal(result.message);
        }
      } else {
        setOutputStatus("success");
        setFailureDetails(null);
        setOutputVal(`ACCEPTED! Score: ${result.rubric.total_score}/8\n\n${result.message}`);
        toast.success("Submission Successful!");
      }
    } catch (e: any) {
      setErrorVal(e.message);
      setOutputStatus("error");
    }
  };

  if (loading) return (
    <div className="h-screen bg-background flex flex-col items-center justify-center gap-4">
      <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="font-mono text-sm text-muted-foreground">Initializing Environment...</p>
    </div>
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <TopBar timeLeft={timeLeft} />

      <div className="flex-1 flex overflow-hidden p-2 gap-2">
        {/* Left: Problem */}
        <div className="w-[40%] overflow-hidden bg-card border border-border rounded-xl">
          <ProblemPanel 
            title={problem?.title} 
            description={problem?.description} 
            difficulty={problem?.difficulty}
            points={problem?.points}
            constraints={problem?.constraints}
            examples={problem?.examples}
          />
        </div>

        {/* Right: Editor + Output */}
        <div className="flex-1 flex flex-col overflow-hidden gap-2">
          <div className="flex-1 overflow-hidden bg-card border border-border rounded-xl">
            <CodeEditor 
              onRun={handleRun} 
              onSubmit={handleSubmit} 
              defaultStdin={problem?.firstTestCase}
            />
          </div>
          <div className="h-[250px] bg-card border border-border rounded-xl">
            <OutputPanel 
              output={outputVal} 
              error={errorVal} 
              status={outputStatus} 
              failureDetails={failureDetails} 
              time={execTime}
              memory={execMemory}
              nextProblemId={nextProblemId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
