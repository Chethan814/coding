import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST() {
  try {
    // 1. Find the first event or the currently 'not_started' one
    const { data: event } = await supabase
      .from("events")
      .select("id")
      .limit(1)
      .single();

    if (!event) {
      return NextResponse.json({ error: "No event found to start" }, { status: 404 });
    }

    // 2. Set status to 'live' and record start time
    const { error } = await supabase
      .from("events")
      .update({ 
        status: "live",
        start_time: new Date().toISOString()
      })
      .eq("id", event.id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Event is now LIVE" });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
