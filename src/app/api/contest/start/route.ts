import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  try {
    const { teamId } = await request.json();

    if (!teamId) {
      return NextResponse.json({ error: "Missing teamId" }, { status: 400 });
    }

    // 1. Fetch live_at and team status
    const [{ data: event }, { data: team, error: fetchError }] = await Promise.all([
      supabaseAdmin.from("events").select("live_at").limit(1).single(),
      supabaseAdmin.from("teams").select("start_time, status").eq("id", teamId).single()
    ]);

    if (fetchError) throw fetchError;

    // 2. Deadline Check (Anti-Cheat)
    if (event?.live_at && !team.start_time) {
      const liveAt = new Date(event.live_at).getTime();
      const now = new Date().getTime();
      const diff = now - liveAt;

      if (diff > 120000) { // 2 minutes
        await supabaseAdmin
          .from("teams")
          .update({ status: "disqualified", suspicion: "high" })
          .eq("id", teamId);
          
        return NextResponse.json({ 
          error: "DISQUALIFIED: You failed to enter the contest within the 2-minute deadline.",
          disqualified: true 
        }, { status: 403 });
      }
    }

    // 3. If already started, just return success
    if (team.start_time) {
      return NextResponse.json({ success: true, startedAt: team.start_time });
    }

    // 4. Otherwise, set the start_time now
    const nowStr = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from("teams")
      .update({ start_time: nowStr })
      .eq("id", teamId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, startedAt: nowStr });

  } catch (error: any) {
    console.error("Failed to start contest for team:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
