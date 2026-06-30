"use client";

import { useState } from "react";
import VishToken from "./VishToken";

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

interface UserBet {
  market_id: string;
  side: string;
  amount: number;
  payout: number | null;
  settled: boolean;
}

interface Props {
  market: Market;
  userId: string;
  userBalance: number;
  userBets: UserBet[];
  onBetPlaced: (newBalance: number) => void;
}

function calcOdds(forPool: number, againstPool: number) {
  const total = Number(forPool) + Number(againstPool);
  if (total === 0) return { forOdds: "2.00", againstOdds: "2.00" };
  const fo = Number(forPool) === 0 ? 2 : Math.max(2, total / Number(forPool));
  const ao = Number(againstPool) === 0 ? 2 : Math.max(2, total / Number(againstPool));
  return { forOdds: fo.toFixed(2), againstOdds: ao.toFixed(2) };
}

export default function MarketCard({ market, userId, userBalance, userBets, onBetPlaced }: Props) {
  const [betAmount, setBetAmount] = useState("");
  const [selectedSide, setSelectedSide] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { forOdds, againstOdds } = calcOdds(market.pool_for, market.pool_against);
  const forLabel = market.type === "yes_no" ? "YES" : "OVER";
  const againstLabel = market.type === "yes_no" ? "NO" : "UNDER";
  const forSide = market.type === "yes_no" ? "yes" : "over";
  const againstSide = market.type === "yes_no" ? "no" : "under";

  const myBet = userBets.find((b) => b.market_id === market.id);

  async function placeBet() {
    if (!selectedSide || !betAmount) return;
    const amount = parseInt(betAmount);
    if (isNaN(amount) || amount < 1) { setError("Enter a valid amount"); return; }
    if (amount > 400) { setError("Max bet is 400 VT"); return; }
    if (amount > userBalance) { setError("Not enough Vish tokens"); return; }

    setLoading(true);
    setError("");
    const res = await fetch("/api/bets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, market_id: market.id, side: selectedSide, amount }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    onBetPlaced(data.user.balance);
    setBetAmount("");
    setSelectedSide(null);
  }

  const statusStyle =
    market.status === "open"
      ? { background: "rgba(34,197,94,0.1)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.25)" }
      : market.status === "closed"
      ? { background: "rgba(234,179,8,0.1)", color: "#facc15", border: "1px solid rgba(234,179,8,0.25)" }
      : { background: "rgba(124,58,237,0.1)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.25)" };

  return (
    <div style={{ background: "#12121a", border: "1px solid #2a2a3a" }} className="rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-white font-semibold text-lg leading-tight">{market.title}</h3>
          {market.type === "over_under" && market.line !== null && (
            <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>
              Line: <span className="text-white font-medium">{market.line}</span>
            </p>
          )}
        </div>
        <span className="text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap" style={statusStyle}>
          {market.status.toUpperCase()}
        </span>
      </div>

      {market.type === "over_under" && (
        <div className="rounded-xl px-4 py-2 flex items-center justify-between" style={{ background: "#1a1a26" }}>
          <span style={{ color: "#6b7280" }} className="text-sm">Current count</span>
          <span className="text-2xl font-black" style={{ color: "#c9a227" }}>{market.current_value}</span>
        </div>
      )}

      {market.status === "resolved" && market.result && (
        <div className="rounded-xl px-4 py-2 text-center" style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)" }}>
          <span className="font-bold text-sm" style={{ color: "#a78bfa" }}>Result: {market.result.toUpperCase()}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {[
          { side: forSide, label: forLabel, odds: forOdds, pool: market.pool_for },
          { side: againstSide, label: againstLabel, odds: againstOdds, pool: market.pool_against },
        ].map(({ side, label, odds, pool }) => (
          <button
            key={side}
            onClick={() => market.status === "open" && !myBet && setSelectedSide(side === selectedSide ? null : side)}
            disabled={market.status !== "open" || !!myBet}
            className="rounded-xl p-3 text-left transition-all"
            style={{
              background: selectedSide === side ? "rgba(124,58,237,0.2)" : "#1a1a26",
              border: selectedSide === side ? "2px solid #7c3aed" : "2px solid #2a2a3a",
              cursor: market.status !== "open" || myBet ? "default" : "pointer",
              opacity: market.status !== "open" || myBet ? 0.6 : 1,
            }}
          >
            <div className="font-bold text-white">{label}</div>
            <div className="font-mono text-lg font-black" style={{ color: "#c9a227" }}>{odds}{odds !== "TBD" && "x"}</div>
            <div className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "#6b7280" }}>
              <VishToken size={12} /> {Number(pool).toLocaleString()} VT
            </div>
          </button>
        ))}
      </div>

      {myBet && (
        <div className="rounded-xl px-4 py-2.5 text-sm" style={{ background: "#1a1a26" }}>
          <span style={{ color: "#6b7280" }}>Your bet: </span>
          <span className="font-semibold text-white">{myBet.amount} VT on {myBet.side.toUpperCase()}</span>
          {myBet.settled && (
            <span className="ml-2 font-bold" style={{ color: myBet.payout && myBet.payout > 0 ? "#4ade80" : "#f87171" }}>
              {myBet.payout && myBet.payout > 0 ? `+${myBet.payout} VT` : "Lost"}
            </span>
          )}
        </div>
      )}

      {market.status === "open" && !myBet && selectedSide && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              max={Math.min(400, userBalance)}
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder="Amount (VT)"
              style={{ background: "#1a1a26", border: "1px solid #2a2a3a", color: "white" }}
              className="flex-1 rounded-xl px-4 py-2 placeholder-gray-600 focus:outline-none"
            />
            <button
              onClick={placeBet}
              disabled={loading}
              style={{ background: "linear-gradient(135deg, #7c3aed, #c9a227)" }}
              className="text-white font-black px-5 py-2 rounded-xl transition-opacity disabled:opacity-50"
            >
              {loading ? "..." : "Bet"}
            </button>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {betAmount && !isNaN(parseInt(betAmount)) && (
            <p className="text-xs" style={{ color: "#6b7280" }}>
              Potential payout: ~{Math.round(parseInt(betAmount) * parseFloat(selectedSide === forSide ? forOdds : againstOdds))} VT
            </p>
          )}
        </div>
      )}
    </div>
  );
}
