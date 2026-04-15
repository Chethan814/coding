import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  try {
    const { teamId } = await request.json();

    if (!teamId) {
      return NextResponse.json({ error: "Missing teamId" }, { status: 400 });
    }

    // 1. Check if start_time is already set
    const { data: team, error: fetchError } = await supabaseAdmin
      .from("teams")
      .select("start_time")
      .eq("id", teamId)
      .single();

    if (fetchError) throw fetchError;

    // 2. If already started, just return success
    if (team.start_time) {
      return NextResponse.json({ success: true, startedAt: team.start_time });
    }

    // 3. Otherwise, set the start_time now
    const now = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from("teams")
      .update({ start_time: now })
      .eq("id", teamId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, startedAt: now });

  } catch (error: any) {
    console.error("Failed to start contest for team:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
