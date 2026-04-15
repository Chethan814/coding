import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  try {
    // 1. Fetch teams with their best scores and related details
    // Joining: teams -> best_scores -> submissions -> rubric_scores
    const { data: teams, error } = await supabaseAdmin
      .from("teams")
      .select(`
        id,
        name,
        best_scores (
          best_score,
          updated_at,
          problems (id, title),
          submissions (
            id,
            language,
            execution_time,
            execution_memory,
            rubric_scores (
              output_score,
              test_case_score,
              time_complexity_score,
              space_complexity_score
            )
          )
        )
      `);

    if (error) throw error;

    // 2. Map to frontend TeamData format
    const formattedData = (teams || []).map((t: any) => {
      const problems = (t.best_scores || []).map((bs: any) => {
          const sub = bs.submissions;
          const rubric = sub?.rubric_scores?.[0] || {};
          
          return {
            problemName: bs.problems?.title || "Unknown",
            submittedAt: bs.updated_at,
            locked: true, // Assuming consolidated scores are locked by default
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

      return {
        id: t.id,
        name: t.name,
        problems,
        // Fallback defaults for hardening metrics (will be added in migration)
        status: t.status || "active",
        suspicion: t.suspicion || "low",
        warnings: t.warnings || 0,
        timeline: [] 
      };
    });

    return NextResponse.json(formattedData);

  } catch (error: any) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
