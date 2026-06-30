import { NextResponse } from "next/server";
import sql, { initDb } from "@/lib/db";

export async function GET() {
  await initDb();
  const users = await sql`
    SELECT id, nickname, balance FROM users ORDER BY balance DESC
  `;
  return NextResponse.json(users);
}
