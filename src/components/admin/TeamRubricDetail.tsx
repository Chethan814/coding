import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Unlock, RotateCcw, AlertCircle, CheckCircle2, AlertTriangle, XCircle, ShieldAlert } from "lucide-react";
import RubricBar from "./RubricBar";
import ActivityTimeline from "./ActivityTimeline";
import {
  TeamData, ProblemResult, RubricScore,
  RUBRIC_LABELS, RUBRIC_ICONS, MAX_PER_RUBRIC, MAX_PER_PROBLEM,
  problemTotal, rubricTotal, totalScore, scoreColor
} from "@/types/admin";
import { cn } from "@/lib/utils";

interface Props {
  team: TeamData;
  onUpdateRubric: (teamId: string, problemIdx: number, key: keyof RubricScore, value: number) => void;
  onToggleLock: (teamId: string, problemIdx: number) => void;
  onReevaluate: (teamId: string, problemIdx: number) => void;
}

const TeamRubricDetail = ({ team, onUpdateRubric, onToggleLock, onReevaluate }: Props) => {
  const [editingCell, setEditingCell] = useState<string | null>(null);
  
  const rubricKeys: (keyof RubricScore)[] = ["output", "testCases", "timeComplexity", "spaceComplexity"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-border bg-muted/20 flex items-center justify-between">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono text-sm">[01]</span>
              Rubric Evaluation Matrix
            </h3>
            <div className="flex gap-4">
              <div className="text-xs font-mono">
                <span className="text-muted-foreground mr-2">Status:</span>
                <Badge variant="outline" className={cn(
                  "font-mono rounded-sm px-2", 
                  team.status === "active" ? "border-success text-success" : 
                  team.status === "frozen" ? "border-warning text-warning" : "border-destructive text-destructive"
                )}>
                  {team.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="p-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="text-left pb-3 font-medium">Problem</th>
                  {rubricKeys.map((k) => (
                      <th key={k} className="text-center pb-3 font-medium">
                        <span className="flex flex-col items-center justify-center gap-0.5" title={RUBRIC_LABELS[k]}>
                          <div className="flex items-center gap-1.5">
                            <span>{RUBRIC_ICONS[k]}</span>
                            <span className="hidden sm:inline">{RUBRIC_LABELS[k].split(' ')[0]}</span>
                          </div>
                          <span className="text-[9px] text-muted-foreground font-mono font-normal tracking-tighter">(2pt)</span>
                        </span>
                      </th>
                   ))}
                   <th className="text-center pb-3 font-medium">
                     <div className="flex flex-col items-center">
                       <span>Total</span>
                       <span className="text-[9px] text-muted-foreground font-mono font-normal tracking-tighter">(8pt)</span>
                     </div>
                   </th>
                  <th className="text-center pb-3 font-medium">Status</th>
                  <th className="text-right pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {team.problems.map((problem, idx) => {
                  const total = problemTotal(problem.rubric);
                  const isLocked = problem.locked;
                  return (
                    <tr key={idx} className="group hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 font-mono text-foreground font-medium flex items-center gap-2">
                        {total === MAX_PER_PROBLEM ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> :
                         total > 0 ? <AlertCircle className="h-3.5 w-3.5 text-warning" /> :
                         <XCircle className="h-3.5 w-3.5 text-destructive/70" />}
                        {problem.problemName}
                      </td>
                      
                      {rubricKeys.map((key) => {
                        const cellId = `${idx}-${key}`;
                        const val = problem.rubric[key];
                        const isEditing = editingCell === cellId && !isLocked;
                        
                        return (
                          <td key={key} className="py-3.5 text-center px-1">
                            {isEditing ? (
                              <div className="flex items-center justify-center gap-0.5">
                                {[0, 1, 2].map((v) => (
                                  <button
                                    key={v}
                                    onClick={() => { onUpdateRubric(team.id, idx, key, v); setEditingCell(null); }}
                                    className={cn(
                                      "w-6 h-6 rounded text-xs font-mono font-bold transition-all",
                                      v === val
                                        ? "bg-primary text-primary-foreground scale-110 shadow-sm"
                                        : "bg-secondary text-muted-foreground hover:bg-muted"
                                    )}
                                  >
                                    {v}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <button
                                onClick={() => !isLocked && setEditingCell(cellId)}
                                disabled={isLocked}
                                className={cn(
                                  "font-mono font-bold text-sm min-w-[3rem] px-2 py-1 rounded transition-all",
                                  val === 2 ? "text-success bg-success/10" : 
                                  val === 1 ? "text-warning bg-warning/10" : "text-destructive/80 bg-destructive/10",
                                  !isLocked && "hover:ring-1 ring-border cursor-pointer hover:bg-muted",
                                  isLocked && "opacity-60 cursor-not-allowed"
                                )}
                              >
                                {val}
                              </button>
                            )}
                          </td>
                        );
                      })}
                      
                      <td className="py-3.5 text-center">
                        <div className="flex flex-col items-center">
                          <span className={cn("font-mono font-bold text-base", scoreColor(total, MAX_PER_PROBLEM))}>
                            {total}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground">/{MAX_PER_PROBLEM}</span>
                        </div>
                      </td>
                      
                      <td className="py-3.5 text-center">
                        <Badge variant="outline" className={cn(
                          "text-[10px] tracking-wide font-mono rounded-sm border px-1.5 py-0",
                          isLocked ? "border-success/30 text-success bg-success/5" : "border-muted-foreground/30 text-muted-foreground bg-muted/20"
                        )}>
                          {isLocked ? "LOCKED" : "DRAFT"}
                        </Badge>
                      </td>
                      
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                            title="Re-evaluate Submission"
                            disabled={isLocked}
                            onClick={() => onReevaluate(team.id, idx)}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={isLocked ? "secondary" : "default"} 
                            size="icon"
                            className={cn("h-8 w-8 transition-colors", isLocked ? "text-success hover:text-destructive" : "")}
                            onClick={() => { setEditingCell(null); onToggleLock(team.id, idx); }}
                            title={isLocked ? "Unlock Score" : "Lock Final Score"}
                          >
                            {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
           <div className="px-5 py-4 border-b border-border bg-muted/20">
             <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
               <ShieldAlert className="h-4 w-4 text-warning" />
               Timeline & Violations
             </h3>
           </div>
           <div className="p-5 max-h-[350px] overflow-y-auto">
             <ActivityTimeline events={team.timeline} />
           </div>
        </div>
      </div>
    </div>
  );
};

export default TeamRubricDetail;
