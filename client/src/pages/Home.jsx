import React from 'react';
import { Link } from 'react-router-dom';

const features = [
  { code: '01', title: 'EMOTIONAL VOLATILITY INDEX', desc: 'Real-time 0–100 behavioral score computed from trading patterns, market volatility, and session behavior.' },
  { code: '02', title: '4-LAYER INTERVENTION', desc: 'Progressive disclosure modal intercepting panic sells with self-check, impact analysis, history, and peer data.' },
  { code: '03', title: 'AI BEHAVIORAL COACH', desc: 'Claude-powered advisor with full portfolio context. Identifies cognitive biases and provides actionable counter-strategies.' },
  { code: '04', title: 'BEHAVIOR ANALYTICS', desc: 'Weekly emotional arc, bias radar profile, intervention success rate, and estimated savings from blocked panic trades.' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Scanline overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]"
        style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)' }} />

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Status line */}
        <div className="text-[10px] font-mono text-terminal-muted tracking-[3px] uppercase mb-6 animate-fade">
          SYSTEM STATUS: <span className="text-terminal-green">ONLINE</span> · TARGET: ZERODHA · BUILD: v2.1.0
        </div>

        {/* Logo */}
        <h1 className="font-mono text-6xl font-bold text-terminal-green tracking-[8px] mb-2" style={{ animation: 'fadeIn 0.5s ease-out' }}>
          SENTINEL
        </h1>
        <div className="w-64 h-[1px] bg-terminal-green/30 mb-6" />

        <p className="text-sm text-terminal-dim text-center max-w-lg leading-relaxed mb-10" style={{ animation: 'slideUp 0.5s ease-out 0.1s both' }}>
          Behavioral finance guardian for emotional trade interception.
          Monitors your trading psychology in real-time. Intercepts bad decisions before they execute.
        </p>

        {/* CTA */}
        <div className="flex gap-0 border border-terminal-border" style={{ animation: 'slideUp 0.5s ease-out 0.2s both' }}>
          <Link to="/onboarding" className="btn-terminal px-8 py-3 text-xs font-bold uppercase tracking-[2px] bg-terminal-green/10 text-terminal-green hover:bg-terminal-green/20 border-r border-terminal-border no-underline">
            INITIALIZE →
          </Link>
          <Link to="/dashboard" className="btn-terminal px-8 py-3 text-xs uppercase tracking-[2px] text-terminal-dim hover:text-white hover:bg-white/5 no-underline">
            DEMO MODE
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 gap-0 border border-terminal-border mt-12 max-w-2xl w-full" style={{ animation: 'slideUp 0.5s ease-out 0.35s both' }}>
          {features.map((f, i) => (
            <div key={i} className={`p-5 ${i < 2 ? 'border-b' : ''} ${i % 2 === 0 ? 'border-r' : ''} border-terminal-border hover:bg-white/[0.02] transition-colors`}>
              <div className="font-mono text-[10px] text-terminal-green/50 mb-2">[{f.code}]</div>
              <div className="text-xs font-bold uppercase tracking-wider mb-2">{f.title}</div>
              <div className="text-[11px] text-terminal-dim leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-10 text-[10px] font-mono text-terminal-muted tracking-wider">
          ₹0 COST · RUNS ALONGSIDE TRADING APP · MOCK DATA FOR DEMO
        </div>
      </div>
    </div>
  );
}
