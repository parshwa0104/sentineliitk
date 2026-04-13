import React, { useState, useRef, useEffect } from 'react';
import { postChat } from '../utils/api';

export default function AIChat({ evi, portfolio }) {
  const currentEvi = evi || 30;
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `SENTINEL AI ONLINE. Portfolio state loaded. EVI: ${currentEvi}. Ready for behavioral analysis. Query me on your trading patterns, emotional biases, or market strategy.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };
  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const portfolioSummary = (portfolio || [])
        .slice(0, 5)
        .map(h => `${h.symbol}: ₹${h.price?.toFixed(0) || 0} (${h.pnlPercent >= 0 ? '+' : ''}${h.pnlPercent?.toFixed(1) || 0}%)`)
        .join(', ');
      const data = await postChat({
        message: userMsg, eviScore: evi, portfolio: portfolioSummary, recentActions: 'Viewing dashboard',
      });
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      const errorMessage = err?.response?.data?.error
        || 'AI service is currently unavailable. Please check backend API key configuration.';
      setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto chat-scroll p-3 flex flex-col gap-2">
        {messages.map((msg, i) => (
          <div key={i} className={`text-xs leading-relaxed px-3 py-2 max-w-[95%] font-mono
            ${msg.role === 'user'
              ? 'bg-terminal-green/5 border border-terminal-green/20 text-terminal-green self-end'
              : 'bg-terminal-surface border border-terminal-border text-terminal-dim self-start'}`}
          >
            <span className="text-[9px] text-terminal-muted block mb-1">
              {msg.role === 'user' ? '> OPERATOR' : '> SENTINEL.AI'}
            </span>
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="text-xs font-mono text-terminal-green/50 px-3 py-2 bg-terminal-surface border border-terminal-border self-start">
            <span className="text-[9px] text-terminal-muted block mb-1">{'>'} SENTINEL.AI</span>
            <span className="animate-blink">PROCESSING...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-terminal-border flex">
        <div className="text-terminal-green/50 text-xs font-mono px-2 py-2 flex items-center">{'>'}</div>
        <input
          className="flex-1 bg-transparent border-none px-1 py-2 text-xs font-mono text-white placeholder-terminal-muted/50 focus:outline-none"
          placeholder="Query..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="btn-terminal px-3 text-xs font-mono text-terminal-green hover:bg-terminal-green/10 disabled:text-terminal-muted/30 disabled:cursor-not-allowed border-l border-terminal-border"
        >
          ↵
        </button>
      </div>
    </div>
  );
}
