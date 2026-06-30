import { nanoid } from "nanoid";

export function generateId() {
  return nanoid(10);
}

export function calculateOdds(forPool: number, againstPool: number) {
  const total = forPool + againstPool;
  if (total === 0) return { forOdds: 2.0, againstOdds: 2.0 };
  const forOdds = forPool === 0 ? 99 : parseFloat((total / forPool).toFixed(2));
  const againstOdds = againstPool === 0 ? 99 : parseFloat((total / againstPool).toFixed(2));
  return { forOdds, againstOdds };
}
