import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  try {
    const { team_id, user_id, type, details } = await request.json();

    if (!team_id || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Insert violation record (using Admin client)
    const { error: insertError } = await supabaseAdmin
      .from("violations")
      .insert({
        team_id,
        user_id,
        type,
        details: details || "",
      });

    if (insertError) {
       console.error("Failed to insert violation", insertError);
    }

    // Now update team warnings (using Admin client)
    const { data: team } = await supabaseAdmin
      .from("teams")
      .select("warnings, status")
      .eq("id", team_id)
      .single();

    if (team) {
      const newWarnings = (team.warnings || 0) + 1;
      let newStatus = team.status;
      let newSuspicion = newWarnings >= 3 ? "high" : "medium";

      if (newWarnings >= 3 && newStatus !== "disqualified") {
        newStatus = "disqualified";
      }

      try {
        await supabaseAdmin
          .from("teams")
          .update({ warnings: newWarnings, suspicion: newSuspicion, status: newStatus })
          .eq("id", team_id);
      } catch (updateErr) {
        console.warn("⚠️ Team status update failed (potential missing columns). Violation recorded anyway.");
      }

      return NextResponse.json({ 
        success: true, 
        warnings: newWarnings, 
        disqualified: newStatus === "disqualified" 
      });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Violation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
