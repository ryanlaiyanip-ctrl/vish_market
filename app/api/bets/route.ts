import { NextRequest, NextResponse } from "next/server";
import sql, { initDb } from "@/lib/db";
import { generateId } from "@/lib/utils";

export async function POST(req: NextRequest) {
  await initDb();
  const { user_id, market_id, side, amount } = await req.json();

  if (!user_id || !market_id || !side || !amount) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (amount < 1) return NextResponse.json({ error: "Min bet is 1" }, { status: 400 });

  const [market] = await sql`SELECT * FROM markets WHERE id = ${market_id}`;
  if (!market) return NextResponse.json({ error: "Market not found" }, { status: 404 });
  if (market.status !== "open") return NextResponse.json({ error: "Market is not open" }, { status: 400 });

  const [user] = await sql`SELECT * FROM users WHERE id = ${user_id}`;
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.balance < amount) return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });

  // Validate side
  const validSides = market.type === "yes_no" ? ["yes", "no"] : ["over", "under"];
  if (!validSides.includes(side)) {
    return NextResponse.json({ error: "Invalid side" }, { status: 400 });
  }

  const id = generateId();
  await sql`UPDATE users SET balance = balance - ${amount} WHERE id = ${user_id}`;
  const [bet] = await sql`
    INSERT INTO bets (id, user_id, market_id, side, amount)
    VALUES (${id}, ${user_id}, ${market_id}, ${side}, ${amount})
    RETURNING *
  `;
  const [updatedUser] = await sql`SELECT * FROM users WHERE id = ${user_id}`;
  return NextResponse.json({ bet, user: updatedUser });
}

export async function GET(req: NextRequest) {
  await initDb();
  const user_id = req.nextUrl.searchParams.get("user_id");
  if (!user_id) return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  const bets = await sql`
    SELECT b.*, m.title, m.type, m.result, m.status, m.line
    FROM bets b
    JOIN markets m ON m.id = b.market_id
    WHERE b.user_id = ${user_id}
    ORDER BY b.created_at DESC
  `;
  return NextResponse.json(bets);
}
