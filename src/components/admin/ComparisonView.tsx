import { TeamData, RubricScore, RUBRIC_LABELS, rubricTotal, totalScore } from "@/types/admin";
import RubricBar from "./RubricBar";

interface Props {
  teams: TeamData[];
  selectedIds: string[];
}

const ComparisonView = ({ teams, selectedIds }: Props) => {
  const selected = teams.filter((t) => selectedIds.includes(t.id));
  const rubricKeys: (keyof RubricScore)[] = ["output", "testCases", "timeComplexity", "spaceComplexity"];

  if (selected.length < 2) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm font-mono">
        Select 2 or more teams to compare
      </div>
    );
  }

  const maxProblems = Math.max(...selected.map((t) => t.problems.length));

  return (
    <div className="space-y-6">
      {/* Overall comparison */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selected.length}, 1fr)` }}>
        {selected.map((team) => (
          <div key={team.id} className="p-4 rounded-lg bg-secondary/50 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-foreground">{team.name}</span>
              <span className="font-mono text-lg font-bold text-primary">
                {totalScore(team)}/{team.problems.length * 8}
              </span>
            </div>
            {rubricKeys.map((key) => (
              <RubricBar
                key={key}
                value={rubricTotal(team, key)}
                max={team.problems.length * 2}
                label={RUBRIC_LABELS[key]}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Per-rubric side-by-side bars */}
      <div className="space-y-4">
        {rubricKeys.map((key) => (
          <div key={key} className="p-3 rounded-lg bg-card border border-border">
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-mono">
              {RUBRIC_LABELS[key]}
            </h4>
            <div className="space-y-2">
              {selected.map((team) => (
                <div key={team.id} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground w-28 truncate">{team.name}</span>
                  <div className="flex-1">
                    <RubricBar
                      value={rubricTotal(team, key)}
                      max={team.problems.length * 2}
                      label=""
                      showLabel={false}
                    />
                  </div>
                  <span className="text-xs font-mono text-foreground w-10 text-right">
                    {rubricTotal(team, key)}/{team.problems.length * 2}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComparisonView;
