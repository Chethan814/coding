import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // 1. Fetch total scores aggregated per team from rubric_scores linked through submissions
    // In a complex Supabase query this might be better as a View or RPC.
    // Here we'll simulate the aggregation.
    
    // For now, let's fetch individual team records and their best submissions
    const { data: teams, error } = await supabase
      .from("teams")
      .select(`
        id,
        name,
        best_scores (
          best_score,
          updated_at
        )
      `);

    if (error) throw error;

    const ranked = (teams || []).map(t => {
      const totalScore = t.best_scores?.reduce((sum: number, bs: any) => sum + bs.best_score, 0) || 0;
      const lastSubmission = t.best_scores?.length > 0 
        ? Math.max(...t.best_scores.map((bs: any) => new Date(bs.updated_at).getTime())) 
        : new Date().getTime();

      return {
        id: t.id,
        name: t.name,
        score: totalScore,
        last_submission: lastSubmission
      };
    });

    // 2. Sort by Scores (Desc), then Time (Asc - tie-breaker)
    ranked.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.last_submission - b.last_submission;
    });

    return NextResponse.json(ranked);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
