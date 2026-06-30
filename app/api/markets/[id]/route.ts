import { NextRequest, NextResponse } from "next/server";
import sql, { initDb } from "@/lib/db";

// PATCH: update current_value, status, or resolve
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await initDb();
  const { id } = await params;
  const body = await req.json();
  const { current_value, status, result } = body;

  const [market] = await sql`SELECT * FROM markets WHERE id = ${id}`;
  if (!market) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (current_value !== undefined) {
    await sql`UPDATE markets SET current_value = ${current_value} WHERE id = ${id}`;
  }
  if (status) {
    await sql`UPDATE markets SET status = ${status} WHERE id = ${id}`;
  }

  // Resolve and settle bets
  if (result && status === "resolved") {
    await sql`UPDATE markets SET result = ${result}, status = 'resolved' WHERE id = ${id}`;

    // Get all unsettled bets
    const bets = await sql`SELECT * FROM bets WHERE market_id = ${id} AND settled = FALSE`;
    const winningBets = bets.filter((b) => b.side === result);
    const losingBets = bets.filter((b) => b.side !== result);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalLosingPool = losingBets.reduce((s: number, b: any) => s + Number(b.amount), 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalWinningPool = winningBets.reduce((s: number, b: any) => s + Number(b.amount), 0);

    for (const bet of winningBets) {
      const share = totalWinningPool === 0 ? 0 : (Number(bet.amount) / totalWinningPool) * totalLosingPool;
      const payout = Math.round(Number(bet.amount) + share);
      await sql`UPDATE bets SET payout = ${payout}, settled = TRUE WHERE id = ${bet.id}`;
      await sql`UPDATE users SET balance = balance + ${payout} WHERE id = ${bet.user_id}`;
    }
    for (const bet of losingBets) {
      await sql`UPDATE bets SET payout = 0, settled = TRUE WHERE id = ${bet.id}`;
    }
  }

  const [updated] = await sql`
    SELECT m.*,
      COALESCE(SUM(CASE WHEN b.side = 'yes' OR b.side = 'over' THEN b.amount ELSE 0 END), 0) AS pool_for,
      COALESCE(SUM(CASE WHEN b.side = 'no' OR b.side = 'under' THEN b.amount ELSE 0 END), 0) AS pool_against
    FROM markets m
    LEFT JOIN bets b ON b.market_id = m.id
    WHERE m.id = ${id}
    GROUP BY m.id
  `;
  return NextResponse.json(updated);
}
