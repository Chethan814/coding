import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  try {
    console.log("💣 NUCLEAR OPTION: Initializing Arena Wipe...");

    // 1. Delete dependent data first
    // We use a custom query approach or delete all match
    // Note: Some drivers require a filter. .neq("id", "00...") is a safe way to match all UUIDs.
    const all = "00000000-0000-0000-0000-000000000000";

    await Promise.all([
      supabaseAdmin.from("violations").delete().neq("id", all),
      supabaseAdmin.from("rubric_scores").delete().neq("id", all),
      supabaseAdmin.from("best_scores").delete().neq("id", all),
      supabaseAdmin.from("submissions").delete().neq("id", all),
      supabaseAdmin.from("leaderboard").delete().neq("id", all),
      supabaseAdmin.from("event_participants").delete().neq("id", all),
    ]);

    // 2. Clear teams
    const { error: teamError } = await supabaseAdmin.from("teams").delete().neq("id", all);
    if (teamError) throw teamError;

    // 3. Reset Event Status
    await supabaseAdmin.from("events").update({ 
      status: "not_started", 
      live_at: null 
    }).neq("id", all);

    return NextResponse.json({ 
      success: true, 
      message: "Arena purged successfully. All teams and scores cleared." 
    });

  } catch (error: any) {
    console.error("Critical Reset Failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
