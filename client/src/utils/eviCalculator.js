// === EVI Calculator — Emotional Volatility Index ===
// Computes a 0–100 score based on trading behavior signals

/**
 * Factors that increase EVI:
 * - Rapid sell / buy after a price drop (panic)
 * - Multiple trades in short time (churn)
 * - Trading during high-volatility market hours
 * - Selling at a loss while market is recovering
 * - Portfolio concentration in dropping stocks
 */

export function calculateEVI({
  recentTrades = [],        // last N trades { type, timestamp, priceChange }
  portfolioLossPercent = 0, // current portfolio unrealized loss %
  marketVolatility = 0,     // current market volatility (0–1)
  sessionDuration = 0,      // minutes spent on dashboard
  rapidActions = 0,         // number of actions in last 60 seconds
}) {
  let evi = 30; // baseline — mild awareness

  // 1. Portfolio stress (max +25)
  if (portfolioLossPercent < 0) {
    evi += Math.min(Math.abs(portfolioLossPercent) * 5, 25);
  }

  // 2. Market volatility amplifier (max +15)
  evi += marketVolatility * 15;

  // 3. Rapid-fire actions (panic clicking) (max +20)
  if (rapidActions > 3) {
    evi += Math.min((rapidActions - 3) * 5, 20);
  }

  // 4. Recent panic sells (max +20)
  const panicSells = recentTrades.filter(t =>
    t.type === 'sell' && t.priceChange < -2
  ).length;
  evi += Math.min(panicSells * 10, 20);

  // 5. Session fatigue (max +10)
  if (sessionDuration > 30) {
    evi += Math.min((sessionDuration - 30) / 6, 10);
  }

  // 6. FOMO buys (max +10)
  const fomoBuys = recentTrades.filter(t =>
    t.type === 'buy' && t.priceChange > 3
  ).length;
  evi += Math.min(fomoBuys * 5, 10);

  return Math.round(Math.min(Math.max(evi, 0), 100));
}

export function getEVILabel(evi) {
  if (evi <= 30) return { label: 'Calm', className: 'evi-low', color: '#34d399' };
  if (evi <= 50) return { label: 'Aware', className: 'evi-medium', color: '#fbbf24' };
  if (evi <= 70) return { label: 'Stressed', className: 'evi-high', color: '#fb7185' };
  return { label: 'Panicking', className: 'evi-critical', color: '#ef4444' };
}
