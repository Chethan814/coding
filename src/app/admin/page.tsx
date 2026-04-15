"use client";

import { useState, useEffect, Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Shield, Activity, ChevronDown, ChevronRight,
  AlertTriangle, Ban, Pause, GitCompare, LayoutGrid, Users, Trophy, Flag, 
  Loader2, RefreshCcw
} from "lucide-react";
import {
  TeamData, RubricScore, totalScore, rubricTotal, scoreColor,
  RUBRIC_LABELS, MAX_TOTAL_SCORE,
} from "@/types/admin";
import { supabase } from "@/lib/supabase";
import TeamRubricDetail from "@/components/admin/TeamRubricDetail";
import ComparisonView from "@/components/admin/ComparisonView";
import RubricBar from "@/components/admin/RubricBar";
import { cn } from "@/lib/utils";

type ViewMode = "monitor" | "compare";

export default function Admin() {
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("monitor");
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all teams
      const { data: dbTeams, error: teamsError } = await supabase
        .from("teams")
        .select(`
          id,
          name,
          submissions (
            id,
            problem_id,
            created_at,
            problems (title),
            rubric_scores (
              output_score,
              test_case_score,
              time_complexity_score,
              space_complexity_score
            )
          )
        `);

      if (teamsError) throw teamsError;

      // 2. Map DB teams to UI TeamData shape
      const mappedTeams: TeamData[] = (dbTeams || []).map((t: any) => {
        // For each team, we find the BEST rubric score for each problem they solved
        const problemResultsMap: Record<string, any> = {};

        t.submissions?.forEach((sub: any) => {
          const rubric = sub.rubric_scores?.[0];
          if (!rubric) return;

          const currentTotal = rubric.output_score + rubric.test_case_score + 
                               rubric.time_complexity_score + rubric.space_complexity_score;
          
          const existing = problemResultsMap[sub.problem_id];
          if (!existing || currentTotal > (existing.total || 0)) {
            problemResultsMap[sub.problem_id] = {
              problemName: sub.problems?.title || "Unknown Problem",
              total: currentTotal,
              submittedAt: sub.created_at,
              rubric: {
                output: rubric.output_score || 0,
                testCases: rubric.test_case_score || 0,
                timeComplexity: rubric.time_complexity_score || 0,
                spaceComplexity: rubric.space_complexity_score || 0,
              },
              locked: false // Manual override mock
            };
          }
        });

        return {
          id: t.id,
          name: t.name,
          problems: Object.values(problemResultsMap),
          status: "active",
          suspicion: "low",
          warnings: 0,
          timeline: []
        };
      });

      setTeams(mappedTeams);
    } catch (err: any) {
      toast.error("Dashboard Load Failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleUpdateRubric = (teamId: string, problemIdx: number, key: keyof RubricScore, value: number) => {
    // Current manual override placeholder (Real implementation would update rubric_scores table)
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id !== teamId) return t;
        const problem = t.problems[problemIdx];
        const oldVal = problem.rubric[key];
        if (oldVal === value) return t;
        const newRubric = { ...problem.rubric, [key]: value };
        return {
          ...t,
          problems: t.problems.map((p, i) => i === problemIdx ? { ...p, rubric: newRubric } : p),
        };
      })
    );
    toast.success("Score updated locally");
  };

  const handleToggleLock = (teamId: string, problemIdx: number) => {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id !== teamId) return t;
        const problem = t.problems[problemIdx];
        const isLocked = !problem.locked;
        
        return {
          ...t,
          problems: t.problems.map((p, i) => i === problemIdx ? { ...p, locked: isLocked } : p),
          timeline: [
            ...t.timeline,
            {
              time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric" }),
              event: `Admin ${isLocked ? "locked" : "unlocked"} score for ${problem.problemName}`,
              type: "admin" as const
            }
          ]
        };
      })
    );
  };

  const handleReevaluate = (teamId: string, problemIdx: number) => {
    setTeams((prev) => prev.map(t => {
      if (t.id !== teamId) return t;
      const pname = t.problems[problemIdx].problemName;
      toast(`Re-evaluating ${pname} for ${t.name}...`);
      return {
        ...t,
        timeline: [
          ...t.timeline,
          {
            time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric" }),
            event: `Admin triggered re-evaluation for ${pname}`,
            type: "info" as const
          }
        ]
      }
    }));
  };

  const handleAdminAction = (teamId: string, action: string) => {
    toast(`Successfully ${action} team`);
  }

  const toggleCompare = (id: string) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const avgScore = Math.round(teams.reduce((s, t) => s + totalScore(t), 0) / teams.length);
  const totalSubs = teams.reduce((s, t) => s + t.problems.length, 0);
  const rubricKeys: (keyof RubricScore)[] = ["output", "testCases", "timeComplexity", "spaceComplexity"];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Navbar */}
      <nav className="h-16 border-b border-border bg-card flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-2 rounded-md">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-primary font-bold leading-tight">CodeArena</span>
            <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Admin Dashboard</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex bg-secondary/50 p-1 rounded-lg">
            <Button
              variant={viewMode === "monitor" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("monitor")}
              className="font-mono text-xs shadow-none px-4"
            >
              <LayoutGrid className="h-3.5 w-3.5 mr-2" /> Evaluation
            </Button>
            <Button
              variant={viewMode === "compare" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("compare")}
              className="font-mono text-xs shadow-none px-4"
            >
              <GitCompare className="h-3.5 w-3.5 mr-2" /> Compare
            </Button>
          </div>
          
          <div className="h-6 w-px bg-border"></div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchDashboardData}
            disabled={loading}
            className="font-mono text-xs text-muted-foreground hover:text-primary"
          >
            <RefreshCcw className={cn("h-3.5 w-3.5 mr-2", loading && "animate-spin")} />
            {loading ? "Syncing..." : "Refresh"}
          </Button>
          
          <div className="h-6 w-px bg-border"></div>
          
          <div className="flex items-center gap-2 text-sm text-foreground bg-success/10 px-3 py-1.5 rounded-full border border-success/20">
            <Activity className="h-3.5 w-3.5 text-success animate-pulse" />
            <span className="font-mono font-medium">{teams.filter((t) => t.status === "active").length}</span>
            <span className="text-xs text-muted-foreground mr-1">Active</span>
          </div>
        </div>
      </nav>

      <div className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-8 space-y-8">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="font-mono text-sm text-muted-foreground italic">Fetching Live Arena Data...</p>
          </div>
        )}

        {!loading && (
          <>
            {/* KPI Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: "Active Teams", value: teams.filter((t) => t.status === "active").length, icon: Users, color: "text-foreground" },
                { label: "Total Submissions", value: totalSubs, icon: Activity, color: "text-primary" },
                { label: "System Avg. Score", value: `${avgScore}/${MAX_TOTAL_SCORE}`, icon: Trophy, color: "text-foreground" },
                { label: "High Suspicion / Flags", value: teams.filter((t) => t.suspicion === "high").length, icon: Flag, color: "text-destructive" },
              ].map((s, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-5 shadow-sm relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{s.label}</span>
                    <s.icon className={cn("h-4 w-4 opacity-50", s.color)} />
                  </div>
                  <div className={cn("text-3xl font-mono font-bold", s.color)}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Aggregate Breakdown */}
            {viewMode === "monitor" && (
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-widest mb-6 border-l-2 border-primary pl-3">
                  Aggregated Rubric Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-4">
                  {rubricKeys.map((key) => {
                    const val = teams.reduce((s, t) => s + rubricTotal(t, key), 0);
                    const max = teams.reduce((s, t) => s + t.problems.length * 2, 0);
                    return <RubricBar key={key} value={val} max={max} label={RUBRIC_LABELS[key]} />;
                  })}
                </div>
              </div>
            )}

            {viewMode === "compare" ? (
              <div className="space-y-6">
                 <div className="flex flex-wrap gap-2 mb-4 bg-card p-4 rounded-xl border border-border">
                   <span className="text-sm text-muted-foreground mt-1.5 mr-2">Select to compare:</span>
                   {teams.map((t) => (
                     <Button
                       key={t.id}
                       variant={compareIds.includes(t.id) ? "default" : "outline"}
                       size="sm"
                       onClick={() => toggleCompare(t.id)}
                       className="font-mono text-xs rounded-full"
                     >
                       {t.name}
                     </Button>
                   ))}
                 </div>
                 <ComparisonView teams={teams} selectedIds={compareIds} />
              </div>
            ) : (
              /* Teams Master Table */
              <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/20 text-xs uppercase tracking-wider text-muted-foreground shadow-sm">
                        <th className="text-left py-4 px-5 w-12 text-center font-medium">No.</th>
                        <th className="text-left py-4 px-5 font-medium">Team Profile</th>
                        <th className="text-center py-4 px-5 font-medium">Total Score (/160)</th>
                        <th className="text-center py-4 px-5 font-medium">Problems Solved</th>
                        <th className="text-center py-4 px-5 font-medium">Suspicion Indicator</th>
                        <th className="text-right py-4 px-5 font-medium">Admin Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {teams.map((team, index) => {
                        const score = totalScore(team);
                        const isExpanded = expandedTeam === team.id;
                        const isFlagged = team.suspicion === "high" || team.suspicion === "medium";
                        
                        return (
                          <Fragment key={team.id}>
                            <tr
                              className={cn(
                                "group hover:bg-muted/10 transition-all cursor-pointer relative",
                                isExpanded ? "bg-muted/10" : ""
                              )}
                              onClick={() => setExpandedTeam(isExpanded ? null : team.id)}
                            >
                              <td className="py-4 px-5 text-center relative">
                                {isFlagged && <div className={cn(
                                  "absolute left-0 top-0 bottom-0 w-1 rounded-r-full",
                                  team.suspicion === "high" ? "bg-destructive" : "bg-warning"
                                )} />}
                                <span className="font-mono text-xs text-muted-foreground">
                                  {String(index + 1).padStart(2, '0')}
                                </span>
                              </td>
                              
                              <td className="py-4 px-5">
                                 <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold font-mono">
                                      {team.name.charAt(0)}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="font-semibold text-foreground">{team.name}</span>
                                      <div className="flex gap-2 items-center text-[10px] mt-0.5 font-mono">
                                        <span className={team.status === "active" ? "text-success" : team.status === "frozen" ? "text-warning" : "text-destructive"}>
                                          • {team.status.toUpperCase()}
                                        </span>
                                      </div>
                                    </div>
                                 </div>
                              </td>
                              
                              <td className="py-4 px-5 text-center">
                                <div className="flex flex-col items-center">
                                  <div className="flex items-baseline gap-1">
                                    <span className={cn("font-mono font-bold text-lg", scoreColor(score, MAX_TOTAL_SCORE))}>
                                      {score}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground font-mono">/160</span>
                                  </div>
                                  <div className="w-16 mt-1">
                                    <RubricBar value={score} max={MAX_TOTAL_SCORE} compact showLabel={false} />
                                  </div>
                                </div>
                              </td>
                              
                              <td className="py-4 px-5 text-center">
                                <Badge variant="secondary" className="font-mono font-normal">
                                  {team.problems.length} solved
                                </Badge>
                              </td>
                              
                              <td className="py-4 px-5 text-center">
                                 <div className="flex items-center justify-center gap-2">
                                   {team.suspicion === "high" ? (
                                      <Badge variant="outline" className="border-destructive/30 text-destructive bg-destructive/10">CRITICAL</Badge>
                                   ) : team.warnings > 0 ? (
                                      <Badge variant="outline" className="border-warning/30 text-warning bg-warning/10">{team.warnings} WARN</Badge>
                                   ) : (
                                      <Badge variant="outline" className="border-success/30 text-success bg-success/10">CLEAN</Badge>
                                   )}
                                 </div>
                              </td>
                              
                              <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                                  <Button 
                                    variant="outline" size="icon" 
                                    className="h-8 w-8 border-border text-foreground hover:bg-warning/10 hover:text-warning hover:border-warning/30"
                                    onClick={() => handleAdminAction(team.id, "warned")} title="Issue Warning"
                                  >
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button 
                                    variant="outline" size="icon" 
                                    className="h-8 w-8 border-border text-foreground hover:bg-warning/10 hover:text-warning hover:border-warning/30"
                                    onClick={() => handleAdminAction(team.id, "frozen")} title="Freeze Submissions"
                                  >
                                    <Pause className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button 
                                    variant="outline" size="icon" 
                                    className="h-8 w-8 border-border text-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                                    onClick={() => handleAdminAction(team.id, "disqualified")} title="Disqualify"
                                  >
                                    <Ban className="h-3.5 w-3.5" />
                                  </Button>
                                  
                                  <div className="h-4 w-px bg-border mx-1"></div>
                                  
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </td>
                            </tr>
                            
                            {isExpanded && (
                              <tr key={`${team.id}-detail`} className="bg-background">
                                <td colSpan={6} className="p-0 border-b-2 border-primary/20">
                                  <div className="p-6 bg-gradient-to-b from-muted/10 to-transparent">
                                    <TeamRubricDetail
                                      team={team}
                                      onUpdateRubric={handleUpdateRubric}
                                      onToggleLock={handleToggleLock}
                                      onReevaluate={handleReevaluate}
                                    />
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
