import React, { useState, useEffect } from 'react';
import { recoveryStories } from '../utils/mockData';

export default function InterventionModal({ stock, evi, onClose }) {
  const [checks, setChecks] = useState([false, false, false]);
  const [currentLayer, setCurrentLayer] = useState(1);
  const [countdown, setCountdown] = useState(null);
  const [held, setHeld] = useState(false);

  const story = recoveryStories[stock.symbol] || recoveryStories.DEFAULT;
  const allChecked = checks.every(Boolean);

  const toggleCheck = (i) => {
    setChecks(prev => { const next = [...prev]; next[i] = !next[i]; return next; });
  };

  const lossAmount = Math.abs(stock.pnl).toFixed(0);
  const goalDelayMonths = Math.max(1, Math.round(Math.abs(stock.pnlPercent) * 2.5));

  const handleProceed = () => {
    if (!allChecked || currentLayer < 4) return;
    setCountdown(5);
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) { onClose(true); return; }
    const t = setTimeout(() => setCountdown(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleHold = () => {
    setHeld(true);
    setTimeout(() => onClose(false), 1000);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center modal-backdrop bg-black/80 animate-fade">
      <div className="w-full max-w-[540px] max-h-[90vh] overflow-y-auto bg-terminal-card border border-terminal-border border-t-4 border-t-terminal-red animate-slide">

        {/* Header */}
        <div className="border-b border-terminal-border px-5 py-4 text-center">
          <div className="text-terminal-red text-[10px] font-mono uppercase tracking-[4px] mb-2 animate-blink">
            ▓▓▓ SYSTEM OVERRIDE ▓▓▓
          </div>
          <div className="text-lg font-bold">SENTINEL INTERVENTION</div>
          <div className="text-xs text-terminal-dim mt-1">
            EVI at <span className="font-mono font-bold text-terminal-red">{evi}</span> — Sell order intercepted for review
          </div>
        </div>

        {/* Layer 1: Checklist */}
        <div className="border-b border-terminal-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-[9px] px-1.5 py-0.5 bg-terminal-cyan/10 text-terminal-cyan border border-terminal-cyan/30 uppercase tracking-wider">L1</span>
            <span className="text-xs font-semibold uppercase tracking-wider">SELF-CHECK PROTOCOL</span>
          </div>
          {[
            'I am not reacting to a single day\'s price movement',
            'I have a rational reason beyond fear or frustration',
            'I have considered what happens if this stock recovers tomorrow',
          ].map((text, i) => (
            <label key={i} className="flex items-center gap-3 py-2 border-b border-terminal-border/30 cursor-pointer text-xs text-terminal-dim hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={checks[i]}
                onChange={() => toggleCheck(i)}
                className="w-4 h-4 appearance-none border border-terminal-border bg-black checked:bg-terminal-green checked:border-terminal-green cursor-pointer"
              />
              {text}
            </label>
          ))}
        </div>

        {/* Layer 2: Impact */}
        {currentLayer >= 2 && (
          <div className="border-b border-terminal-border p-4 animate-slide">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-[9px] px-1.5 py-0.5 bg-terminal-amber/10 text-terminal-amber border border-terminal-amber/30 uppercase tracking-wider">L2</span>
              <span className="text-xs font-semibold uppercase tracking-wider">GOAL IMPACT ANALYSIS</span>
            </div>
            <div className="text-center py-3">
              <div className="font-mono text-3xl font-bold text-terminal-amber">{goalDelayMonths}</div>
              <div className="text-[10px] text-terminal-muted uppercase tracking-wider mt-1">MONTHS DELAY ON FINANCIAL GOALS</div>
            </div>
            <div className="text-[11px] text-terminal-dim text-center mt-1">
              Selling {stock.symbol} at ₹{Number(lossAmount).toLocaleString('en-IN')} loss
            </div>
          </div>
        )}

        {/* Layer 3: Historical Context */}
        {currentLayer >= 3 && (
          <div className="border-b border-terminal-border p-4 animate-slide">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-[9px] px-1.5 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/30 uppercase tracking-wider">L3</span>
              <span className="text-xs font-semibold uppercase tracking-wider">HISTORICAL PRECEDENT</span>
            </div>
            <div className="border-l-2 border-purple-500/50 pl-3 text-xs text-terminal-dim leading-relaxed">
              {story.context}
            </div>
            <div className="flex gap-6 mt-3 justify-center">
              <div className="text-center">
                <div className="font-mono text-lg font-bold text-purple-400">-{story.drop}</div>
                <div className="text-[9px] text-terminal-muted uppercase">MAX DROP</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-lg font-bold text-terminal-green">{story.recovery}</div>
                <div className="text-[9px] text-terminal-muted uppercase">RECOVERY</div>
              </div>
            </div>
          </div>
        )}

        {/* Layer 4: Peer Data */}
        {currentLayer >= 4 && (
          <div className="border-b border-terminal-border p-4 animate-slide">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-[9px] px-1.5 py-0.5 bg-terminal-green/10 text-terminal-green border border-terminal-green/30 uppercase tracking-wider">L4</span>
              <span className="text-xs font-semibold uppercase tracking-wider">PEER CONSENSUS</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="font-mono text-4xl font-bold text-terminal-green">91%</div>
              <div className="text-xs text-terminal-dim leading-relaxed">
                of operators in similar conditions chose to <span className="text-white font-semibold">HOLD</span> — 78% of those positions recovered within 6 weeks
              </div>
            </div>
            <div className="mt-3 text-center text-[10px] text-terminal-green/70 font-mono border border-terminal-green/20 bg-terminal-green/5 py-1">
              AVG SAVINGS PER INTERVENTION: ₹14,200
            </div>
          </div>
        )}

        {/* Expand Layers */}
        {currentLayer < 4 && (
          <button
            onClick={() => setCurrentLayer(p => p + 1)}
            className="btn-terminal w-full py-2 text-[10px] font-mono uppercase tracking-[2px] text-terminal-muted hover:text-white hover:bg-white/5 border-b border-terminal-border"
          >
            ▼ REVEAL LAYER {currentLayer + 1} ({4 - currentLayer} REMAINING) ▼
          </button>
        )}

        {/* Countdown */}
        {countdown !== null && countdown > 0 && (
          <div className="px-5 py-3 text-center bg-terminal-red/5 border-b border-terminal-red/30">
            <div className="font-mono text-3xl font-bold text-terminal-red">{countdown}</div>
            <div className="text-[10px] font-mono text-terminal-muted mt-1">EXECUTING IN {countdown}s — CLICK HOLD TO ABORT</div>
          </div>
        )}

        {/* Held confirmation */}
        {held && (
          <div className="px-5 py-4 text-center animate-fade">
            <div className="font-mono text-terminal-green text-sm font-bold">✓ POSITION RETAINED — GOOD CALL, OPERATOR</div>
          </div>
        )}

        {/* Actions */}
        {!held && (
          <div className="flex divide-x divide-terminal-border">
            <button
              onClick={handleHold}
              className="btn-terminal flex-1 py-3 text-xs font-bold uppercase tracking-wider bg-terminal-green/10 text-terminal-green hover:bg-terminal-green/20 border-r border-terminal-border"
            >
              ✋ HOLD POSITION
            </button>
            <button
              onClick={handleProceed}
              className={`btn-terminal flex-1 py-3 text-xs uppercase tracking-wider
                ${allChecked && currentLayer >= 4
                  ? 'text-terminal-red/80 hover:text-terminal-red hover:bg-terminal-red/5 border border-transparent hover:border-terminal-red/30'
                  : 'text-terminal-muted/30 cursor-not-allowed'}`}
              disabled={!allChecked || currentLayer < 4}
            >
              {countdown !== null ? `SELLING ${countdown}...` : 'PROCEED WITH SELL'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
