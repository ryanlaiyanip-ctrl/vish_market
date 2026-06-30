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
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [nickname, setNickname] = useState("");
  const [markets, setMarkets] = useState<Market[]>([]);
  const [userBets, setUserBets] = useState<UserBet[]>([]);
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
    if (res.ok) {
      const u = await res.json();
      setUser(u);
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("vish_user");
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
    }
    fetchMarkets();
  }, [fetchMarkets]);

  useEffect(() => {
    if (!user) return;
    fetchBets(user.id);

    const es = new EventSource("/api/events");
    es.onmessage = () => {
      fetchMarkets();
      fetchBets(user.id);
      fetchUser(user.id);
    };
    return () => es.close();
  }, [user, fetchBets, fetchMarkets, fetchUser]);

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

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="sticky top-0 z-10 bg-gray-950/80 backdrop-blur border-b border-gray-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="font-black text-lg tracking-tight">
            VISH<span className="text-blue-500">MARKET</span>
          </div>
          <div className="text-right">
            <div className="text-white font-bold">{Number(user.balance).toLocaleString()} VT</div>
            <div className="text-gray-400 text-xs">{user.nickname}</div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
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
              <MarketCard
                key={m.id}
                market={m}
                userId={user.id}
                userBalance={Number(user.balance)}
                userBets={userBets}
                onBetPlaced={(newBal) => setUser((u) => u ? { ...u, balance: newBal } : u)}
              />
            ))}
          </section>
        )}

        {closedMarkets.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-gray-400 font-semibold text-sm uppercase tracking-wider">Settled</h2>
            {closedMarkets.map((m) => (
              <MarketCard
                key={m.id}
                market={m}
                userId={user.id}
                userBalance={Number(user.balance)}
                userBets={userBets}
                onBetPlaced={(newBal) => setUser((u) => u ? { ...u, balance: newBal } : u)}
              />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
