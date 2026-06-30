"use client";

import { useEffect, useState, useCallback } from "react";
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

interface LeaderboardEntry {
  id: string;
  nickname: string;
  balance: number;
}

type AdminTab = "markets" | "players";

export default function AdminPage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [tab, setTab] = useState<AdminTab>("markets");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"yes_no" | "over_under">("yes_no");
  const [line, setLine] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const fetchMarkets = useCallback(async () => {
    const res = await fetch("/api/markets");
    if (res.ok) setMarkets(await res.json());
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    const res = await fetch("/api/users/leaderboard");
    if (res.ok) setLeaderboard(await res.json());
  }, []);

  useEffect(() => {
    fetchMarkets();
    fetchLeaderboard();
    const interval = setInterval(() => { fetchMarkets(); fetchLeaderboard(); }, 3000);
    return () => clearInterval(interval);
  }, [fetchMarkets, fetchLeaderboard]);

  async function createMarket() {
    if (!title.trim()) return;
    setCreating(true);
    setError("");
    const res = await fetch("/api/markets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, type, line: type === "over_under" ? parseFloat(line) : undefined }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) { setError(data.error); return; }
    setTitle("");
    setLine("");
    fetchMarkets();
  }

  async function updateMarket(id: string, patch: object) {
    await fetch(`/api/markets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    fetchMarkets();
    fetchLeaderboard();
  }

  async function deleteMarket(id: string) {
    if (!confirm("Delete this market? All bets will be refunded.")) return;
    await fetch(`/api/markets/${id}`, { method: "DELETE" });
    fetchMarkets();
    fetchLeaderboard();
  }

  async function deleteUser(id: string, nickname: string) {
    if (!confirm(`Delete ${nickname}? Their bets will be removed.`)) return;
    // Optimistically remove from UI immediately
    setLeaderboard((prev) => prev.filter((u) => u.id !== id));
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    fetchLeaderboard();
  }

  async function resetMarket(id: string) {
    if (!confirm("Reset this market? All bets will be refunded and it reopens at 0.")) return;
    if (!confirm("Are you sure? This cannot be undone — all bets will be refunded.")) return;
    await fetch(`/api/markets/${id}/reset`, { method: "POST" });
    fetchMarkets();
    fetchLeaderboard();
  }

  const openMarkets = markets.filter((m) => m.status === "open");
  const closedMarkets = markets.filter((m) => m.status === "closed");
  const resolvedMarkets = markets.filter((m) => m.status === "resolved");

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="sticky top-0 z-10 backdrop-blur px-4 py-3" style={{ background: "rgba(10,10,15,0.85)", borderBottom: "1px solid #1e1e2e" }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="font-black text-lg tracking-tight">
            <span style={{ color: "#c9a227" }}>VISH</span><span style={{ color: "white" }}>MARKET</span>
            <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full" style={{ color: "#a78bfa", background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)" }}>ADMIN</span>
          </div>
          <div className="text-xs" style={{ color: "#6b7280" }}>{leaderboard.length} players · {markets.length} markets</div>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid #1e1e2e" }}>
        <div className="max-w-3xl mx-auto flex">
          {([["markets", "Markets"], ["players", `Players (${leaderboard.length})`]] as [AdminTab, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-5 py-3 text-sm font-medium border-b-2 transition-colors"
              style={{ borderColor: tab === t ? "#c9a227" : "transparent", color: tab === t ? "#c9a227" : "#6b7280" }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-6">

        {/* PLAYERS TAB */}
        {tab === "players" && (
          <section className="space-y-2">
            <h2 className="font-semibold text-xs uppercase tracking-wider" style={{ color: "#6b7280" }}>All Players</h2>
            {leaderboard.length === 0 ? (
              <div className="text-center py-16" style={{ color: "#4b5563" }}>No players yet</div>
            ) : (
              leaderboard.map((entry, i) => (
                <div key={entry.id} className="flex items-center gap-4 px-4 py-3 rounded-xl" style={{ background: "#12121a", border: "1px solid #1e1e2e" }}>
                  <div className="w-8 text-center font-black text-lg" style={{ color: i === 0 ? "#c9a227" : i === 1 ? "#d1d5db" : i === 2 ? "#b45309" : "#4b5563" }}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </div>
                  <div className="flex-1 font-medium text-white">{entry.nickname}</div>
                  <div className="font-bold flex items-center gap-1">
                    <VishToken size={16} />
                    <span style={{ color: "#c9a227" }}>{Number(entry.balance).toLocaleString()}</span>
                    <span style={{ color: "#6b7280" }} className="text-sm font-normal">VT</span>
                  </div>
                  <div className="text-xs font-medium w-14 text-right" style={{ color: entry.balance > 1000 ? "#4ade80" : entry.balance < 1000 ? "#f87171" : "#6b7280" }}>
                    {entry.balance > 1000 ? `+${entry.balance - 1000}` : entry.balance < 1000 ? `${entry.balance - 1000}` : "even"}
                  </div>
                  <button
                    onClick={() => deleteUser(entry.id, entry.nickname)}
                    className="text-xs px-2 py-1 rounded-lg transition-colors"
                    style={{ color: "#6b7280" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#6b7280")}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </section>
        )}

        {/* MARKETS TAB */}
        {tab === "markets" && (
          <>
            {/* Create market */}
            <div style={{ background: "#12121a", border: "1px solid #2a2a3a" }} className="rounded-2xl p-5 space-y-4">
              <h2 className="font-bold text-white">Create Market</h2>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createMarket()}
                placeholder='e.g. "Will he say Synergy?" or "Times he says Lets Go"'
                style={{ background: "#1a1a26", border: "1px solid #2a2a3a", color: "white" }}
                className="w-full rounded-xl px-4 py-3 placeholder-gray-600 focus:outline-none"
              />
              <div className="flex gap-3 flex-wrap">
                <div className="flex gap-2">
                  {(["yes_no", "over_under"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className="px-4 py-2 rounded-xl font-medium text-sm transition-colors"
                      style={{
                        background: type === t ? "#7c3aed" : "#1a1a26",
                        color: type === t ? "white" : "#6b7280",
                        border: type === t ? "1px solid #7c3aed" : "1px solid #2a2a3a",
                      }}
                    >
                      {t === "yes_no" ? "Yes / No" : "Over / Under"}
                    </button>
                  ))}
                </div>
                {type === "over_under" && (
                  <input
                    type="number"
                    value={line}
                    onChange={(e) => setLine(e.target.value)}
                    placeholder="Line (e.g. 3.5)"
                    style={{ background: "#1a1a26", border: "1px solid #2a2a3a", color: "white" }}
                    className="flex-1 min-w-[120px] rounded-xl px-4 py-2 placeholder-gray-600 focus:outline-none"
                  />
                )}
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                onClick={createMarket}
                disabled={creating || !title.trim()}
                style={{ background: "linear-gradient(135deg, #7c3aed, #c9a227)", opacity: creating || !title.trim() ? 0.4 : 1 }}
                className="w-full text-white font-black py-3 rounded-xl transition-opacity"
              >
                {creating ? "Creating..." : "Create Market"}
              </button>
            </div>

            {openMarkets.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-gray-400 font-semibold text-sm uppercase tracking-wider">Open Markets</h2>
                {openMarkets.map((m) => (
                  <AdminMarketCard key={m.id} market={m} onUpdate={updateMarket} onDelete={deleteMarket} onReset={resetMarket} />
                ))}
              </section>
            )}

            {closedMarkets.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-gray-400 font-semibold text-sm uppercase tracking-wider">Closed — Awaiting Resolution</h2>
                {closedMarkets.map((m) => (
                  <AdminMarketCard key={m.id} market={m} onUpdate={updateMarket} onDelete={deleteMarket} onReset={resetMarket} />
                ))}
              </section>
            )}

            {resolvedMarkets.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-gray-400 font-semibold text-sm uppercase tracking-wider">Resolved</h2>
                {resolvedMarkets.map((m) => (
                  <AdminMarketCard key={m.id} market={m} onUpdate={updateMarket} onDelete={deleteMarket} onReset={resetMarket} />
                ))}
              </section>
            )}

            {markets.length === 0 && (
              <div className="text-center py-16 text-gray-600">Create your first market above</div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function AdminMarketCard({
  market,
  onUpdate,
  onDelete,
  onReset,
}: {
  market: Market;
  onUpdate: (id: string, patch: object) => void;
  onDelete: (id: string) => void;
  onReset: (id: string) => void;
}) {
  const [inputVal, setInputVal] = useState(String(market.current_value));

  useEffect(() => {
    setInputVal(String(market.current_value));
  }, [market.current_value]);

  const forLabel = market.type === "yes_no" ? "YES" : "OVER";
  const againstLabel = market.type === "yes_no" ? "NO" : "UNDER";
  const forSide = market.type === "yes_no" ? "yes" : "over";
  const againstSide = market.type === "yes_no" ? "no" : "under";

  const statusStyle =
    market.status === "open"
      ? { color: "#4ade80" }
      : market.status === "closed"
      ? { color: "#facc15" }
      : { color: "#a78bfa" };

  return (
    <div style={{ background: "#12121a", border: "1px solid #2a2a3a" }} className="rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-white font-semibold text-lg leading-tight">{market.title}</h3>
          {market.type === "over_under" && (
            <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>Line: <span className="text-white">{market.line}</span></p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase" style={statusStyle}>{market.status}</span>
          {market.status !== "resolved" && (
            <div className="flex gap-1">
              <button
                onClick={() => onReset(market.id)}
                className="text-gray-600 hover:text-orange-400 transition-colors text-xs px-2 py-1 rounded-lg hover:bg-orange-900/20"
              >
                Reset
              </button>
              <button
                onClick={() => onDelete(market.id)}
                className="text-gray-600 hover:text-red-400 transition-colors text-xs px-2 py-1 rounded-lg hover:bg-red-900/20"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Pools */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl px-3 py-2" style={{ background: "#1a1a26" }}>
          <div style={{ color: "#6b7280" }}>{forLabel} pool</div>
          <div className="font-bold flex items-center gap-1"><VishToken size={14} /><span style={{ color: "#c9a227" }}>{Number(market.pool_for).toLocaleString()}</span> <span style={{ color: "#6b7280" }} className="font-normal">VT</span></div>
        </div>
        <div className="rounded-xl px-3 py-2" style={{ background: "#1a1a26" }}>
          <div style={{ color: "#6b7280" }}>{againstLabel} pool</div>
          <div className="font-bold flex items-center gap-1"><VishToken size={14} /><span style={{ color: "#c9a227" }}>{Number(market.pool_against).toLocaleString()}</span> <span style={{ color: "#6b7280" }} className="font-normal">VT</span></div>
        </div>
      </div>

      {/* Over/under live counter */}
      {market.type === "over_under" && market.status !== "resolved" && (
        <div className="space-y-2">
          <div className="text-sm" style={{ color: "#6b7280" }}>Live count</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const v = Math.max(0, Number(market.current_value) - 1);
                setInputVal(String(v));
                onUpdate(market.id, { current_value: v });
              }}
              className="w-10 h-10 rounded-xl text-white font-bold text-xl transition-colors"
              style={{ background: "#1a1a26", border: "1px solid #2a2a3a" }}
            >−</button>
            <input
              type="number"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onBlur={() => onUpdate(market.id, { current_value: parseFloat(inputVal) || 0 })}
              className="w-24 text-center rounded-xl px-3 py-2 font-mono text-lg focus:outline-none"
              style={{ background: "#1a1a26", border: "1px solid #2a2a3a", color: "#c9a227" }}
            />
            <button
              onClick={() => {
                const v = Number(market.current_value) + 1;
                setInputVal(String(v));
                onUpdate(market.id, { current_value: v });
              }}
              className="w-10 h-10 rounded-xl text-white font-bold text-xl transition-colors"
              style={{ background: "#1a1a26", border: "1px solid #2a2a3a" }}
            >+</button>
          </div>
        </div>
      )}

      {market.status === "open" && (
        <button
          onClick={() => onUpdate(market.id, { status: "closed" })}
          className="w-full font-bold py-2.5 rounded-xl text-sm transition-opacity"
          style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)", color: "#facc15" }}
        >
          Close Betting
        </button>
      )}

      {(market.status === "open" || market.status === "closed") && (
        <div className="space-y-2">
          <div className="text-sm" style={{ color: "#6b7280" }}>Resolve</div>
          {market.type === "over_under" ? (
            <button
              onClick={() => onUpdate(market.id, { status: "resolved" })}
              className="w-full font-bold py-2.5 rounded-xl text-sm transition-opacity"
              style={{ background: "rgba(201,162,39,0.1)", border: "1px solid rgba(201,162,39,0.3)", color: "#c9a227" }}
            >
              Resolve (auto: {Number(market.current_value) > Number(market.line) ? "OVER" : "UNDER"} wins at {market.current_value})
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => onUpdate(market.id, { status: "resolved", result: forSide })}
                className="flex-1 font-bold py-2.5 rounded-xl text-sm transition-opacity"
                style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#4ade80" }}
              >
                YES wins
              </button>
              <button
                onClick={() => onUpdate(market.id, { status: "resolved", result: againstSide })}
                className="flex-1 font-bold py-2.5 rounded-xl text-sm transition-opacity"
                style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171" }}
              >
                NO wins
              </button>
            </div>
          )}
        </div>
      )}

      {market.status === "resolved" && (
        <div className="rounded-xl px-4 py-2.5 text-center" style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)" }}>
          <span className="font-bold" style={{ color: "#a78bfa" }}>
            Result: {market.result?.toUpperCase()} · {Number(market.total_bets)} bets settled
          </span>
        </div>
      )}
    </div>
  );
}
