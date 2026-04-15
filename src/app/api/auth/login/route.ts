import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, teamCode, name, isAdmin } = body;

    if (isAdmin) {
      // Admin Login Logic
      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .eq("password", password) // In a real app, use auth.signInWithPassword or hashed passwords
        .single();

      if (error || !user) {
        return NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 });
      }

      return NextResponse.json({
        user: { id: user.id, name: user.name, role: "admin" },
        token: "admin-session-token",
        redirect: "/admin"
      });
    } else {
      // Participant Login Logic
      // 1. Check if team exists
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .select("id")
        .eq("name", teamCode) // Using team name as code for simplicity
        .single();
        
      if (teamError || !team) {
        return NextResponse.json({ error: "Invalid Team Code" }, { status: 401 });
      }

      return NextResponse.json({
        user: { name, role: "participant", teamId: team.id },
        token: "participant-session-token",
        redirect: "/lobby"
      });
    }

  } catch (error) {
    return NextResponse.json({ error: "Auth process failed" }, { status: 500 });
  }
}
