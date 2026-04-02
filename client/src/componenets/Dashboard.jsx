import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  mockStocks, defaultPortfolio, initializePrices, tickPrices, getPrice, eviHistory
} from '../utils/mockData';
import { calculateEVI, getEVILabel } from '../utils/eviCalculator';
import { logBehaviorEvent, getServerEVI, checkHealth, isBackendOnline, onConnectionChange } from '../utils/api';
import InterventionModal from './InterventionalModal';
import BehaviorGraph from './BehavioraGraph';
import AIChat from './AIChat';
import StockChart from './StockChart';

// ── EVI Segmented Bar ───────────────────────────────────────────
function EVIMeter({ value }) {
  const segments = 40;
  const getSegmentColor = (i) => {
    const pct = (i / segments) * 100;
    if (pct <= 30) return '#00ff41';
    if (pct <= 50) return '#ffaa00';
    if (pct <= 70) return '#ff6600';
    return '#ff0033';
  };
  const activeSegments = Math.round((value / 100) * segments);

  return (
    <div className="w-full">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-[10px] uppercase tracking-[2px] text-terminal-muted">Emotional Volatility Index</span>
        <span className="font-mono text-2xl font-bold" style={{ color: value > 70 ? '#ff0033' : value > 50 ? '#ffaa00' : '#00ff41' }}>
          {value}
        </span>
      </div>
      <div className="flex gap-[2px] h-6 border border-terminal-border p-[2px] bg-black">
        {Array.from({ length: segments }, (_, i) => (
          <div
            key={i}
            className="evi-segment flex-1"
            style={{
              backgroundColor: i < activeSegments ? getSegmentColor(i) : '#111',
              opacity: i < activeSegments ? 1 : 0.3,
            }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-terminal-muted font-mono">0 CALM</span>
        <span className="text-[9px] text-terminal-muted font-mono">30</span>
        <span className="text-[9px] text-terminal-muted font-mono">50</span>
        <span className="text-[9px] text-terminal-muted font-mono">70</span>
        <span className="text-[9px] text-terminal-muted font-mono">100 PANIC</span>
      </div>
      {value > 60 && (
        <div className="mt-2 border border-terminal-red/30 bg-terminal-red/5 px-2 py-1 text-[11px] font-mono text-terminal-red animate-blink">
          ⚠ SELL ORDERS INTERCEPTED — EVI ABOVE THRESHOLD
        </div>
      )}
    </div>
  );
}

// ── Connection status badge ──────────────────────────────────────
function ConnectionBadge({ online }) {
  return (
    <div className={`flex items-center gap-1.5 px-2 py-0.5 border text-[9px] font-mono uppercase tracking-wider transition-colors duration-300
      ${online
        ? 'border-terminal-green/30 text-terminal-green/70'
        : 'border-terminal-red/30 text-terminal-red/70 animate-blink'}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-terminal-green' : 'bg-terminal-red'}`} />
      {online ? 'BACKEND ONLINE' : 'OFFLINE — DEMO MODE'}
    </div>
  );
}

export default function Dashboard() {
  const profile = JSON.parse(localStorage.getItem('sentinel_profile') || '{}');
  const [portfolio, setPortfolio] = useState([]);
  const [evi, setEVI] = useState(73);
  const [showModal, setShowModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [activePanel, setActivePanel] = useState('chat');
  const [actionLog, setActionLog] = useState([]);
  const [tick, setTick] = useState(0);
  const [toast, setToast] = useState(null);
  const [backendOnline, setBackendOnline] = useState(isBackendOnline());

  // Track backend connectivity
  useEffect(() => {
    const unsub = onConnectionChange(setBackendOnline);
    // Ping health on mount
    checkHealth().catch(() => setBackendOnline(false));
    return unsub;
  }, []);

  useEffect(() => { initializePrices(); updatePortfolio(); }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      tickPrices();
      updatePortfolio();
      setTick(t => t + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); }
  }, [toast]);

  // Fetch server-side EVI periodically when backend is available
  useEffect(() => {
    if (!profile?.userId || !backendOnline) return;
    const fetchEVI = () => {
      getServerEVI(profile.userId)
        .then(data => {
          if (data?.evi != null) {
            setEVI(prev => Math.round(prev * 0.5 + data.evi * 0.5));
          }
        })
        .catch(() => { /* silent — local EVI is fallback */ });
    };
    fetchEVI();
    const interval = setInterval(fetchEVI, 30000); // every 30s
    return () => clearInterval(interval);
  }, [profile?.userId, backendOnline]);

  const updatePortfolio = useCallback(() => {
    const updated = defaultPortfolio.map(holding => {
      const stock = mockStocks.find(s => s.symbol === holding.symbol);
      const priceData = getPrice(holding.symbol);
      const currentValue = priceData.price * holding.qty;
      const investedValue = holding.avgBuy * holding.qty;
      const pnl = currentValue - investedValue;
      const pnlPercent = (pnl / investedValue) * 100;
      return { ...holding, ...stock, ...priceData, currentValue, investedValue, pnl, pnlPercent };
    });
    setPortfolio(updated);
    const totalPnlPercent = updated.reduce((sum, h) => sum + h.pnlPercent, 0) / updated.length;
    const newEVI = calculateEVI({
      portfolioLossPercent: totalPnlPercent,
      marketVolatility: Math.random() * 0.5 + 0.2,
      rapidActions: actionLog.filter(a => Date.now() - a.time < 60000).length,
      recentTrades: actionLog.map(a => ({ type: a.type, priceChange: a.change || 0 })),
    });
    setEVI(prev => Math.round(prev * 0.7 + newEVI * 0.3));
  }, [actionLog]);

  const logBehavior = async (type, symbol, extra = {}) => {
    if (!profile?.userId) return;
    try {
      await logBehaviorEvent({
        userId: profile.userId,
        type,
        symbol,
        eviAtTime: evi,
        interventionShown: evi > 60,
        ...extra,
      });
    } catch (e) { /* silent — demo still works */ }
  };

  const handleSellClick = (stock) => {
    setSelectedStock(stock);
    if (evi > 60) {
      setShowModal(true);
      logBehavior('sell_attempt', stock.symbol, { price: stock.price, quantity: stock.qty });
      setActionLog(prev => [...prev, { type: 'sell_attempt', symbol: stock.symbol, time: Date.now(), change: stock.changePercent }]);
    } else {
      setToast({ message: `EXECUTED: ${stock.symbol} SOLD @ ₹${stock.price.toFixed(2)}`, type: 'success' });
      logBehavior('sell_confirmed', stock.symbol, { price: stock.price, quantity: stock.qty });
      setActionLog(prev => [...prev, { type: 'sell', symbol: stock.symbol, time: Date.now(), change: stock.changePercent }]);
    }
  };

  const handleModalClose = (proceeded) => {
    setShowModal(false);
    if (proceeded) {
      setToast({ message: `WARNING: ${selectedStock?.symbol} SOLD DESPITE INTERVENTION`, type: 'warning' });
      logBehavior('sell_confirmed', selectedStock?.symbol, { interventionResult: 'proceeded' });
    } else {
      setToast({ message: `HELD: ${selectedStock?.symbol} — POSITION RETAINED`, type: 'success' });
      logBehavior('sell_cancelled', selectedStock?.symbol, { interventionResult: 'cancelled' });
    }
    setActionLog(prev => [
      ...prev,
      { type: proceeded ? 'sell' : 'cancel', symbol: selectedStock?.symbol, time: Date.now() }
    ]);
  };

  const totalValue = portfolio.reduce((s, h) => s + h.currentValue, 0);
  const totalInvested = portfolio.reduce((s, h) => s + h.investedValue, 0);
  const totalPnl = totalValue - totalInvested;
  const totalPnlPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* ── Header ────────────────────────────────────────────────── */}
      <header className="border-b border-terminal-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="font-mono text-lg font-bold text-terminal-green tracking-wider no-underline">
            SENTINEL<span className="text-terminal-muted text-xs ml-1">v2.1</span>
          </Link>
          <nav className="flex gap-0 border border-terminal-border">
            <button className="btn-terminal px-3 py-1 text-xs font-medium bg-terminal-green/10 text-terminal-green border-r border-terminal-border">
              DASHBOARD
            </button>
            <Link to="/behavior" className="btn-terminal px-3 py-1 text-xs font-medium text-terminal-dim hover:text-white hover:bg-white/5 border-r border-terminal-border no-underline">
              BEHAVIOR
            </Link>
            <Link to="/ai-chat" className="btn-terminal px-3 py-1 text-xs font-medium text-terminal-dim hover:text-white hover:bg-white/5 no-underline">
              AI COACH
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <ConnectionBadge online={backendOnline} />
          <div className="text-right">
            <div className="text-[10px] text-terminal-muted uppercase tracking-wider">OPERATOR</div>
            <div className="font-mono text-sm">{profile.name || 'RAM'}</div>
          </div>
          <div className="w-2 h-2 bg-terminal-green animate-blink" />
        </div>
      </header>

      {/* ── Toast ──────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed top-0 right-0 z-[9999] px-4 py-2 text-xs font-mono toast-enter border-b border-l
          ${toast.type === 'success' ? 'bg-terminal-green/10 text-terminal-green border-terminal-green/30' : 'bg-terminal-red/10 text-terminal-red border-terminal-red/30'}`}>
          {toast.message}
        </div>
      )}

      {/* ── Summary Strip ─────────────────────────────────────────── */}
      <div className="border-b border-terminal-border grid grid-cols-5 divide-x divide-terminal-border">
        {[
          { label: 'PORTFOLIO', value: `₹${totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, color: 'text-white' },
          { label: 'DAY P&L', value: `${totalPnl >= 0 ? '+' : ''}₹${totalPnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, color: totalPnl >= 0 ? 'text-terminal-green' : 'text-terminal-red' },
          { label: 'RETURNS', value: `${totalPnlPercent >= 0 ? '+' : ''}${totalPnlPercent.toFixed(2)}%`, color: totalPnlPercent >= 0 ? 'text-terminal-green' : 'text-terminal-red' },
          { label: 'POSITIONS', value: portfolio.length.toString(), color: 'text-white' },
          { label: 'EVI SCORE', value: evi.toString(), color: evi > 70 ? 'text-terminal-red' : evi > 50 ? 'text-terminal-amber' : 'text-terminal-green' },
        ].map((s, i) => (
          <div key={i} className="px-4 py-2">
            <div className="text-[9px] text-terminal-muted uppercase tracking-[1.5px]">{s.label}</div>
            <div className={`font-mono text-lg font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Main Grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-[1fr_340px] divide-x divide-terminal-border" style={{ height: 'calc(100vh - 105px)' }}>
        {/* Left: Portfolio + Chart */}
        <div className="flex flex-col divide-y divide-terminal-border overflow-hidden">
          {/* Portfolio Table */}
          <div className="flex-1 overflow-auto p-0">
            <div className="px-3 py-2 border-b border-terminal-border flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[2px] text-terminal-muted">POSITIONS</span>
              <span className="text-[10px] text-terminal-dim font-mono">{portfolio.length} ACTIVE</span>
            </div>
            <table className="data-grid w-full text-xs">
              <thead>
                <tr className="bg-terminal-surface border-b border-terminal-border">
                  {['SYMBOL', 'LTP', 'CHG%', 'QTY', 'INVESTED', 'CURRENT', 'P&L', ''].map(h => (
                    <th key={h} className="text-left px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-terminal-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {portfolio.map(h => (
                  <tr key={h.symbol} className="border-b border-terminal-border/50 hover:bg-white/[0.02] transition-colors">
                    <td className="px-3 py-1.5">
                      <div className="font-mono font-bold text-sm">{h.symbol}</div>
                      <div className="text-[10px] text-terminal-muted">{h.sector}</div>
                    </td>
                    <td className="px-3 py-1.5 font-mono">₹{h.price.toFixed(2)}</td>
                    <td className={`px-3 py-1.5 font-mono font-bold ${h.changePercent >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
                      {h.changePercent >= 0 ? '▲' : '▼'}{Math.abs(h.changePercent).toFixed(2)}%
                    </td>
                    <td className="px-3 py-1.5 font-mono">{h.qty}</td>
                    <td className="px-3 py-1.5 font-mono text-terminal-dim">₹{h.investedValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                    <td className="px-3 py-1.5 font-mono">₹{h.currentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                    <td className={`px-3 py-1.5 font-mono font-bold ${h.pnl >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
                      {h.pnl >= 0 ? '+' : ''}₹{h.pnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-3 py-1.5">
                      <button
                        onClick={() => handleSellClick(h)}
                        className="btn-terminal px-2 py-0.5 text-[10px] font-mono font-bold border border-terminal-red/40 text-terminal-red hover:bg-terminal-red/10 uppercase tracking-wider"
                      >
                        SELL
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Stock Chart */}
          <div className="h-[300px]">
            <StockChart stocks={portfolio} tick={tick} />
          </div>
        </div>

        {/* Right: EVI + Panels */}
        <div className="flex flex-col divide-y divide-terminal-border overflow-hidden">
          {/* EVI Meter */}
          <div className="p-3">
            <EVIMeter value={evi} />
          </div>

          {/* Panel Toggle */}
          <div className="flex divide-x divide-terminal-border">
            <button
              onClick={() => setActivePanel('chat')}
              className={`btn-terminal flex-1 py-1.5 text-[10px] uppercase tracking-[2px] font-semibold
                ${activePanel === 'chat' ? 'bg-terminal-green/10 text-terminal-green' : 'text-terminal-muted hover:text-white hover:bg-white/5'}`}
            >
              ● AI COACH
            </button>
            <button
              onClick={() => setActivePanel('graph')}
              className={`btn-terminal flex-1 py-1.5 text-[10px] uppercase tracking-[2px] font-semibold
                ${activePanel === 'graph' ? 'bg-terminal-green/10 text-terminal-green' : 'text-terminal-muted hover:text-white hover:bg-white/5'}`}
            >
              ● BEHAVIOR
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-hidden">
            {activePanel === 'chat' ? (
              <AIChat evi={evi} portfolio={portfolio} />
            ) : (
              <BehaviorGraph data={eviHistory} />
            )}
          </div>
        </div>
      </div>

      {/* Intervention Modal */}
      {showModal && selectedStock && (
        <InterventionModal stock={selectedStock} evi={evi} onClose={handleModalClose} />
      )}
    </div>
  );
}
