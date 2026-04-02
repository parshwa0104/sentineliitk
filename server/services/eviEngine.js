/**
 * Server-side EVI Engine
 * Computes EVI from stored behavior events for a user
 */

function computeEVI(events = [], profile = {}) {
  let evi = 30;

  // Recent events in last hour
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const recent = events.filter(e => new Date(e.timestamp).getTime() > oneHourAgo);

  // Panic sells boost EVI significantly
  const panicSells = recent.filter(e => e.type === 'panic_sell' || e.type === 'sell_confirmed').length;
  evi += Math.min(panicSells * 12, 30);

  // High trade frequency
  evi += Math.min(recent.length * 3, 15);

  // Interventions shown but proceeded anyway
  const ignoredWarnings = recent.filter(e => e.interventionShown && e.interventionResult === 'proceeded').length;
  evi += ignoredWarnings * 8;

  // Profile-based baseline adjustment
  if (profile.riskTolerance === 'conservative') evi += 10;
  if (profile.reactionToLoss === 'panic') evi += 15;
  if (profile.reactionToLoss === 'worried') evi += 8;

  return Math.round(Math.min(Math.max(evi, 0), 100));
}

module.exports = { computeEVI };
