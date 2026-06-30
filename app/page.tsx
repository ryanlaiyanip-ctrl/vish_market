"use client";

import { useEffect, useState, useCallback } from "react";
import MarketCard from "@/components/MarketCard";
import VishToken from "@/components/VishToken";

interface Market {
  id: string;
  title: string;
  type: "yes_no" | "over_under";
  line: number | null;
  current_value: number;
  status: string;
  result: string | null;
  pool_for: number;
  pool_against: number;
  total_bets: number;
}

interface User {
  id: string;
  nickname: string;
  balance: number;
}

interface UserBet {
  id: string;
  market_id: string;
  side: string;
  amount: number;
  payout: number | null;
  settled: boolean;
  title: string;
  status: string;
  result: string | null;
  type: string;
  line: number | null;
}

interface LeaderboardEntry {
  id: string;
  nickname: string;
  balance: number;
}

type Tab = "markets" | "bets" | "leaderboard";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [nickname, setNickname] = useState("");
  const [markets, setMarkets] = useState<Market[]>([]);
  const [userBets, setUserBets] = useState<UserBet[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [tab, setTab] = useState<Tab>("markets");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  const fetchMarkets = useCallback(async () => {
    const res = await fetch("/api/markets");
    if (res.ok) setMarkets(await res.json());
  }, []);

  const fetchBets = useCallback(async (userId: string) => {
    const res = await fetch(`/api/bets?user_id=${userId}`);
    if (res.ok) setUserBets(await res.json());
  }, []);

  const fetchUser = useCallback(async (userId: string) => {
    const res = await fetch(`/api/users?id=${userId}`);
    if (res.ok) setUser(await res.json());
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    const res = await fetch("/api/users/leaderboard");
    if (res.ok) setLeaderboard(await res.json());
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("vish_user");
    if (stored) setUser(JSON.parse(stored));
    fetchMarkets();
    fetchLeaderboard();
  }, [fetchMarkets, fetchLeaderboard]);

  useEffect(() => {
    if (!user) return;
    fetchBets(user.id);
    fetchLeaderboard();
    const interval = setInterval(() => {
      fetchMarkets();
      fetchBets(user.id);
      fetchUser(user.id);
      fetchLeaderboard();
    }, 3000);
    return () => clearInterval(interval);
  }, [user, fetchBets, fetchMarkets, fetchUser, fetchLeaderboard]);

  async function join() {
    if (!nickname.trim()) return;
    setJoining(true);
    setError("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname }),
    });
    const data = await res.json();
    setJoining(false);
    if (!res.ok) { setError(data.error); return; }
    setUser(data);
    localStorage.setItem("vish_user", JSON.stringify(data));
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4" style={{ background: "#0a0a0f" }}>
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", border: "3px solid #c9a227", boxShadow: "0 0 24px rgba(201,162,39,0.4)" }}>
                <img src="/vish.jpg" alt="Vish" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
                  onError={(e) => { e.currentTarget.style.display = "none"; }} />
              </div>
            </div>
            <div>
              <div className="text-4xl font-black tracking-tight" style={{ color: "#c9a227" }}>
                VISH<span style={{ color: "white" }}>MARKET</span>
              </div>
              <p style={{ color: "#9ca3af" }} className="text-sm mt-1">Predict what Vish does in the meeting</p>
            </div>
          </div>

          <div style={{ background: "#12121a", border: "1px solid #2a2a3a" }} className="rounded-2xl p-6 space-y-4">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && join()}
              placeholder="Enter your nickname"
              maxLength={24}
              style={{ background: "#1a1a26", border: "1px solid #2a2a3a", color: "white" }}
              className="w-full rounded-xl px-4 py-3 placeholder-gray-600 focus:outline-none"
              autoFocus
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              onClick={join}
              disabled={joining}
              style={{ background: "linear-gradient(135deg, #7c3aed, #c9a227)", opacity: joining ? 0.5 : 1 }}
              className="w-full text-white font-black py-3 rounded-xl transition-opacity text-sm tracking-wide"
            >
              {joining ? "Joining..." : "Join — Get 1000 VT →"}
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs" style={{ color: "#6b7280" }}>
            <VishToken size={16} />
            <span>1000 Vish Tokens to start</span>
          </div>
        </div>
      </main>
    );
  }

  const openMarkets = markets.filter((m) => m.status === "open");
  const closedMarkets = markets.filter((m) => m.status !== "open");
  const activeBets = userBets.filter((b) => !b.settled);
  const myRank = leaderboard.findIndex((u) => u.id === user.id) + 1;

  return (
    <main className="min-h-screen" style={{ background: "#0a0a0f", color: "white" }}>
      <header className="sticky top-0 z-10 backdrop-blur px-4 py-3" style={{ background: "rgba(10,10,15,0.85)", borderBottom: "1px solid #1e1e2e" }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="font-black text-lg tracking-tight" style={{ color: "#c9a227" }}>
            VISH<span style={{ color: "white" }}>MARKET</span>
          </div>
          <div className="text-right flex items-center gap-2">
            <div>
              <div className="font-bold flex items-center gap-1 justify-end">
                <VishToken size={18} />
                <span style={{ color: "#c9a227" }}>{Number(user.balance).toLocaleString()}</span>
                <span style={{ color: "#6b7280" }} className="text-sm font-normal">VT</span>
              </div>
              <div style={{ color: "#6b7280" }} className="text-xs text-right">
                {user.nickname}{myRank > 0 && ` · #${myRank}`}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid #1e1e2e" }}>
        <div className="max-w-2xl mx-auto flex">
          {([["markets", "Markets"], ["bets", `My Bets${activeBets.length > 0 ? ` (${activeBets.length})` : ""}`], ["leaderboard", "Leaderboard"]] as [Tab, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-5 py-3 text-sm font-medium border-b-2 transition-colors"
              style={{
                borderColor: tab === t ? "#c9a227" : "transparent",
                color: tab === t ? "#c9a227" : "#6b7280",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">

        {tab === "markets" && (
          <>
            {markets.length === 0 && (
              <div className="text-center py-20" style={{ color: "#4b5563" }}>
                <div className="text-4xl mb-3">🎯</div>
                <p>No markets open yet. Stand by...</p>
              </div>
            )}
            {openMarkets.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-semibold text-xs uppercase tracking-wider" style={{ color: "#6b7280" }}>Live Markets</h2>
                {openMarkets.map((m) => (
                  <MarketCard key={m.id} market={m} userId={user.id} userBalance={Number(user.balance)} userBets={userBets} onBetPlaced={(bal) => setUser((u) => u ? { ...u, balance: bal } : u)} />
                ))}
              </section>
            )}
            {closedMarkets.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-semibold text-xs uppercase tracking-wider" style={{ color: "#6b7280" }}>Settled</h2>
                {closedMarkets.map((m) => (
                  <MarketCard key={m.id} market={m} userId={user.id} userBalance={Number(user.balance)} userBets={userBets} onBetPlaced={(bal) => setUser((u) => u ? { ...u, balance: bal } : u)} />
                ))}
              </section>
            )}
          </>
        )}

        {tab === "bets" && (
          <section className="space-y-3">
            {activeBets.length === 0 ? (
              <div className="text-center py-16" style={{ color: "#4b5563" }}>No active bets yet</div>
            ) : (
              activeBets.map((bet) => {
                const market = markets.find((m) => m.id === bet.market_id);
                const poolFor = Number(market?.pool_for ?? 0);
                const poolAgainst = Number(market?.pool_against ?? 0);
                const total = poolFor + poolAgainst;
                const isFor = bet.side === "yes" || bet.side === "over";
                const myPool = isFor ? poolFor : poolAgainst;
                const odds = total === 0 || myPool === 0 ? null : total / myPool;
                const potentialPayout = odds ? Math.round(bet.amount * odds) : null;

                return (
                  <div key={bet.id} style={{ background: "#12121a", border: "1px solid #2a2a3a" }} className="rounded-2xl p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-white">{bet.title}</p>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap" style={{
                        background: bet.status === "open" ? "rgba(34,197,94,0.15)" : bet.status === "closed" ? "rgba(234,179,8,0.15)" : "rgba(124,58,237,0.15)",
                        color: bet.status === "open" ? "#4ade80" : bet.status === "closed" ? "#facc15" : "#a78bfa",
                      }}>{bet.status.toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm flex-wrap">
                      <span className="font-bold px-2 py-0.5 rounded-lg" style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa" }}>{bet.side.toUpperCase()}</span>
                      <span style={{ color: "#9ca3af" }} className="flex items-center gap-1">
                        <VishToken size={14} /> {bet.amount} VT staked
                      </span>
                      {potentialPayout && (
                        <span style={{ color: "#6b7280" }}>→ ~{potentialPayout} VT if win</span>
                      )}
                    </div>
                    {bet.type === "over_under" && market && (
                      <div className="text-xs" style={{ color: "#6b7280" }}>Line: {bet.line} · Current: {market.current_value}</div>
                    )}
                  </div>
                );
              })
            )}
          </section>
        )}

        {tab === "leaderboard" && (
          <section className="space-y-2">
            <h2 className="font-semibold text-xs uppercase tracking-wider" style={{ color: "#6b7280" }}>Rankings</h2>
            {leaderboard.length === 0 ? (
              <div className="text-center py-16" style={{ color: "#4b5563" }}>No players yet</div>
            ) : (
              leaderboard.map((entry, i) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl"
                  style={{
                    background: entry.id === user.id ? "rgba(124,58,237,0.15)" : "#12121a",
                    border: entry.id === user.id ? "1px solid rgba(124,58,237,0.4)" : "1px solid #1e1e2e",
                  }}
                >
                  <div className="w-8 text-center font-black text-lg" style={{ color: i === 0 ? "#c9a227" : i === 1 ? "#d1d5db" : i === 2 ? "#b45309" : "#4b5563" }}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </div>
                  <div className="flex-1 font-medium text-white">
                    {entry.nickname}
                    {entry.id === user.id && <span className="ml-2 text-xs" style={{ color: "#7c3aed" }}>(you)</span>}
                  </div>
                  <div className="font-bold flex items-center gap-1">
                    <VishToken size={16} />
                    <span style={{ color: "#c9a227" }}>{Number(entry.balance).toLocaleString()}</span>
                  </div>
                  <div className="text-xs font-medium w-14 text-right" style={{ color: entry.balance > 1000 ? "#4ade80" : entry.balance < 1000 ? "#f87171" : "#6b7280" }}>
                    {entry.balance > 1000 ? `+${entry.balance - 1000}` : entry.balance < 1000 ? `${entry.balance - 1000}` : "even"}
                  </div>
                </div>
              ))
            )}
          </section>
        )}
      </div>
    </main>
  );
}
