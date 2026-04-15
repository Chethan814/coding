import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const { data: participants, error } = await supabaseAdmin
      .from("event_participants")
      .select(`
        *,
        users(name),
        teams(name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(participants || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
