import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("submissions")
      .select(`
        *,
        problems(title),
        users(name),
        rubric_scores(*)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
