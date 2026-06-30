"use client";

import { useEffect, useState, useCallback } from "react";
import MarketCard from "@/components/MarketCard";

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

    const es = new EventSource("/api/events");
    es.onmessage = () => {
      fetchMarkets();
      fetchBets(user.id);
      fetchUser(user.id);
      fetchLeaderboard();
    };
    return () => es.close();
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
      <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="text-5xl font-black text-white tracking-tight">
              VISH<span className="text-blue-500">MARKET</span>
            </div>
            <p className="text-gray-400">Predict what happens in the meeting</p>
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 space-y-4">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && join()}
              placeholder="Enter your nickname"
              maxLength={24}
              className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              autoFocus
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              onClick={join}
              disabled={joining}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
            >
              {joining ? "Joining..." : "Join with 1000 VT →"}
            </button>
          </div>
          <p className="text-center text-gray-600 text-xs">You start with 1000 Vish Tokens</p>
        </div>
      </main>
    );
  }

  const openMarkets = markets.filter((m) => m.status === "open");
  const closedMarkets = markets.filter((m) => m.status !== "open");
  const activeBets = userBets.filter((b) => !b.settled);
  const myRank = leaderboard.findIndex((u) => u.id === user.id) + 1;

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="sticky top-0 z-10 bg-gray-950/80 backdrop-blur border-b border-gray-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="font-black text-lg tracking-tight">
            VISH<span className="text-blue-500">MARKET</span>
          </div>
          <div className="text-right">
            <div className="text-white font-bold">{Number(user.balance).toLocaleString()} VT</div>
            <div className="text-gray-400 text-xs">{user.nickname} {myRank > 0 && `· #${myRank}`}</div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-800">
        <div className="max-w-2xl mx-auto flex">
          {([["markets", "Markets"], ["bets", `My Bets${activeBets.length > 0 ? ` (${activeBets.length})` : ""}`], ["leaderboard", "Leaderboard"]] as [Tab, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t ? "border-blue-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">

        {/* MARKETS TAB */}
        {tab === "markets" && (
          <>
            {markets.length === 0 && (
              <div className="text-center py-20 text-gray-600">
                <div className="text-4xl mb-3">🎯</div>
                <p>No markets open yet. Stand by...</p>
              </div>
            )}
            {openMarkets.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-gray-400 font-semibold text-sm uppercase tracking-wider">Live Markets</h2>
                {openMarkets.map((m) => (
                  <MarketCard key={m.id} market={m} userId={user.id} userBalance={Number(user.balance)} userBets={userBets} onBetPlaced={(bal) => setUser((u) => u ? { ...u, balance: bal } : u)} />
                ))}
              </section>
            )}
            {closedMarkets.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-gray-400 font-semibold text-sm uppercase tracking-wider">Settled</h2>
                {closedMarkets.map((m) => (
                  <MarketCard key={m.id} market={m} userId={user.id} userBalance={Number(user.balance)} userBets={userBets} onBetPlaced={(bal) => setUser((u) => u ? { ...u, balance: bal } : u)} />
                ))}
              </section>
            )}
          </>
        )}

        {/* MY BETS TAB */}
        {tab === "bets" && (
          <section className="space-y-3">
            {activeBets.length === 0 ? (
              <div className="text-center py-16 text-gray-600">No active bets yet</div>
            ) : (
              activeBets.map((bet) => {
                const market = markets.find((m) => m.id === bet.market_id);
                const poolFor = Number(market?.pool_for ?? 0);
                const poolAgainst = Number(market?.pool_against ?? 0);
                const total = poolFor + poolAgainst;
                const isFor = bet.side === "yes" || bet.side === "over";
                const myPool = isFor ? poolFor : poolAgainst;
                const odds = total === 0 || myPool === 0 ? 2 : total / myPool;
                const potentialPayout = Math.round(bet.amount * odds);

                return (
                  <div key={bet.id} className="bg-gray-900 border border-gray-700 rounded-2xl p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-white font-medium">{bet.title}</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                        bet.status === "open" ? "bg-green-500/20 text-green-400" :
                        bet.status === "closed" ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-purple-500/20 text-purple-400"
                      }`}>{bet.status.toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-lg font-bold">{bet.side.toUpperCase()}</span>
                      <span className="text-gray-400">{bet.amount} VT staked</span>
                      <span className="text-gray-500">→ ~{potentialPayout} VT if win</span>
                    </div>
                    {bet.type === "over_under" && market && (
                      <div className="text-gray-500 text-xs">Line: {bet.line} · Current: {market.current_value}</div>
                    )}
                  </div>
                );
              })
            )}
          </section>
        )}

        {/* LEADERBOARD TAB */}
        {tab === "leaderboard" && (
          <section className="space-y-2">
            <h2 className="text-gray-400 font-semibold text-sm uppercase tracking-wider">Rankings</h2>
            {leaderboard.length === 0 ? (
              <div className="text-center py-16 text-gray-600">No players yet</div>
            ) : (
              leaderboard.map((entry, i) => (
                <div
                  key={entry.id}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-colors ${
                    entry.id === user.id
                      ? "bg-blue-900/30 border-blue-500/40"
                      : "bg-gray-900 border-gray-800"
                  }`}
                >
                  <div className={`w-8 text-center font-black text-lg ${
                    i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-amber-600" : "text-gray-600"
                  }`}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </div>
                  <div className="flex-1 font-medium text-white">
                    {entry.nickname}
                    {entry.id === user.id && <span className="ml-2 text-blue-400 text-xs">(you)</span>}
                  </div>
                  <div className="font-bold text-white">{Number(entry.balance).toLocaleString()} VT</div>
                  <div className={`text-xs font-medium ${
                    entry.balance > 1000 ? "text-green-400" : entry.balance < 1000 ? "text-red-400" : "text-gray-500"
                  }`}>
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
