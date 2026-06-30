import { NextRequest, NextResponse } from "next/server";
import sql, { initDb } from "@/lib/db";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await initDb();
  const { id } = await params;
  const [user] = await sql`SELECT * FROM users WHERE id = ${id}`;
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Refund any unsettled bets back to market pools (just delete them)
  await sql`DELETE FROM bets WHERE user_id = ${id} AND settled = FALSE`;
  // Delete settled bets too
  await sql`DELETE FROM bets WHERE user_id = ${id}`;
  await sql`DELETE FROM users WHERE id = ${id}`;

  return NextResponse.json({ ok: true });
}
