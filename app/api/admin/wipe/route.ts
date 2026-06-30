import { NextResponse } from "next/server";
import sql, { initDb } from "@/lib/db";

export async function POST() {
  await initDb();
  await sql`DELETE FROM bets`;
  await sql`DELETE FROM markets`;
  await sql`DELETE FROM users`;
  return NextResponse.json({ ok: true });
}
