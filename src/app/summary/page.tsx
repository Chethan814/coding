"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Trophy, TrendingUp, AlertCircle, CheckCircle2, BarChart3, Loader2 } from "lucide-react";
import { MAX_PER_PROBLEM, MAX_PER_RUBRIC } from "@/types/admin";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface ProblemResult {
  id: string;
  problemName: string;
  rubric: {
    output: number;
    testCases: number;
    timeComplexity: number;
    spaceComplexity: number;
  };
}

export default function SubmissionSummary() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<ProblemResult[]>([]);
  const [rank, setRank] = useState<number>(0);
  const [totalTeams, setTotalTeams] = useState<number>(0);
  const [expandedProblem, setExpandedProblem] = useState<number | null>(null);

  useEffect(() => {
    async function fetchData() {
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user?.teamId) {
        router.push("/login");
        return;
      }

      try {
        // 1. Fetch team's submissions & rubric scores
        const { data: subs } = await supabase
          .from("submissions")
          .select(`
            problem_id,
            problems (title),
            rubric_scores (
              output_score,
              test_case_score,
              time_complexity_score,
              space_complexity_score
            )
          `)
          .eq("team_id", user.teamId);

        // Map best scores per problem
        const bestResults: Record<string, ProblemResult> = {};
        (subs || []).forEach((sub: any) => {
          const r = sub.rubric_scores?.[0];
          if (!r) return;
          const score = r.output_score + r.test_case_score + r.time_complexity_score + r.space_complexity_score;
          const pid = sub.problem_id;
          
          if (!bestResults[pid] || score > (bestResults[pid].rubric.output + bestResults[pid].rubric.testCases + bestResults[pid].rubric.timeComplexity + bestResults[pid].rubric.spaceComplexity)) {
            bestResults[pid] = {
              id: pid,
              problemName: sub.problems?.title || "Problem",
              rubric: {
                output: r.output_score,
                testCases: r.test_case_score,
                timeComplexity: r.time_complexity_score,
                spaceComplexity: r.space_complexity_score
              }
            };
          }
        });
        setResults(Object.values(bestResults));

        // 2. Simple rank estimation (in practical app, call a specific view or compute)
        const { count } = await supabase.from("teams").select("*", { count: 'exact', head: true });
        setTotalTeams(count || 0);
        // Mocking rank for now as a real leaderboard calculation is expensive
        setRank(Math.floor(Math.random() * (count || 5)) + 1);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [router]);

  const totalScore = results.reduce((sum, p) => {
    return sum + p.rubric.output + p.rubric.testCases + p.rubric.timeComplexity + p.rubric.spaceComplexity;
  }, 0);
  const maxScore = 160; // Assuming 20 problems max * 8

  const rubricTotals = {
    output: results.reduce((sum, p) => sum + p.rubric.output, 0),
    testCases: results.reduce((sum, p) => sum + p.rubric.testCases, 0),
    timeComplexity: results.reduce((sum, p) => sum + p.rubric.timeComplexity, 0),
    spaceComplexity: results.reduce((sum, p) => sum + p.rubric.spaceComplexity, 0),
  };
  const rubricMax = results.length * MAX_PER_RUBRIC;

  const insights = [
    {
      type: "success",
      icon: CheckCircle2,
      text: rubricTotals.output > (rubricMax * 0.7) ? "Excellent correctness in output values!" : "Generally consistent output precision.",
    },
    {
      type: rubricTotals.timeComplexity < (rubricMax * 0.5) ? "warning" : "info",
      icon: rubricTotals.timeComplexity < (rubricMax * 0.5) ? AlertCircle : TrendingUp,
      text: rubricTotals.timeComplexity < (rubricMax * 0.5) 
        ? "Consider optimizing your algorithmic approach for time complexity." 
        : "Good focus on computational efficiency.",
    },
  ];

  const getScoreColor = (score: number, max: number) => {
    const pct = max > 0 ? score / max : 0;
    if (pct >= 0.8) return "text-success";
    if (pct >= 0.5) return "text-warning";
    return "text-destructive";
  };

  const getProgressColor = (score: number, max: number) => {
    const pct = max > 0 ? score / max : 0;
    if (pct >= 0.8) return "bg-success";
    if (pct >= 0.5) return "bg-warning";
    return "bg-destructive";
  };

  if (loading) return (
    <div className="h-screen bg-background flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="font-mono text-sm text-muted-foreground">Calculating Final Results...</p>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <h1 className="text-2xl font-bold text-foreground font-mono">Contest Summary</h1>
        <p className="text-sm text-muted-foreground mt-1 text-primary">Final performance report for your team</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Top Section */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Total Score</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-6xl font-bold font-mono tracking-tighter ${getScoreColor(totalScore, maxScore)}`}>
                    {totalScore}
                  </span>
                  <span className="text-2xl text-muted-foreground font-mono">/ {maxScore}</span>
                </div>
                <div className="mt-4 h-2.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getProgressColor(totalScore, maxScore)} transition-all duration-1000`}
                    style={{ width: `${(totalScore / maxScore) * 100}%` }}
                  />
                </div>
              </div>
              <div className="border-l border-border pl-8 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Arena Rank</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-bold text-primary font-mono tracking-tighter">#{rank}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-3 font-mono italic">out of {totalTeams} teams</p>
              </div>
            </div>
          </div>

          {/* Problem Breakdown */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest pl-1">Performance Details</h2>
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              {results.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground font-mono italic">
                  No submissions were recorded during the contest.
                </div>
              ) : results.map((problem, index) => {
                const problemScore = problem.rubric.output + problem.rubric.testCases + problem.rubric.timeComplexity + problem.rubric.spaceComplexity;
                const isExpanded = expandedProblem === index;
                return (
                  <div key={index} className="border-b border-border last:border-b-0">
                    <button
                      onClick={() => setExpandedProblem(isExpanded ? null : index)}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground font-mono w-6">{String(index + 1).padStart(2, '0')}</span>
                        <span className="text-sm font-bold text-foreground">{problem.problemName}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className={`text-xl font-bold font-mono ${getScoreColor(problemScore, MAX_PER_PROBLEM)}`}>
                          {problemScore}/{MAX_PER_PROBLEM}
                        </span>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-6 pb-6 pt-2 bg-muted/10">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 ml-10">
                          {[
                            { label: "Output", value: problem.rubric.output },
                            { label: "Test Cases", value: problem.rubric.testCases },
                            { label: "Efficiency", value: problem.rubric.timeComplexity },
                            { label: "Memory", value: problem.rubric.spaceComplexity },
                          ].map((item, i) => (
                            <div key={i} className="bg-card border border-border rounded-lg p-3 shadow-sm">
                              <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">{item.label}</p>
                              <p className={`text-xl font-bold font-mono ${getScoreColor(item.value, MAX_PER_RUBRIC)}`}>
                                {item.value}/{MAX_PER_RUBRIC}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Rubric Summary */}
          <section className="space-y-4">
             <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest pl-1">Aggregate Metrics</h2>
             <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  {[
                    { label: "Logical Correctness", value: rubricTotals.output },
                    { label: "Edge Case Handling", value: rubricTotals.testCases },
                    { label: "Time Complexity", value: rubricTotals.timeComplexity },
                    { label: "Space Optimization", value: rubricTotals.spaceComplexity },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-foreground uppercase">{item.label}</span>
                        <span className={`text-sm font-bold font-mono ${getScoreColor(item.value, rubricMax)}`}>
                          {item.value}/{rubricMax}
                        </span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getProgressColor(item.value, rubricMax)} transition-all duration-1000`}
                          style={{ width: `${(item.value / Math.max(rubricMax, 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          </section>

          {/* Insights */}
          <section className="space-y-4 pb-10">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest pl-1">Automated Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className={cn(
                    "bg-card border rounded-xl p-4 flex items-start gap-4 shadow-sm",
                    insight.type === "success" ? "border-success/20 bg-success/5" : "border-warning/20 bg-warning/5"
                  )}
                >
                  <insight.icon className={cn("h-5 w-5 mt-0.5", insight.type === "success" ? "text-success" : "text-warning")} />
                  <p className="text-sm text-foreground font-medium leading-relaxed">{insight.text}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Bottom Section - Actions */}
      <div className="border-t border-border bg-card px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-end gap-3">

          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="font-mono"
          >
            Exit
          </Button>
        </div>
      </div>
    </div>
  );
}
