import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phase = searchParams.get("phase");

  let query = supabase.from("problems").select("*").order("order_index", { ascending: true });

  if (phase) {
    // Basic logic mapping: Phase 1 = Coding, Phase 2 = Debugging
    const type = phase === "1" ? "coding" : "debugging";
    query = query.eq("type", type);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
