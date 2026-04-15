"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Clock, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  type: "coding" | "debugging";
  points: number;
}

export default function ContestDashboard() {
  const router = useRouter();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [solvedProblemIds, setSolvedProblemIds] = useState<Set<string>>(new Set());
  const [contestState, setContestState] = useState({ phase: "not_started" as any, timeLeftSeconds: 0, displayText: "00:00:00" });
  const [liveAt, setLiveAt] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEventDetails() {
      const { data } = await supabase.from("events").select("live_at, status").limit(1).single();
      if (data?.live_at) {
        setLiveAt(data.live_at);
      }
    }
    fetchEventDetails();

    async function fetchProblems() {
      const { data, error } = await supabase.from("problems").select("*").order("order_index", { ascending: true });
      if (data && !error) {
        setProblems(data as Problem[]);
        
        const userStr = localStorage.getItem("user");
        const user = userStr ? JSON.parse(userStr) : null;
        if (user?.teamId) {
          const { data: scores } = await supabase.from("best_scores").select("problem_id").eq("team_id", user.teamId);
          if (scores) setSolvedProblemIds(new Set(scores.map(s => s.problem_id)));
        }
      }
      setLoading(false);
    }
    fetchProblems();
  }, []);

  // Centralized Timer Effect
  useEffect(() => {
    if (!liveAt) return;

    const { calculateContestState } = require("@/lib/contest-timing");
    
    const timer = setInterval(() => {
      const state = calculateContestState(liveAt);
      setContestState(state);

      if (state.phase === "ended") {
        clearInterval(timer);
        localStorage.removeItem("user");
        router.push("/login"); // Auto-logout
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [liveAt, router]);

  const activeProblems = problems.filter(p => {
    if (contestState.phase === "coding") return p.type === "coding";
    if (contestState.phase === "debugging") return p.type === "debugging";
    return true; // Show all for admin or preview (though this is participant page)
  });

  const diffColors: Record<string, string> = {
    Easy: "bg-success/20 text-success border-success/50",
    Medium: "bg-warning/20 text-warning border-warning/50",
    Hard: "bg-destructive/20 text-destructive border-destructive/50",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#0a0f1d]">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="font-mono text-primary text-sm animate-pulse italic">Synchronizing Problem Sets...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1d] p-8 flex flex-col items-center relative overflow-x-hidden">
      {/* BREAK OVERLAY */}
      {contestState.phase === "break" && (
        <div className="fixed inset-0 z-[100] bg-[#0a0f1d]/95 backdrop-blur-xl flex flex-col items-center justify-center text-center p-6 animate-in fade-in zoom-in duration-500">
           <div className="h-32 w-32 rounded-full border-4 border-primary border-t-transparent animate-spin mb-8 shadow-[0_0_50px_rgba(59,130,246,0.3)]" />
           <h2 className="text-5xl font-black text-white italic tracking-tighter mb-4 uppercase">Round 1: Complete</h2>
           <p className="text-xl text-primary font-mono animate-pulse mb-8">Debugging starts in {contestState.displayText}</p>
           <div className="max-w-md bg-white/5 border border-white/10 p-6 rounded-2xl">
              <p className="text-sm text-muted-foreground italic">Prepare your logic. Round 2 will provide problematic code templates that you must fix to pass test cases.</p>
           </div>
        </div>
      )}

      <div className="max-w-5xl w-full space-y-8">
        <div className="flex justify-between items-center border-b border-white/10 pb-6">
          <div>
            <h1 className="text-4xl font-black font-mono text-white tracking-tighter uppercase italic">
              {contestState.phase === "debugging" ? "Round 2: Debugging" : "Round 1: Coding"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 border-l-2 border-primary pl-3">
              {contestState.phase === "debugging" ? "Fix logical errors in provided templates" : "Phase 1: Logic & Algorithm Mastery"}
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-primary/10 border border-primary/20 px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.1)]">
            <Clock className="h-5 w-5 text-primary" />
            <div className="flex flex-col">
              <span className="text-[10px] text-primary/70 uppercase font-black font-mono leading-none tracking-widest">
                {contestState.phase === "break" ? "Break Ends In" : "Time Remaining"}
              </span>
              <span className={cn("text-2xl font-black font-mono tracking-tighter tabular-nums", contestState.timeLeftSeconds < 300 ? "text-destructive" : "text-white")}>
                {contestState.displayText}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeProblems.map((prob) => (
            <Card key={prob.id} className="border border-border/50 bg-card hover:border-primary/50 transition-colors flex flex-col group relative overflow-hidden">
               {solvedProblemIds.has(prob.id) && (
                 <div className="absolute top-2 right-2 z-10">
                   <Badge className="bg-success text-white border-0 py-1 px-2">✓ COMPLETED</Badge>
                 </div>
               )}
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-2 pr-20">
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">{prob.title}</CardTitle>
                </div>
                <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className={diffColors[prob.difficulty] || "text-foreground"}>
                      {prob.difficulty}
                    </Badge>
                    <Badge variant="secondary" className="bg-white/5 border-white/10 text-[10px] uppercase font-bold tracking-widest px-2">
                       {prob.type}
                    </Badge>
                </div>
                <CardDescription className="line-clamp-2 text-xs">
                  {prob.description}
                </CardDescription>
              </CardHeader>
              <div className="flex-1" />
              <CardFooter className="flex justify-between items-center border-t border-border pt-4">
                <div className="text-xs font-mono text-muted-foreground">
                  Score: <span className="text-primary font-bold">{prob.points} Pts</span>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => router.push(`/contest/${prob.id}`)}
                  className={cn(solvedProblemIds.has(prob.id) ? "variant-outline" : "bg-primary")}
                >
                  {solvedProblemIds.has(prob.id) ? "View Solution" : (prob.type === 'debugging' ? "Debug Code" : "Solve Challenge")}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        {activeProblems.length === 0 && (
          <div className="text-center text-muted-foreground py-24 border-2 border-dashed border-white/5 rounded-3xl">
            <Timer className="h-12 w-12 mx-auto mb-4 opacity-10" />
            <p className="font-mono text-sm">No problems available for this phase.</p>
          </div>
        )}
      </div>
    </div>
  );
}
