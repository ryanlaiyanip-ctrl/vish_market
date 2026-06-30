import { NextResponse } from "next/server";
import sql, { initDb } from "@/lib/db";

export async function POST() {
  await initDb();
  await sql`DELETE FROM bets`;
  await sql`DELETE FROM users`;
  await sql`DELETE FROM markets`;
  return NextResponse.json({ ok: true });
}
