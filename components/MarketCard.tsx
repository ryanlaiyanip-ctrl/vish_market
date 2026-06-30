"use client";

import { useState } from "react";

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
  if (total === 0) return { forOdds: "TBD", againstOdds: "TBD" };
  const fo = Number(forPool) === 0 ? null : total / Number(forPool);
  const ao = Number(againstPool) === 0 ? null : total / Number(againstPool);
  return { forOdds: fo ? fo.toFixed(2) : "TBD", againstOdds: ao ? ao.toFixed(2) : "TBD" };
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

  const statusColor =
    market.status === "open" ? "bg-green-500/20 text-green-400 border border-green-500/30" :
    market.status === "closed" ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" :
    "bg-purple-500/20 text-purple-400 border border-purple-500/30";

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-white font-semibold text-lg leading-tight">{market.title}</h3>
          {market.type === "over_under" && market.line !== null && (
            <p className="text-gray-400 text-sm mt-0.5">Line: <span className="text-white font-medium">{market.line}</span></p>
          )}
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${statusColor}`}>
          {market.status.toUpperCase()}
        </span>
      </div>

      {market.type === "over_under" && (
        <div className="bg-gray-800 rounded-xl px-4 py-2 flex items-center justify-between">
          <span className="text-gray-400 text-sm">Current count</span>
          <span className="text-2xl font-bold text-white">{market.current_value}</span>
        </div>
      )}

      {market.status === "resolved" && market.result && (
        <div className="bg-purple-900/40 border border-purple-500/30 rounded-xl px-4 py-2 text-center">
          <span className="text-purple-300 font-bold text-sm">Result: {market.result.toUpperCase()}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {[{ side: forSide, label: forLabel, odds: forOdds, pool: market.pool_for },
          { side: againstSide, label: againstLabel, odds: againstOdds, pool: market.pool_against }].map(({ side, label, odds, pool }) => (
          <button
            key={side}
            onClick={() => market.status === "open" && !myBet && setSelectedSide(side === selectedSide ? null : side)}
            disabled={market.status !== "open" || !!myBet}
            className={`rounded-xl p-3 border-2 transition-all text-left ${
              selectedSide === side
                ? "border-blue-500 bg-blue-500/20"
                : "border-gray-700 bg-gray-800 hover:border-gray-500"
            } ${(market.status !== "open" || myBet) ? "opacity-60 cursor-default" : "cursor-pointer"}`}
          >
            <div className="font-bold text-white">{label}</div>
            <div className="text-blue-400 font-mono text-lg">{odds}x</div>
            <div className="text-gray-400 text-xs">{Number(pool).toLocaleString()} VT</div>
          </button>
        ))}
      </div>

      {myBet && (
        <div className="bg-gray-800 rounded-xl px-4 py-2.5 text-sm">
          <span className="text-gray-400">Your bet: </span>
          <span className="text-white font-semibold">{myBet.amount} VT on {myBet.side.toUpperCase()}</span>
          {myBet.settled && (
            <span className={`ml-2 font-bold ${myBet.payout && myBet.payout > 0 ? "text-green-400" : "text-red-400"}`}>
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
              max={userBalance}
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder="Amount (VT)"
              className="flex-1 bg-gray-800 border border-gray-600 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={placeBet}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-xl transition-colors"
            >
              {loading ? "..." : "Bet"}
            </button>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {betAmount && !isNaN(parseInt(betAmount)) && (
            <p className="text-gray-400 text-xs">
              {(() => {
                const odds = selectedSide === forSide ? forOdds : againstOdds;
                if (odds === "TBD") return "Potential payout: TBD (first bet on this side)";
                return `Potential payout: ~${Math.round(parseInt(betAmount) * parseFloat(odds))} VT`;
              })()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
