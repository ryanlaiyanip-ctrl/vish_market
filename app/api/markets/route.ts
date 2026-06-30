import { NextRequest, NextResponse } from "next/server";
import sql, { initDb } from "@/lib/db";
import { generateId } from "@/lib/utils";

export async function GET() {
  await initDb();
  const markets = await sql`
    SELECT m.*,
      COALESCE(SUM(CASE WHEN b.side = 'yes' OR b.side = 'over' THEN b.amount ELSE 0 END), 0) AS pool_for,
      COALESCE(SUM(CASE WHEN b.side = 'no' OR b.side = 'under' THEN b.amount ELSE 0 END), 0) AS pool_against,
      COUNT(b.id) AS total_bets
    FROM markets m
    LEFT JOIN bets b ON b.market_id = m.id
    GROUP BY m.id
    ORDER BY m.created_at DESC
  `;
  return NextResponse.json(markets);
}

export async function POST(req: NextRequest) {
  await initDb();
  const { title, type, line } = await req.json();
  if (!title?.trim() || !type) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  if (type === "over_under" && (line === undefined || line === null)) {
    return NextResponse.json({ error: "Line required for over/under" }, { status: 400 });
  }

  const id = generateId();
  const [market] = await sql`
    INSERT INTO markets (id, title, type, line)
    VALUES (${id}, ${title.trim()}, ${type}, ${type === "over_under" ? line : null})
    RETURNING *
  `;
  return NextResponse.json(market);
}
