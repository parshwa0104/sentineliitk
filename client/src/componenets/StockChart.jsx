import React, { useRef, useEffect, useState } from 'react';
import { createChart, ColorType, LineSeries } from 'lightweight-charts';

export default function StockChart({ stocks, tick }) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const [selectedSymbol, setSelectedSymbol] = useState(stocks?.[0]?.symbol || 'RELIANCE');
  const priceHistoryRef = useRef({});

  useEffect(() => {
    if (!chartContainerRef.current) return;
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#000000' },
        textColor: '#555555',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 10,
      },
      grid: {
        vertLines: { color: '#111' },
        horzLines: { color: '#111' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 280,
      timeScale: { timeVisible: true, secondsVisible: true, borderColor: '#1a1a1a' },
      rightPriceScale: { borderColor: '#1a1a1a' },
      crosshair: {
        vertLine: { color: '#333', style: 2 },
        horzLine: { color: '#333', style: 2 },
      },
    });
    const series = chart.addSeries(LineSeries, {
      color: '#00ff41',
      lineWidth: 1,
      crosshairMarkerBackgroundColor: '#00ff41',
      lastValueVisible: true,
      priceLineVisible: true,
      priceLineColor: '#00ff41',
    });
    chartRef.current = chart;
    seriesRef.current = series;
    const handleResize = () => {
      if (chartContainerRef.current) chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    };
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); chart.remove(); };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || !stocks.length) return;
    const stock = stocks.find(s => s.symbol === selectedSymbol);
    if (!stock) return;
    const now = Math.floor(Date.now() / 1000);
    if (!priceHistoryRef.current[selectedSymbol]) priceHistoryRef.current[selectedSymbol] = [];
    const history = priceHistoryRef.current[selectedSymbol];
    history.push({ time: now, value: stock.price });
    if (history.length > 200) history.shift();
    seriesRef.current.setData(history);
  }, [tick, selectedSymbol, stocks]);

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b border-terminal-border flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[2px] text-terminal-muted">LIVE PRICE FEED</span>
        <select
          value={selectedSymbol}
          onChange={e => { setSelectedSymbol(e.target.value); priceHistoryRef.current[e.target.value] = []; }}
          className="bg-black border border-terminal-border px-2 py-0.5 text-xs font-mono text-terminal-green focus:outline-none focus:border-terminal-green"
        >
          {stocks.map(s => <option key={s.symbol} value={s.symbol}>{s.symbol}</option>)}
        </select>
      </div>
      <div className="flex-1" ref={chartContainerRef} />
    </div>
  );
}
