import { NextRequest, NextResponse } from "next/server";
import sql, { initDb } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await initDb();
  const { id } = await params;
  const [market] = await sql`SELECT * FROM markets WHERE id = ${id}`;
  if (!market) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Refund all bets
  const bets = await sql`SELECT * FROM bets WHERE market_id = ${id} AND settled = FALSE`;
  for (const bet of bets) {
    await sql`UPDATE users SET balance = balance + ${bet.amount} WHERE id = ${bet.user_id}`;
  }
  await sql`DELETE FROM bets WHERE market_id = ${id}`;
  await sql`UPDATE markets SET status = 'open', result = NULL, current_value = 0 WHERE id = ${id}`;

  return NextResponse.json({ ok: true });
}
