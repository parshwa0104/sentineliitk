import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, BarChart, Bar, Legend, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { eviHistory } from '../utils/mockData';
import { getBehaviorEvents, isBackendOnline, onConnectionChange } from '../utils/api';

// Hardcoded fallback data for demo mode
const fallbackHourlyData = [
  { time: '9:15', evi: 35, action: 'Market Open' },
  { time: '9:30', evi: 38, action: '' },
  { time: '10:00', evi: 42, action: 'Portfolio check' },
  { time: '10:30', evi: 48, action: 'NIFTY -1.2%' },
  { time: '11:00', evi: 56, action: 'SOLD WIPRO' },
  { time: '11:30', evi: 61, action: 'INTERVENTION' },
  { time: '12:00', evi: 65, action: 'SELL ATTEMPT' },
  { time: '12:30', evi: 73, action: 'BLOCKED' },
  { time: '13:00', evi: 68, action: 'Break' },
  { time: '13:30', evi: 58, action: '' },
  { time: '14:00', evi: 52, action: 'Recovery' },
  { time: '14:30', evi: 47, action: '' },
  { time: '15:00', evi: 44, action: '' },
  { time: '15:30', evi: 41, action: 'Market Close' },
];

const fallbackBiasData = [
  { bias: 'Loss Aversion', score: 82 },
  { bias: 'Recency', score: 68 },
  { bias: 'Herding', score: 45 },
  { bias: 'Anchoring', score: 71 },
  { bias: 'FOMO', score: 54 },
  { bias: 'Disposition', score: 63 },
];

const fallbackWeeklyActions = [
  { day: 'Mon', holds: 3, sells: 0, blocked: 0 },
  { day: 'Tue', holds: 4, sells: 1, blocked: 0 },
  { day: 'Wed', holds: 2, sells: 2, blocked: 1 },
  { day: 'Thu', holds: 1, sells: 5, blocked: 3 },
  { day: 'Fri', holds: 3, sells: 1, blocked: 1 },
  { day: 'Sat', holds: 2, sells: 0, blocked: 0 },
  { day: 'Sun', holds: 1, sells: 0, blocked: 0 },
];

// Compute stats from live behavior events
function computeStatsFromEvents(events) {
  const panicSells = events.filter(e => e.type === 'sell_confirmed' || e.type === 'panic_sell').length;
  const interventions = events.filter(e => e.interventionShown).length;
  const held = events.filter(e => e.type === 'sell_cancelled').length;

  // Compute average EVI from events that have eviAtTime
  const eviEvents = events.filter(e => e.eviAtTime != null);
  const avgEvi = eviEvents.length > 0
    ? Math.round(eviEvents.reduce((s, e) => s + e.eviAtTime, 0) / eviEvents.length)
    : 53;
  const peakEvi = eviEvents.length > 0
    ? Math.max(...eviEvents.map(e => e.eviAtTime))
    : 73;

  // Estimate savings (~₹1,400 per blocked trade on average)
  const saved = held * 1400;

  // Build weekly actions from events
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyMap = {};
  dayNames.forEach(d => { weeklyMap[d] = { day: d, holds: 0, sells: 0, blocked: 0 }; });
  events.forEach(e => {
    const day = dayNames[new Date(e.timestamp).getDay()];
    if (e.type === 'sell_cancelled') weeklyMap[day].holds++;
    if (e.type === 'sell_confirmed' || e.type === 'panic_sell') weeklyMap[day].sells++;
    if (e.interventionShown && e.interventionResult === 'cancelled') weeklyMap[day].blocked++;
  });
  const weeklyActions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => weeklyMap[d]);

  return {
    panicSells, interventions, held, avgEvi, peakEvi, saved, weeklyActions,
  };
}

const TermTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-black border border-terminal-border p-2 text-xs font-mono">
        <div className="text-white font-bold">{label}</div>
        <div style={{ color: payload[0].color }}>EVI: {data.evi}</div>
        {data.trades !== undefined && <div className="text-terminal-dim">TRADES: {data.trades}</div>}
        {data.panicSells !== undefined && <div className="text-terminal-red">PANIC: {data.panicSells}</div>}
        {data.action && <div className="text-terminal-amber mt-1">{data.action}</div>}
      </div>
    );
  }
  return null;
};

export default function BehaviorPage() {
  const profile = JSON.parse(localStorage.getItem('sentinel_profile') || '{}');
  const [backendOnline, setBackendOnline] = useState(isBackendOnline());
  const [stats, setStats] = useState(null);
  const [weeklyActions, setWeeklyActions] = useState(fallbackWeeklyActions);
  const [dataSource, setDataSource] = useState('mock'); // 'mock' | 'live'

  useEffect(() => {
    const unsub = onConnectionChange(setBackendOnline);
    return unsub;
  }, []);

  // Fetch real events when backend is online and user is logged in
  useEffect(() => {
    if (!profile?.userId || !backendOnline) {
      setDataSource('mock');
      return;
    }
    getBehaviorEvents(profile.userId)
      .then(events => {
        if (events && events.length > 0) {
          const computed = computeStatsFromEvents(events);
          setStats(computed);
          setWeeklyActions(computed.weeklyActions);
          setDataSource('live');
        } else {
          setDataSource('mock');
        }
      })
      .catch(() => setDataSource('mock'));
  }, [profile?.userId, backendOnline]);

  const summary = stats || {
    avgEvi: 53, peakEvi: 73, panicSells: 9, interventions: 8, saved: 12400,
  };

  const biasData = fallbackBiasData; // bias detection requires more data — always use baseline for now

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-terminal-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="font-mono text-lg font-bold text-terminal-green tracking-wider no-underline">
            SENTINEL<span className="text-terminal-muted text-xs ml-1">v2.1</span>
          </Link>
          <nav className="flex gap-0 border border-terminal-border">
            <Link to="/dashboard" className="btn-terminal px-3 py-1 text-xs font-medium text-terminal-dim hover:text-white hover:bg-white/5 border-r border-terminal-border no-underline">DASHBOARD</Link>
            <button className="btn-terminal px-3 py-1 text-xs font-medium bg-terminal-green/10 text-terminal-green border-r border-terminal-border">BEHAVIOR</button>
            <Link to="/ai-chat" className="btn-terminal px-3 py-1 text-xs font-medium text-terminal-dim hover:text-white hover:bg-white/5 no-underline">AI COACH</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[9px] font-mono px-2 py-0.5 border uppercase tracking-wider
            ${dataSource === 'live'
              ? 'border-terminal-green/30 text-terminal-green/70'
              : 'border-terminal-amber/30 text-terminal-amber/70'}`}>
            {dataSource === 'live' ? '● LIVE DATA' : '● DEMO DATA'}
          </span>
        </div>
      </header>

      {/* Summary Strip */}
      <div className="border-b border-terminal-border grid grid-cols-5 divide-x divide-terminal-border">
        {[
          { label: 'AVG EVI', value: String(summary.avgEvi), color: 'text-terminal-amber' },
          { label: 'PEAK EVI', value: String(summary.peakEvi), color: 'text-terminal-red' },
          { label: 'PANIC SELLS', value: String(summary.panicSells), color: 'text-terminal-red' },
          { label: 'INTERVENTIONS', value: String(summary.interventions), color: 'text-white' },
          { label: 'SAVED', value: `₹${summary.saved.toLocaleString('en-IN')}`, color: 'text-terminal-green' },
        ].map((s, i) => (
          <div key={i} className="px-4 py-2">
            <div className="text-[9px] text-terminal-muted uppercase tracking-[1.5px]">{s.label}</div>
            <div className={`font-mono text-lg font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="p-4">
        {/* Charts Grid */}
        <div className="grid grid-cols-2 gap-0 divide-x divide-terminal-border border border-terminal-border mb-4">
          {/* Weekly EVI Arc */}
          <div className="p-4">
            <div className="text-[10px] uppercase tracking-[2px] text-terminal-muted mb-3">EMOTIONAL ARC — MON → FRI</div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={eviHistory} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="eviGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ff41" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#00ff41" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="#1a1a1a" />
                <XAxis dataKey="day" stroke="#555" fontSize={10} tickLine={false} axisLine={false} fontFamily="monospace" />
                <YAxis domain={[0, 100]} stroke="#555" fontSize={10} tickLine={false} axisLine={false} fontFamily="monospace" />
                <ReferenceLine y={60} stroke="#ff0033" strokeDasharray="4 4" label={{ value: "THRESHOLD", fill: "#ff0033", fontSize: 9, fontFamily: "monospace" }} />
                <Tooltip content={<TermTooltip />} />
                <Area type="monotone" dataKey="evi" stroke="#00ff41" strokeWidth={2} fill="url(#eviGrad2)"
                  dot={{ r: 4, fill: '#00ff41', stroke: '#000', strokeWidth: 1 }}
                  activeDot={{ r: 6, fill: '#00ff41' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Intraday */}
          <div className="p-4">
            <div className="text-[10px] uppercase tracking-[2px] text-terminal-muted mb-3">INTRADAY EVI — THURSDAY</div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={fallbackHourlyData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="intGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff0033" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ff0033" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="#1a1a1a" />
                <XAxis dataKey="time" stroke="#555" fontSize={9} tickLine={false} axisLine={false} fontFamily="monospace" />
                <YAxis domain={[0, 100]} stroke="#555" fontSize={10} tickLine={false} axisLine={false} fontFamily="monospace" />
                <ReferenceLine y={60} stroke="#ff0033" strokeDasharray="4 4" />
                <Tooltip content={<TermTooltip />} />
                <Area type="monotone" dataKey="evi" stroke="#ff0033" strokeWidth={2} fill="url(#intGrad)"
                  dot={{ r: 3, fill: '#ff0033', stroke: '#000', strokeWidth: 1 }}
                  activeDot={{ r: 5, fill: '#ff0033' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-0 divide-x divide-terminal-border border border-terminal-border mb-4">
          {/* Weekly Actions */}
          <div className="p-4">
            <div className="text-[10px] uppercase tracking-[2px] text-terminal-muted mb-3">TRADE ACTIONS — WEEKLY</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={weeklyActions} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#1a1a1a" />
                <XAxis dataKey="day" stroke="#555" fontSize={10} tickLine={false} axisLine={false} fontFamily="monospace" />
                <YAxis stroke="#555" fontSize={10} tickLine={false} axisLine={false} fontFamily="monospace" />
                <Tooltip contentStyle={{ background: '#000', border: '1px solid #1a1a1a', borderRadius: 0, fontSize: '11px', fontFamily: 'monospace' }} />
                <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
                <Bar dataKey="holds" name="HELD" fill="#00ff41" radius={0} />
                <Bar dataKey="sells" name="SOLD" fill="#ff0033" radius={0} />
                <Bar dataKey="blocked" name="BLOCKED" fill="#ffaa00" radius={0} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Bias Radar */}
          <div className="p-4">
            <div className="text-[10px] uppercase tracking-[2px] text-terminal-muted mb-3">COGNITIVE BIAS PROFILE</div>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={biasData}>
                <PolarGrid stroke="#1a1a1a" />
                <PolarAngleAxis dataKey="bias" tick={{ fill: '#555', fontSize: 9, fontFamily: 'monospace' }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Score" dataKey="score" stroke="#00ff41" fill="#00ff41" fillOpacity={0.1} strokeWidth={1} />
              </RadarChart>
            </ResponsiveContainer>
            <div className="text-center text-[10px] font-mono text-terminal-muted mt-2">
              DOMINANT: <span className="text-terminal-red font-bold">LOSS AVERSION (82)</span>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="grid grid-cols-3 gap-0 divide-x divide-terminal-border border border-terminal-border">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-[9px] px-1 py-0.5 bg-terminal-red/10 text-terminal-red border border-terminal-red/30">ALERT</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">THURSDAY SPIKE</span>
            </div>
            <div className="text-[11px] text-terminal-dim leading-relaxed font-mono">
              EVI hit {summary.peakEvi} — NIFTY dipped 2.3%. {summary.panicSells} panic sell attempts. {summary.interventions > 0 ? `${summary.interventions} interventions triggered.` : ''} Est. savings: ₹{summary.saved.toLocaleString('en-IN')}.
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-[9px] px-1 py-0.5 bg-terminal-green/10 text-terminal-green border border-terminal-green/30">PROOF</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">RECOVERY DATA</span>
            </div>
            <div className="text-[11px] text-terminal-dim leading-relaxed font-mono">
              4/5 panic-sold stocks recovered. INFY: +3.2% post-sell. Holding was optimal in 80% of cases.
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-[9px] px-1 py-0.5 bg-terminal-amber/10 text-terminal-amber border border-terminal-amber/30">ACTION</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">RECOMMENDATION</span>
            </div>
            <div className="text-[11px] text-terminal-dim leading-relaxed font-mono">
              Enable 24h cooling period when EVI {'>'} 60. Auto-hold all sell orders for next-day review.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
