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
  const [timeLeft, setTimeLeft] = useState<string>("00:00:00");
  const [secondsRemaining, setSecondsRemaining] = useState<number>(3600);

  useEffect(() => {
    async function fetchProblems() {
      const { data, error } = await supabase.from("problems").select("*").order("order_index", { ascending: true });
      if (data && !error) {
        setProblems(data as Problem[]);
        
        // Fetch solved status
        const userStr = localStorage.getItem("user");
        const user = userStr ? JSON.parse(userStr) : null;
        if (user?.teamId) {
          const { data: scores } = await supabase
            .from("best_scores")
            .select("problem_id")
            .eq("team_id", user.teamId);
          
          if (scores) {
            setSolvedProblemIds(new Set(scores.map(s => s.problem_id)));
          }
        }
      }
      setLoading(false);
    }
    
    fetchProblems();

    // Fetch global timer and sync (LocalStorage + DB fallback)
    let timer: any;
    async function syncTimer() {
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user?.teamId) return;

      const DURATION = 90 * 60 * 1000; // 90 mins
      
      // 1. Immediate Source: LocalStorage
      let startTimeStr = localStorage.getItem(`contest_start_${user.teamId}`);
      
      // 2. Secondary Source: Database
      if (!startTimeStr) {
        const { data: team } = await supabase.from("teams").select("start_time").eq("id", user.teamId).single();
        if (team?.start_time) {
          startTimeStr = team.start_time;
          localStorage.setItem(`contest_start_${user.teamId}`, startTimeStr || "");
        }
      }

      if (startTimeStr) {
        const startTime = new Date(startTimeStr).getTime();

        timer = setInterval(() => {
          const now = new Date().getTime();
          const remaining = startTime + DURATION - now;

          if (remaining <= 0) {
            setTimeLeft("00:00:00");
            clearInterval(timer);
            localStorage.removeItem("user");
            localStorage.removeItem(`contest_start_${user.teamId}`);
            router.push("/login");
          } else {
            const h = Math.floor(remaining / (1000 * 60 * 60));
            const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((remaining % (1000 * 60)) / 1000);
            setSecondsRemaining(Math.floor(remaining / 1000));
            setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
          }
        }, 1000);
      } else {
        setTimeLeft("NOT STARTED");
      }
    }

    syncTimer();
    return () => clearInterval(timer);
  }, []);

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
    <div className="min-h-screen bg-[#0a0f1d] p-8 flex flex-col items-center">
      <div className="max-w-5xl w-full space-y-8">
        <div className="flex justify-between items-center border-b border-white/10 pb-6">
          <div>
            <h1 className="text-4xl font-black font-mono text-white tracking-tighter uppercase italic">Active Challenges</h1>
            <p className="text-sm text-muted-foreground mt-1 border-l-2 border-primary pl-3">Phase 1: Logic & Algorithm Mastery</p>
          </div>
          
          <div className="flex items-center gap-4 bg-primary/10 border border-primary/20 px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.1)]">
            <Timer className="h-5 w-5 text-primary" />
            <div className="flex flex-col">
              <span className="text-[10px] text-primary/70 uppercase font-black font-mono leading-none tracking-widest">Time Remaining</span>
              <span className={cn("text-2xl font-black font-mono tracking-tighter tabular-nums", secondsRemaining < 300 ? "text-destructive" : "text-white")}>
                {timeLeft}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {problems.map((prob) => (
            <Card key={prob.id} className="border border-border/50 bg-card hover:border-primary/50 transition-colors flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-lg">{prob.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    {solvedProblemIds.has(prob.id) && (
                      <Badge className="bg-success text-white border-0">
                        Submitted
                      </Badge>
                    )}
                    <Badge variant="outline" className={diffColors[prob.difficulty] || "text-foreground"}>
                      {prob.difficulty}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="line-clamp-2 text-xs">
                  {prob.description}
                </CardDescription>
              </CardHeader>
              <div className="flex-1" />
              <CardFooter className="flex justify-between items-center border-t border-border pt-4">
                <div className="text-xs font-mono text-muted-foreground flex items-center gap-2">
                  <span>Pts: {prob.points}</span>
                  <span className="capitalize px-2 py-0.5 rounded-sm bg-secondary">{prob.type}</span>
                </div>
                <Button size="sm" onClick={() => router.push(`/contest/${prob.id}`)}>
                  Solve
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        {problems.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            No problems available for this phase.
          </div>
        )}
      </div>
    </div>
  );
}
