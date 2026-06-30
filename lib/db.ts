import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);
export default sql;

export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      nickname TEXT UNIQUE NOT NULL,
      balance INTEGER NOT NULL DEFAULT 1000,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS markets (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('yes_no', 'over_under')),
      line NUMERIC,
      current_value NUMERIC DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'resolved')),
      result TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS bets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      market_id TEXT NOT NULL REFERENCES markets(id),
      side TEXT NOT NULL,
      amount INTEGER NOT NULL,
      payout INTEGER,
      settled BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}
