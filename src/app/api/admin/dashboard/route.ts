import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  try {
    // 1. Fetch teams with their best scores and related details
    // Joining: teams -> best_scores -> submissions -> rubric_scores
    // 1. Fetch data with Admin client
    const [{ data: teams }, { data: violations }] = await Promise.all([
      supabaseAdmin
        .from("teams")
        .select(`
          id, name, status, suspicion, warnings,
          best_scores (
            best_score,
            updated_at,
            problems (id, title),
            submissions (
              id, language, execution_time, execution_memory,
              rubric_scores (output_score, test_case_score, time_complexity_score, space_complexity_score)
            )
          )
        `),
      supabaseAdmin.from("violations").select("*").order("created_at", { ascending: false })
    ]);

    if (!teams) throw new Error("No teams found");

    // 2. Map to frontend format
    const formattedData = teams.map((t: any) => {
      const teamViolations = (violations || []).filter(v => v.team_id === t.id);
      
      const problems = (t.best_scores || []).map((bs: any) => {
          const sub = bs.submissions;
          const rubric = sub?.rubric_scores?.[0] || {};
          return {
            id: bs.problems?.id,
            problemName: bs.problems?.title || "Unknown",
            submittedAt: bs.updated_at,
            locked: false,
            rubric: {
              output: rubric.output_score || 0,
              testCases: rubric.test_case_score || 0,
              timeComplexity: rubric.time_complexity_score || 0,
              spaceComplexity: rubric.space_complexity_score || 0,
              actualTime: sub?.execution_time,
              actualMemory: sub?.execution_memory
            }
          };
      });

      // Construct timeline from violations and major scoring events
      const timeline = [
        ...teamViolations.map(v => ({
          time: new Date(v.created_at).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
          event: `VIOLATION: ${v.type}${v.details ? ` (${v.details})` : ""}`,
          type: "violation" as const
        })),
        ...problems.map((p: any) => ({
          time: new Date(p.submittedAt).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
          event: `Solved ${p.problemName} (Score: ${p.rubric.output + p.rubric.testCases + p.rubric.timeComplexity + p.rubric.spaceComplexity}/8)`,
          type: "info" as const
        }))
      ].sort((a: any, b: any) => b.time.localeCompare(a.time)).slice(0, 10);

      return {
        id: t.id,
        name: t.name,
        problems,
        status: t.status || "active",
        suspicion: t.suspicion || "low",
        warnings: t.warnings || 0,
        timeline 
      };
    });

    return NextResponse.json(formattedData);

  } catch (error: any) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
