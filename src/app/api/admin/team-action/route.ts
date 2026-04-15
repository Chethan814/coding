import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { team_id, action } = await request.json();

    if (!team_id || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let status = "active";
    if (action === "pause" || action === "frozen") status = "frozen";
    else if (action === "block" || action === "disqualified") status = "disqualified";

    // "flag" action might not explicitly change the status, but adds a warning.
    if (action === "flag" || action === "warned") {
      const { data: team } = await supabase.from("teams").select("warnings").eq("id", team_id).single();
      const newWarnings = (team?.warnings || 0) + 1;
      
      const { error: warnError } = await supabase
        .from("teams")
        .update({ warnings: newWarnings, suspicion: newWarnings >= 3 ? "high" : "medium" })
        .eq("id", team_id);
        
      if (warnError) throw warnError;
    } else {
      const { error } = await supabase
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
