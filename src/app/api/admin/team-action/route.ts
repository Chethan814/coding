import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  try {
    const { team_id, action, problem_idx, key, value, problemName } = await request.json();

    if (!team_id || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (action === "update-rubric") {
      // 1. Find the best submission for this problem
      const { data: bestScore } = await supabaseAdmin
        .from("best_scores")
        .select("submission_id, problems(title)")
        .eq("team_id", team_id)
        .eq("problem_id", problem_idx) // in this context, problem_idx passed as ID
        .single();
      
      if (!bestScore?.submission_id) throw new Error("No submission found to override.");

      // 2. Map frontend key to DB column
      const colMap: Record<string, string> = {
        output: "output_score",
        testCases: "test_case_score",
        timeComplexity: "time_complexity_score",
        spaceComplexity: "space_complexity_score"
      };

      const column = colMap[key];
      if (!column) throw new Error("Invalid rubric key");

      // 3. Update the rubric score
      const { error: updateErr } = await supabaseAdmin
        .from("rubric_scores")
        .update({ [column]: value })
        .eq("submission_id", bestScore.submission_id);

      if (updateErr) throw updateErr;

      // 4. Recalculate total score for this problem
      const { data: rubric } = await supabaseAdmin
        .from("rubric_scores")
        .select("*")
        .eq("submission_id", bestScore.submission_id)
        .single();
      
      const newTotal = (rubric.output_score || 0) + (rubric.test_case_score || 0) + (rubric.time_complexity_score || 0) + (rubric.space_complexity_score || 0);

      await supabaseAdmin
        .from("rubric_scores")
        .update({ total_score: newTotal })
        .eq("submission_id", bestScore.submission_id);

      return NextResponse.json({ success: true, message: "Rubric updated and recalculated." });
    }

    if (action === "delete") {
      const all = "00000000-0000-0000-0000-000000000000";
      
      // Cascading clean up before team delete
      await Promise.all([
        supabaseAdmin.from("violations").delete().eq("team_id", team_id),
        supabaseAdmin.from("best_scores").delete().eq("team_id", team_id),
        supabaseAdmin.from("submissions").delete().eq("team_id", team_id),
        supabaseAdmin.from("leaderboard").delete().eq("team_id", team_id),
        supabaseAdmin.from("event_participants").delete().eq("team_id", team_id),
      ]);

      const { error } = await supabaseAdmin.from("teams").delete().eq("id", team_id);
      if (error) throw error;
      
      return NextResponse.json({ success: true, message: "Team data scrubbed and removed." });
    }

    let status = "active";
    if (action === "pause" || action === "frozen") status = "frozen";
    else if (action === "block" || action === "disqualified") status = "disqualified";

    if (action === "flag" || action === "warned") {
      const { data: team } = await supabaseAdmin.from("teams").select("warnings").eq("id", team_id).single();
      const newWarnings = (team?.warnings || 0) + 1;
      
      const { error: warnError } = await supabaseAdmin
        .from("teams")
        .update({ warnings: newWarnings, suspicion: newWarnings >= 3 ? "high" : "medium" })
        .eq("id", team_id);
        
      if (warnError) throw warnError;
    } else {
      const { error } = await supabaseAdmin
        .from("teams")
        .update({ status })
        .eq("id", team_id);
        
      if (error) throw error;
    }

    return NextResponse.json({ success: true, message: `Team ${action} executed` });

  } catch (error: any) {
    console.error("Team action error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
