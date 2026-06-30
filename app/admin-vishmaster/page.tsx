"use client";

import { useEffect, useState, useCallback } from "react";

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
    const es = new EventSource("/api/events");
    es.onmessage = () => { fetchMarkets(); fetchLeaderboard(); };
    return () => es.close();
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

  const openMarkets = markets.filter((m) => m.status === "open");
  const closedMarkets = markets.filter((m) => m.status === "closed");
  const resolvedMarkets = markets.filter((m) => m.status === "resolved");

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="sticky top-0 z-10 bg-gray-950/80 backdrop-blur border-b border-gray-800 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="font-black text-lg tracking-tight">
            VISH<span className="text-blue-500">MARKET</span>
            <span className="ml-2 text-xs font-normal text-purple-400 bg-purple-900/40 border border-purple-500/30 px-2 py-0.5 rounded-full">ADMIN</span>
          </div>
          <div className="text-gray-400 text-xs">{leaderboard.length} players · {markets.length} markets</div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-800">
        <div className="max-w-3xl mx-auto flex">
          {([["markets", "Markets"], ["players", `Players (${leaderboard.length})`]] as [AdminTab, string][]).map(([t, label]) => (
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

      <div className="max-w-3xl mx-auto p-4 space-y-6">

        {/* PLAYERS TAB */}
        {tab === "players" && (
          <section className="space-y-2">
            <h2 className="text-gray-400 font-semibold text-sm uppercase tracking-wider">All Players</h2>
            {leaderboard.length === 0 ? (
              <div className="text-center py-16 text-gray-600">No players yet</div>
            ) : (
              leaderboard.map((entry, i) => (
                <div key={entry.id} className="flex items-center gap-4 px-4 py-3 rounded-xl bg-gray-900 border border-gray-800">
                  <div className={`w-8 text-center font-black text-lg ${
                    i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-amber-600" : "text-gray-600"
                  }`}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </div>
                  <div className="flex-1 font-medium text-white">{entry.nickname}</div>
                  <div className="font-bold text-white">{Number(entry.balance).toLocaleString()} VT</div>
                  <div className={`text-xs font-medium w-16 text-right ${
                    entry.balance > 1000 ? "text-green-400" : entry.balance < 1000 ? "text-red-400" : "text-gray-500"
                  }`}>
                    {entry.balance > 1000 ? `+${entry.balance - 1000}` : entry.balance < 1000 ? `${entry.balance - 1000}` : "even"}
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        {/* MARKETS TAB */}
        {tab === "markets" && (
          <>
            {/* Create market */}
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 space-y-4">
              <h2 className="font-bold text-white">Create Market</h2>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createMarket()}
                placeholder='e.g. "Will he say Synergy?" or "Times he says Lets Go"'
                className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <div className="flex gap-3 flex-wrap">
                <div className="flex gap-2">
                  {(["yes_no", "over_under"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
                        type === t ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                      }`}
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
                    className="flex-1 min-w-[120px] bg-gray-800 border border-gray-600 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                )}
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                onClick={createMarket}
                disabled={creating || !title.trim()}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-colors"
              >
                {creating ? "Creating..." : "Create Market"}
              </button>
            </div>

            {openMarkets.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-gray-400 font-semibold text-sm uppercase tracking-wider">Open Markets</h2>
                {openMarkets.map((m) => (
                  <AdminMarketCard key={m.id} market={m} onUpdate={updateMarket} onDelete={deleteMarket} />
                ))}
              </section>
            )}

            {closedMarkets.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-gray-400 font-semibold text-sm uppercase tracking-wider">Closed — Awaiting Resolution</h2>
                {closedMarkets.map((m) => (
                  <AdminMarketCard key={m.id} market={m} onUpdate={updateMarket} onDelete={deleteMarket} />
                ))}
              </section>
            )}

            {resolvedMarkets.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-gray-400 font-semibold text-sm uppercase tracking-wider">Resolved</h2>
                {resolvedMarkets.map((m) => (
                  <AdminMarketCard key={m.id} market={m} onUpdate={updateMarket} onDelete={deleteMarket} />
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
}: {
  market: Market;
  onUpdate: (id: string, patch: object) => void;
  onDelete: (id: string) => void;
}) {
  const [inputVal, setInputVal] = useState(String(market.current_value));

  useEffect(() => {
    setInputVal(String(market.current_value));
  }, [market.current_value]);

  const forLabel = market.type === "yes_no" ? "YES" : "OVER";
  const againstLabel = market.type === "yes_no" ? "NO" : "UNDER";
  const forSide = market.type === "yes_no" ? "yes" : "over";
  const againstSide = market.type === "yes_no" ? "no" : "under";

  const statusColor =
    market.status === "open" ? "text-green-400" :
    market.status === "closed" ? "text-yellow-400" :
    "text-purple-400";

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-white font-semibold text-lg leading-tight">{market.title}</h3>
          {market.type === "over_under" && (
            <p className="text-gray-400 text-sm mt-0.5">Line: <span className="text-white">{market.line}</span></p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold uppercase ${statusColor}`}>{market.status}</span>
          {market.status !== "resolved" && (
            <button
              onClick={() => onDelete(market.id)}
              className="text-gray-600 hover:text-red-400 transition-colors text-xs px-2 py-1 rounded-lg hover:bg-red-900/20"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Pools */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-gray-800 rounded-xl px-3 py-2">
          <div className="text-gray-400">{forLabel} pool</div>
          <div className="text-white font-bold">{Number(market.pool_for).toLocaleString()} VT</div>
        </div>
        <div className="bg-gray-800 rounded-xl px-3 py-2">
          <div className="text-gray-400">{againstLabel} pool</div>
          <div className="text-white font-bold">{Number(market.pool_against).toLocaleString()} VT</div>
        </div>
      </div>

      {/* Over/under live counter */}
      {market.type === "over_under" && market.status !== "resolved" && (
        <div className="space-y-2">
          <div className="text-gray-400 text-sm">Live count</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const v = Math.max(0, Number(market.current_value) - 1);
                setInputVal(String(v));
                onUpdate(market.id, { current_value: v });
              }}
              className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-xl text-white font-bold text-xl transition-colors"
            >−</button>
            <input
              type="number"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onBlur={() => onUpdate(market.id, { current_value: parseFloat(inputVal) || 0 })}
              className="w-24 text-center bg-gray-800 border border-gray-600 rounded-xl px-3 py-2 text-white font-mono text-lg focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => {
                const v = Number(market.current_value) + 1;
                setInputVal(String(v));
                onUpdate(market.id, { current_value: v });
              }}
              className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-xl text-white font-bold text-xl transition-colors"
            >+</button>
          </div>
        </div>
      )}

      {market.status === "open" && (
        <button
          onClick={() => onUpdate(market.id, { status: "closed" })}
          className="w-full bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-600/40 text-yellow-400 font-bold py-2.5 rounded-xl transition-colors text-sm"
        >
          Close Betting
        </button>
      )}

      {(market.status === "open" || market.status === "closed") && (
        <div className="space-y-2">
          <div className="text-gray-400 text-sm">Resolve</div>
          <div className="flex gap-2">
            <button
              onClick={() => onUpdate(market.id, { status: "resolved", result: forSide })}
              className="flex-1 bg-green-600/20 hover:bg-green-600/30 border border-green-600/40 text-green-400 font-bold py-2.5 rounded-xl transition-colors text-sm"
            >
              {forLabel} wins
            </button>
            <button
              onClick={() => onUpdate(market.id, { status: "resolved", result: againstSide })}
              className="flex-1 bg-red-600/20 hover:bg-red-600/30 border border-red-600/40 text-red-400 font-bold py-2.5 rounded-xl transition-colors text-sm"
            >
              {againstLabel} wins
            </button>
          </div>
        </div>
      )}

      {market.status === "resolved" && (
        <div className="bg-purple-900/30 border border-purple-500/30 rounded-xl px-4 py-2.5 text-center">
          <span className="text-purple-300 font-bold">
            Result: {market.result?.toUpperCase()} · {Number(market.total_bets)} bets settled
          </span>
        </div>
      )}
    </div>
  );
}
