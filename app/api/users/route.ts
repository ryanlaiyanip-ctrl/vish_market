import { NextRequest, NextResponse } from "next/server";
import sql, { initDb } from "@/lib/db";
import { generateId } from "@/lib/utils";

export async function POST(req: NextRequest) {
  await initDb();
  const { nickname } = await req.json();
  if (!nickname?.trim()) return NextResponse.json({ error: "Nickname required" }, { status: 400 });

  const trimmed = nickname.trim();
  // Return existing user or create new one
  const existing = await sql`SELECT * FROM users WHERE nickname = ${trimmed}`;
  if (existing.length > 0) {
    return NextResponse.json(existing[0]);
  }

  const id = generateId();
  const [user] = await sql`
    INSERT INTO users (id, nickname) VALUES (${id}, ${trimmed}) RETURNING *
  `;
  return NextResponse.json(user);
}

export async function GET(req: NextRequest) {
  await initDb();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const [user] = await sql`SELECT * FROM users WHERE id = ${id}`;
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}
