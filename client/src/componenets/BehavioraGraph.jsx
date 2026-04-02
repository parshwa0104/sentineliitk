import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-black border border-terminal-border p-2 text-xs font-mono">
        <div className="text-white font-bold">{label}</div>
        <div style={{ color: payload[0].color }}>EVI: {data.evi}</div>
        {data.trades !== undefined && <div className="text-terminal-dim">TRADES: {data.trades}</div>}
        {data.panicSells !== undefined && <div className="text-terminal-red">PANIC: {data.panicSells}</div>}
      </div>
    );
  }
  return null;
};

export default function BehaviorGraph({ data }) {
  return (
    <div className="p-3 h-full flex flex-col">
      <div className="text-[10px] uppercase tracking-[2px] text-terminal-muted mb-3">WEEKLY EVI ARC</div>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="eviGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00ff41" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#00ff41" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 4" stroke="#1a1a1a" />
            <XAxis dataKey="day" stroke="#555" fontSize={10} tickLine={false} axisLine={false} fontFamily="monospace" />
            <YAxis domain={[0, 100]} stroke="#555" fontSize={10} tickLine={false} axisLine={false} fontFamily="monospace" />
            <ReferenceLine y={60} stroke="#ff0033" strokeDasharray="4 4" label={{ value: "THRESHOLD", fill: "#ff0033", fontSize: 9, fontFamily: "monospace" }} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="evi" stroke="#00ff41" strokeWidth={2} fill="url(#eviGrad)"
              dot={{ r: 3, fill: '#00ff41', stroke: '#000', strokeWidth: 1 }}
              activeDot={{ r: 5, fill: '#00ff41' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
