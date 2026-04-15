"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import ProblemPanel from "@/components/ProblemPanel";
import CodeEditor from "@/components/CodeEditor";
import OutputPanel from "@/components/OutputPanel";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  points: number;
  constraints: string;
  examples: any[];
  firstTestCase?: string;
  type?: "coding" | "debugging";
  starter_code?: string;
}

export default function ProblemPage() {
  const { problemId } = useParams() as { problemId: string };
  const router = useRouter();
  
  const [problem, setProblem] = useState<Problem | null>(null);
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
  const [prevProblemId, setPrevProblemId] = useState<string | null>(null);
  const [canSubmit, setCanSubmit] = useState(false);
  const [teamWarnings, setTeamWarnings] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [liveAt, setLiveAt] = useState<string | null>(null);

  // Monitor Hooks & Violations
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    if (!user) return;

    // Initial fetch of warnings
    const fetchWarnings = async () => {
      const { data } = await supabase.from("teams").select("warnings").eq("id", user.teamId).single();
      if (data) setTeamWarnings(data.warnings || 0);
    };
    fetchWarnings();

    const reportViolation = async (type: string, details: string) => {
      try {
        const res = await fetch("/api/violations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ team_id: user.teamId, user_id: user.id, type, details })
        });
        const data = await res.json();
        if (data.disqualified) {
            toast.error("You have been disqualified for multiple violations.");
            router.push("/summary");
        } else if (data.warnings) {
            setTeamWarnings(data.warnings);
            toast.warning(`Violation logged! Warning ${data.warnings}/3`, { duration: 5000 });
        }
      } catch (err) {
        console.error("Failed to report violation");
      }
    };

    const handleVisibility = () => {
      if (document.hidden) reportViolation("tab_switch", "User switched tabs or minimized window");
    };

    const handleBlur = () => {
      reportViolation("tab_switch", "Window lost focus");
    };

    const handleCopy = () => {
      reportViolation("copy_paste", "User attempted to copy/paste text");
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("copy", handleCopy);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("copy", handleCopy);
    };
  }, [router]);

  // Unified Multi-Round Timer Sync
  useEffect(() => {
    async function fetchLiveAt() {
      const { data } = await supabase.from("events").select("live_at").limit(1).single();
      if (data?.live_at) setLiveAt(data.live_at);
    }
    fetchLiveAt();
  }, []);

  useEffect(() => {
    if (!liveAt) return;
    const { calculateContestState } = require("@/lib/contest-timing");
    
    const timer = setInterval(() => {
      const state = calculateContestState(liveAt);
      setTimeLeft(`${state.phase.toUpperCase()} ${state.displayText}`);

      if (state.phase === "ended") {
        clearInterval(timer);
        localStorage.removeItem("user");
        router.push("/login"); // Auto-logout
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [liveAt, router]);

  useEffect(() => {
    async function fetchProblem() {
      const { data: prob } = await supabase
        .from("problems")
        .select("*")
        .eq("id", problemId)
        .single();
        
      if (prob) {
        setProblem(prob);
        
        // Check if already solved/submitted
        const userStr = localStorage.getItem("user");
        const user = userStr ? JSON.parse(userStr) : null;
        if (user?.teamId) {
          const { data: existing } = await supabase
            .from("best_scores")
            .select("submission_id")
            .match({ team_id: user.teamId, problem_id: problemId })
            .maybeSingle();
          if (existing) setIsSubmitted(true);
        }
        // Also fetch first test case for default Run input
        const { data: tcs } = await supabase
          .from("test_cases")
          .select("input")
          .eq("problem_id", problemId)
          .limit(1);
        
        if (tcs && tcs.length > 0) {
           setProblem(prev => prev ? { ...prev, firstTestCase: tcs[0].input } : null);
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
          if (currentIndex > 0) {
            setPrevProblemId(allProbs[currentIndex - 1].id);
          } else {
            setPrevProblemId(null);
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
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          source_code: code, 
          language: language, 
          stdin: stdin,
          problemId: problemId 
        })
      });
      const result = await res.json();
      
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
        setCanSubmit(false);
      } else {
        setOutputStatus("success");
        // PHASE 1 LOCK: Only enable submit if the example test case (Phase 1) passed
        if (result.isFirstCaseMatch) {
          setCanSubmit(true);
          toast.success("Phase 1 Passed! You can now submit for full evaluation.");
        } else {
          setCanSubmit(false);
          toast.warning("Output mismatch. Fix your logic to enable the Submit button.");
        }
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
        setIsSubmitted(true);
        setFailureDetails(null);
        
        // Show metrics if available
        const metricsStr = result.metrics 
          ? `\n⏱️ Speed: ${result.metrics.timeValue}s | 💾 Memory: ${result.metrics.memoryValue}MB`
          : "";
          
        setOutputVal(`ACCEPTED! Score: ${result.rubric?.totalScore || 0}/8\n${metricsStr}\n\n${result.message}`);
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
      <TopBar timeLeft={timeLeft} warnings={teamWarnings} />

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
            isSubmitted={isSubmitted}
          />
        </div>

        {/* Right: Editor + Output */}
        <div className="flex-1 flex flex-col overflow-hidden gap-2">
          <div className="flex-1 overflow-hidden bg-card border border-border rounded-xl">
            <CodeEditor 
              onRun={handleRun} 
              onSubmit={handleSubmit} 
              defaultStdin={problem?.firstTestCase}
              problemId={problemId}
              canSubmit={canSubmit}
              starterCode={problem?.starter_code}
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
              prevProblemId={prevProblemId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
