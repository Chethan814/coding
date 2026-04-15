export interface RubricScore {
  output: number;          // 0-2 (Maps to output_score)
  testCases: number;       // 0-2 (Maps to test_case_score)
  timeComplexity: number;  // 0-2 (Maps to time_complexity_score)
  spaceComplexity: number; // 0-2 (Maps to space_complexity_score)
  actualTime?: number;     // Actual execution time in seconds
  actualMemory?: number;   // Actual memory usage in MB
}

export interface ProblemResult {
  problemName: string;
  rubric: RubricScore;
  locked: boolean;
  submittedAt: string;
}

export interface TeamData {
  id: string; // UUID in database
  name: string;
  problems: ProblemResult[];
  suspicion: "low" | "medium" | "high";
  status: "active" | "frozen" | "disqualified";
  warnings: number;
  timeline: TimelineEvent[];
}

export interface TimelineEvent {
  time: string;
  event: string;
  type: "info" | "warning" | "error" | "score" | "admin";
}

export const RUBRIC_LABELS: Record<keyof RubricScore, string> = {
  output: "Output",
  testCases: "Test Cases",
  timeComplexity: "Time Complexity",
  spaceComplexity: "Space Complexity",
};

export const RUBRIC_ICONS: Record<keyof RubricScore, string> = {
  output: "⚡",
  testCases: "🧪",
  timeComplexity: "⏱",
  spaceComplexity: "📦",
};

export const MAX_PER_RUBRIC = 2;
export const MAX_PER_PROBLEM = 8;
export const MAX_PROBLEMS = 20;
export const MAX_TOTAL_SCORE = MAX_PROBLEMS * MAX_PER_PROBLEM; // 160

export function totalScore(team: TeamData): number {
  return team.problems.reduce((sum, p) => {
    const r = p.rubric;
    return sum + r.output + r.testCases + r.timeComplexity + r.spaceComplexity;
  }, 0);
}

export function rubricTotal(team: TeamData, key: keyof RubricScore): number {
  return team.problems.reduce((sum, p) => sum + p.rubric[key], 0);
}

export function problemTotal(r: RubricScore): number {
  return r.output + r.testCases + r.timeComplexity + r.spaceComplexity;
}

export function scoreColor(score: number, max: number): string {
  const pct = max > 0 ? score / max : 0;
  if (pct === 1) return "text-success";
  if (pct > 0) return "text-warning";
  return "text-destructive";
}
