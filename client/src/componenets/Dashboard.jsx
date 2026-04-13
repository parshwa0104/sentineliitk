import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  mockStocks, defaultPortfolio, initializePrices, tickPrices, getPrice, eviHistory,
  setLivePrices, isLivePricing,
} from '../utils/mockData';
import { getEVILabel } from '../utils/eviCalculator';
import {
  logBehaviorEvent, getServerEVI, checkHealth, isBackendOnline, onConnectionChange,
  fetchStockQuotes, fetchMarketStatus,
} from '../utils/api';
import { useEVI } from '../utils/eviStore';
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
  const { label } = getEVILabel(value);

  return (
    <div className="w-full">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-[10px] uppercase tracking-[2px] text-terminal-muted">Emotional Volatility Index</span>
        <div className="flex items-center gap-2">
          <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 border font-mono"
            style={{
              color: value > 70 ? '#ff0033' : value > 50 ? '#ffaa00' : '#00ff41',
              borderColor: value > 70 ? '#ff003333' : value > 50 ? '#ffaa0033' : '#00ff4133',
              backgroundColor: value > 70 ? '#ff003310' : value > 50 ? '#ffaa0010' : '#00ff4110',
            }}
          >
            {label}
          </span>
          <span className="font-mono text-2xl font-bold transition-all duration-500"
            style={{ color: value > 70 ? '#ff0033' : value > 50 ? '#ffaa00' : '#00ff41' }}>
            {value}
          </span>
        </div>
      </div>
      <div className="flex gap-[2px] h-6 border border-terminal-border p-[2px] bg-black">
        {Array.from({ length: segments }, (_, i) => (
          <div
            key={i}
            className="evi-segment flex-1 transition-all duration-300"
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
function ConnectionBadge({ online, livePrices }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`flex items-center gap-1.5 px-2 py-0.5 border text-[9px] font-mono uppercase tracking-wider transition-colors duration-300
        ${online
          ? 'border-terminal-green/30 text-terminal-green/70'
          : 'border-terminal-red/30 text-terminal-red/70 animate-blink'}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-terminal-green' : 'bg-terminal-red'}`} />
        {online ? 'BACKEND ONLINE' : 'OFFLINE — DEMO MODE'}
      </div>
      {livePrices && (
        <div className="flex items-center gap-1.5 px-2 py-0.5 border border-terminal-cyan/30 text-[9px] font-mono uppercase tracking-wider text-terminal-cyan/70">
          <div className="w-1.5 h-1.5 rounded-full bg-terminal-cyan animate-blink" />
          LIVE NSE PRICES
        </div>
      )}
    </div>
  );
}

// ── Market status badge ──────────────────────────────────────────
function MarketStatusBadge({ status }) {
  if (!status) return null;
  return (
    <div className={`flex items-center gap-1.5 px-2 py-0.5 border text-[9px] font-mono uppercase tracking-wider
      ${status.isOpen
        ? 'border-terminal-green/30 text-terminal-green/70'
        : 'border-terminal-amber/30 text-terminal-amber/70'}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${status.isOpen ? 'bg-terminal-green animate-blink' : 'bg-terminal-amber'}`} />
      NSE {status.isOpen ? 'OPEN' : 'CLOSED'} · {status.currentIST} IST
    </div>
  );
}

export default function Dashboard() {
  const profile = JSON.parse(localStorage.getItem('sentinel_profile') || '{}');
  const [portfolio, setPortfolio] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [activePanel, setActivePanel] = useState('chat');
  const [actionLog, setActionLog] = useState([]);
  const [tick, setTick] = useState(0);
  const [toast, setToast] = useState(null);
  const [backendOnline, setBackendOnline] = useState(isBackendOnline());
  const [liveMode, setLiveMode] = useState(false);
  const [marketStatus, setMarketStatus] = useState(null);
  const [lastPriceUpdate, setLastPriceUpdate] = useState(null);

  // EVI from centralized store
  const { score: evi, recordEvent, updateMarketData } = useEVI();

  // Track backend connectivity
  useEffect(() => {
    const unsub = onConnectionChange(setBackendOnline);
    checkHealth().catch(() => setBackendOnline(false));
    return unsub;
  }, []);

  // Initialize mock prices as baseline
  useEffect(() => { initializePrices(); updatePortfolio(); }, []);

  // ── Live stock price fetching ──────────────────────────────────
  useEffect(() => {
    if (!backendOnline) return;

    // Get market status
    fetchMarketStatus()
      .then(setMarketStatus)
      .catch(() => {});

    // Fetch live prices immediately and then every 10s
    const symbols = defaultPortfolio.map(h => h.symbol);

    const fetchLive = () => {
      fetchStockQuotes(symbols)
        .then(data => {
          if (data?.quotes && data.quotes.length > 0) {
            setLivePrices(data.quotes);
            setLiveMode(true);
            setLastPriceUpdate(new Date());
            updatePortfolio();
          }
        })
        .catch(() => {
          // Fall back to mock ticks
          if (!isLivePricing()) {
            tickPrices();
            updatePortfolio();
          }
        });
    };

    fetchLive();
    const interval = setInterval(fetchLive, 10000); // Every 10 seconds for live data
    return () => clearInterval(interval);
  }, [backendOnline]);

  // ── Mock tick fallback (only when not live) ────────────────────
  useEffect(() => {
    if (liveMode) return; // Don't run mock ticks if we have live data
    const interval = setInterval(() => {
      tickPrices();
      updatePortfolio();
      setTick(t => t + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, [liveMode]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); }
  }, [toast]);

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
    setTick(t => t + 1);

    // Update market data in EVI store
    const totalPnlPercent = updated.reduce((sum, h) => sum + h.pnlPercent, 0) / updated.length;
    const losers = updated.filter(h => h.changePercent < 0).length;
    const gainers = updated.filter(h => h.changePercent >= 0).length;
    const avgChange = updated.reduce((sum, h) => sum + (h.changePercent || 0), 0) / updated.length;

    updateMarketData({
      portfolioLossPercent: totalPnlPercent,
      losersCount: losers,
      gainersCount: gainers,
      avgChangePercent: avgChange,
    });
  }, [updateMarketData]);

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
    recordEvent('sell_click', { symbol: stock.symbol, price: stock.price });

    if (evi > 60) {
      setShowModal(true);
      recordEvent('sell_attempt', { symbol: stock.symbol, price: stock.price });
      logBehavior('sell_attempt', stock.symbol, { price: stock.price, quantity: stock.qty });
      setActionLog(prev => [...prev, { type: 'sell_attempt', symbol: stock.symbol, time: Date.now(), change: stock.changePercent }]);
    } else {
      setToast({ message: `EXECUTED: ${stock.symbol} SOLD @ ₹${stock.price.toFixed(2)}`, type: 'success' });
      logBehavior('sell_confirmed', stock.symbol, { price: stock.price, quantity: stock.qty });
      setActionLog(prev => [...prev, { type: 'sell', symbol: stock.symbol, time: Date.now(), change: stock.changePercent }]);
    }
  };

  const handleSellHover = useCallback((symbol) => {
    recordEvent('sell_hover', { symbol });
  }, [recordEvent]);

  const handleModalClose = (proceeded) => {
    setShowModal(false);
    if (proceeded) {
      setToast({ message: `WARNING: ${selectedStock?.symbol} SOLD DESPITE INTERVENTION`, type: 'warning' });
      recordEvent('sell_confirmed', { symbol: selectedStock?.symbol });
      logBehavior('sell_confirmed', selectedStock?.symbol, { interventionResult: 'proceeded' });
    } else {
      setToast({ message: `HELD: ${selectedStock?.symbol} — POSITION RETAINED`, type: 'success' });
      recordEvent('sell_cancelled', { symbol: selectedStock?.symbol });
      logBehavior('sell_cancelled', selectedStock?.symbol, { interventionResult: 'cancelled' });
    }
    setActionLog(prev => [
      ...prev,
      { type: proceeded ? 'sell' : 'cancel', symbol: selectedStock?.symbol, time: Date.now() }
    ]);
  };

  const handlePanelSwitch = (panel) => {
    setActivePanel(panel);
    if (panel === 'chat') {
      recordEvent('ai_chat_opened');
    }
    recordEvent('page_switch', { panel });
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
          <MarketStatusBadge status={marketStatus} />
          <ConnectionBadge online={backendOnline} livePrices={liveMode} />
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
            <div className={`font-mono text-lg font-bold ${s.color} transition-all duration-300`}>{s.value}</div>
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
              <div className="flex items-center gap-2">
                {liveMode && lastPriceUpdate && (
                  <span className="text-[9px] text-terminal-cyan/50 font-mono">
                    LAST UPDATE: {lastPriceUpdate.toLocaleTimeString('en-IN')}
                  </span>
                )}
                <span className="text-[10px] text-terminal-dim font-mono">{portfolio.length} ACTIVE</span>
              </div>
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
                        onMouseEnter={() => handleSellHover(h.symbol)}
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
              onClick={() => handlePanelSwitch('chat')}
              className={`btn-terminal flex-1 py-1.5 text-[10px] uppercase tracking-[2px] font-semibold
                ${activePanel === 'chat' ? 'bg-terminal-green/10 text-terminal-green' : 'text-terminal-muted hover:text-white hover:bg-white/5'}`}
            >
              ● AI COACH
            </button>
            <button
              onClick={() => handlePanelSwitch('graph')}
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
