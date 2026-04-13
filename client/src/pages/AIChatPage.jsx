import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { postChat, isBackendOnline, onConnectionChange, fetchStockQuotes } from '../utils/api';
import { initializePrices, getPrice, defaultPortfolio, mockStocks, setLivePrices, isLivePricing } from '../utils/mockData';
import { useEVI } from '../utils/eviStore';

const suggestedPrompts = [
  'Why do I keep panic selling?',
  'Am I overreacting to this market drop?',
  'How do I stop checking my portfolio every 5 minutes?',
  'Should I sell TATAMOTORS right now?',
  'What is my biggest behavioral blind spot?',
  'Create a calm-down strategy for red days',
];

// Offline fallback responses — clearly labeled so users know AI isn't actually running
const offlineResponses = {
  'Why do I keep panic selling?': `[OFFLINE MODE — cached response]

ANALYSIS: PANIC SELL PATTERN DETECTED

DATA: 5 positions liquidated Thursday during 2.3% market dip. EVI hit 73.

ROOT CAUSE: Loss aversion — losses feel 2x more painful than equivalent gains. Your amygdala hijacks rational processing when you see red.

EVIDENCE: 4 of 5 stocks you sold have already recovered. INFY up 3.2% since your exit.

PROTOCOL: Implement 24-hour cooling period. When EVI >60, write down sell rationale. If valid after 24h, then execute. Historical data: 78% of the time, the reason expires.`,

  'Am I overreacting to this market drop?': `[OFFLINE MODE — cached response]

ASSESSMENT: LIKELY YES

Market dip: 2.3%. Your response: 5 sell orders. Disproportionate.

HISTORICAL CONTEXT: Nifty 50 has had 47 drops of 2%+ in last 3 years. 43 of 47 recovered within 2 weeks (91.5% recovery rate).

Your portfolio holds RELIANCE, TCS, HDFC Bank — fundamental strength unchanged. Price movement ≠ value change.

RECOMMENDATION: EVI at 73 indicates emotional override. Stand down from trading until EVI normalizes below 50.`,

  'Should I sell TATAMOTORS right now?': `[OFFLINE MODE — cached response]

POSITION ANALYSIS: TATAMOTORS

HOLDING: 40 shares @ ₹680 avg
CURRENT: ~₹640 (-5.9%)
UNREALIZED LOSS: ₹1,600

HISTORICAL PRECEDENT: TATAMOTORS crashed 35% during EV concerns — recovered in 10 weeks on strong JLR + Nexon EV data.

THESIS CHECK: Has your investment thesis changed, or just the price? If thesis intact, this is noise.

VERDICT: HOLD. Selling at loss during elevated EVI (73) is textbook disposition effect. 91% of operators in similar conditions held and recovered.`,
};

function getOfflineFallback(userMsg) {
  if (offlineResponses[userMsg]) return offlineResponses[userMsg];
  return `[OFFLINE MODE — AI service unavailable]

${userMsg.toLowerCase().includes('sell')
    ? 'CAUTION: Sell impulse during high EVI correlates with regret in 82% of cases. 91% of operators in similar states held and recovered.'
    : 'Your engagement level suggests heightened awareness. Channel this into analysis, not action.'}

Connect to the backend server to get live AI analysis. Check that the server is running and GEMINI_API_KEY is configured.`;
}

export default function AIChatPage() {
  const profile = JSON.parse(localStorage.getItem('sentinel_profile') || '{}');
  const { score: evi, recordEvent } = useEVI();

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `SENTINEL.AI INITIALIZED\n\nPortfolio state loaded. EVI: ${evi} (${evi > 70 ? 'CRITICAL' : evi > 50 ? 'ELEVATED' : 'NORMAL'})\nBehavioral patterns being monitored in real-time.\n\nReady for analysis. Query your trading psychology, biases, or request strategy recommendations.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [portfolio, setPortfolio] = useState([]);
  const [backendOnline, setBackendOnline] = useState(isBackendOnline());
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const unsub = onConnectionChange(setBackendOnline);
    return unsub;
  }, []);

  useEffect(() => {
    initializePrices();

    // Try to get live prices
    const symbols = defaultPortfolio.map(h => h.symbol);
    fetchStockQuotes(symbols)
      .then(data => {
        if (data?.quotes?.length > 0) {
          setLivePrices(data.quotes);
        }
        updatePortfolioData();
      })
      .catch(() => {
        updatePortfolioData();
      });
  }, []);

  const updatePortfolioData = () => {
    const updated = defaultPortfolio.map(holding => {
      const stock = mockStocks.find(s => s.symbol === holding.symbol);
      const priceData = getPrice(holding.symbol);
      return { ...holding, ...stock, ...priceData };
    });
    setPortfolio(updated);
  };

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };
  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleSend = async (text) => {
    const userMsg = (text || input).trim();
    if (!userMsg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    // Record AI chat interaction in EVI store
    recordEvent('ai_chat_query', { message: userMsg.slice(0, 100) });

    try {
      const portfolioSummary = portfolio.slice(0, 5)
        .map(h => `${h.symbol}: ₹${h.price?.toFixed(0) || 0} (${h.changePercent >= 0 ? '+' : ''}${h.changePercent?.toFixed(1) || 0}%)`)
        .join(', ');

      const data = await postChat({
        message: userMsg,
        eviScore: evi,
        portfolio: portfolioSummary,
        recentActions: `Current EVI: ${evi}. Session active. ${isLivePricing() ? 'Live NSE prices active.' : 'Using simulated prices.'}`,
      });
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      const serverError = err?.response?.data?.error;
      if (serverError) {
        setMessages(prev => [...prev, { role: 'assistant', content: `[ERROR] ${serverError}` }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: getOfflineFallback(userMsg) }]);
      }
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-terminal-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="font-mono text-lg font-bold text-terminal-green tracking-wider no-underline">
            SENTINEL<span className="text-terminal-muted text-xs ml-1">v2.1</span>
          </Link>
          <nav className="flex gap-0 border border-terminal-border">
            <Link to="/dashboard" className="btn-terminal px-3 py-1 text-xs font-medium text-terminal-dim hover:text-white hover:bg-white/5 border-r border-terminal-border no-underline">DASHBOARD</Link>
            <Link to="/behavior" className="btn-terminal px-3 py-1 text-xs font-medium text-terminal-dim hover:text-white hover:bg-white/5 border-r border-terminal-border no-underline">BEHAVIOR</Link>
            <button className="btn-terminal px-3 py-1 text-xs font-medium bg-terminal-green/10 text-terminal-green">AI COACH</button>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {/* Live EVI indicator */}
          <div className={`flex items-center gap-1.5 px-2 py-0.5 border text-[9px] font-mono uppercase tracking-wider
            ${evi > 70 ? 'border-terminal-red/30 text-terminal-red/70 animate-blink'
              : evi > 50 ? 'border-terminal-amber/30 text-terminal-amber/70'
              : 'border-terminal-green/30 text-terminal-green/70'}`}>
            EVI: {evi}
          </div>
          <div className={`w-2 h-2 ${backendOnline ? 'bg-terminal-green' : 'bg-terminal-red'} animate-blink`} />
          <span className="text-[10px] font-mono text-terminal-dim">
            {backendOnline ? 'AI CONNECTED' : 'OFFLINE MODE'}
          </span>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 grid grid-cols-[1fr_300px] divide-x divide-terminal-border" style={{ height: 'calc(100vh - 45px)' }}>
        {/* Chat Area */}
        <div className="flex flex-col">
          <div className="border-b border-terminal-border px-4 py-2 flex items-center gap-2">
            <div className={`w-2 h-2 ${backendOnline ? 'bg-terminal-green' : 'bg-terminal-amber'} animate-blink`} />
            <span className="text-[10px] uppercase tracking-[2px] text-terminal-muted">
              SENTINEL.AI — BEHAVIORAL ANALYSIS TERMINAL {!backendOnline && '(OFFLINE)'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto chat-scroll p-4 flex flex-col gap-3">
            {messages.map((msg, i) => (
              <div key={i} className={`text-xs leading-relaxed px-4 py-3 font-mono max-w-[85%] whitespace-pre-wrap
                ${msg.role === 'user'
                  ? 'bg-terminal-green/5 border border-terminal-green/20 text-terminal-green self-end'
                  : msg.content.startsWith('[OFFLINE')
                    ? 'bg-terminal-amber/5 border border-terminal-amber/20 text-terminal-dim self-start'
                    : msg.content.startsWith('[ERROR')
                      ? 'bg-terminal-red/5 border border-terminal-red/20 text-terminal-dim self-start'
                      : 'bg-terminal-surface border border-terminal-border text-terminal-dim self-start'}`}
              >
                <div className="text-[9px] text-terminal-muted mb-2 uppercase tracking-wider">
                  {msg.role === 'user' ? '> OPERATOR' : '> SENTINEL.AI'}
                </div>
                {msg.content}
              </div>
            ))}
            {loading && (
              <div className="text-xs font-mono text-terminal-green/50 px-4 py-3 bg-terminal-surface border border-terminal-border self-start">
                <div className="text-[9px] text-terminal-muted mb-2">{'>'} SENTINEL.AI</div>
                <span className="animate-blink">PROCESSING BEHAVIORAL DATA...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-terminal-border flex">
            <div className="text-terminal-green/50 text-sm font-mono px-3 py-3 flex items-center">{'>'}</div>
            <input
              className="flex-1 bg-transparent border-none px-1 py-3 text-sm font-mono text-white placeholder-terminal-muted/50 focus:outline-none"
              placeholder="Query your trading psychology..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="btn-terminal px-4 text-sm font-mono text-terminal-green hover:bg-terminal-green/10 disabled:text-terminal-muted/30 disabled:cursor-not-allowed border-l border-terminal-border"
            >
              EXEC ↵
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col divide-y divide-terminal-border overflow-hidden">
          {/* EVI Status */}
          <div className="p-4">
            <div className="text-[10px] text-terminal-muted uppercase tracking-[2px] mb-2">CURRENT EVI</div>
            <div className={`font-mono text-4xl font-bold transition-all duration-500
              ${evi > 70 ? 'text-terminal-red' : evi > 50 ? 'text-terminal-amber' : 'text-terminal-green'}`}>
              {evi}
            </div>
            <div className={`font-mono text-[10px] mt-1 animate-blink
              ${evi > 70 ? 'text-terminal-red/70' : evi > 50 ? 'text-terminal-amber/70' : 'text-terminal-green/70'}`}>
              ■ {evi > 70 ? 'CRITICAL — PANICKING' : evi > 50 ? 'ELEVATED — STRESSED' : 'NORMAL — CALM'}
            </div>
            <div className="mt-2 text-[9px] text-terminal-muted font-mono">
              REAL-TIME · BASED ON YOUR ACTIONS
            </div>
          </div>

          {/* Quick Stats */}
          <div className="p-4">
            <div className="text-[10px] text-terminal-muted uppercase tracking-[2px] mb-3">THIS SESSION</div>
            {[
              { label: 'DATA SOURCE', value: isLivePricing() ? 'LIVE NSE' : 'SIMULATED', color: isLivePricing() ? 'text-terminal-cyan' : 'text-terminal-amber' },
              { label: 'EVI STATUS', value: evi > 70 ? 'CRITICAL' : evi > 50 ? 'ELEVATED' : 'NORMAL', color: evi > 70 ? 'text-terminal-red' : evi > 50 ? 'text-terminal-amber' : 'text-terminal-green' },
              { label: 'AI ENGINE', value: backendOnline ? 'GEMINI' : 'OFFLINE', color: backendOnline ? 'text-terminal-green' : 'text-terminal-red' },
            ].map((s, i) => (
              <div key={i} className="flex justify-between items-center py-1 border-b border-terminal-border/30">
                <span className="text-[10px] text-terminal-muted font-mono">{s.label}</span>
                <span className={`font-mono font-bold text-sm ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Suggested Prompts */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="text-[10px] text-terminal-muted uppercase tracking-[2px] mb-3">QUERY TEMPLATES</div>
            <div className="flex flex-col gap-1">
              {suggestedPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  className="btn-terminal w-full text-left px-3 py-2 text-[11px] font-mono text-terminal-dim border border-terminal-border hover:border-terminal-green/30 hover:text-terminal-green hover:bg-terminal-green/5 transition-colors"
                >
                  {'>'} {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
