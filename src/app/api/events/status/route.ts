import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  return NextResponse.json({ status: db.eventState });
}

export async function POST(request: Request) {
  const body = await request.json();
  if (body.status) {
    db.eventState = body.status;
    return NextResponse.json({ status: db.eventState });
  }
  return NextResponse.json({ error: "Invalid status" }, { status: 400 });
}
