const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

// ── Rate limiter ─────────────────────────────────────────────────
const stockRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

// ── In-memory cache (TTL: 10 seconds) ────────────────────────────
const cache = new Map();
const CACHE_TTL_MS = 10_000;

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

// ── Symbol mapping: NSE symbols → Yahoo Finance tickers ──────────
const YAHOO_SUFFIX = '.NS';

function toYahooSymbol(nseSymbol) {
  // Handle special cases
  const map = {
    'M&M': 'M%26M',         // URL-encode ampersand
    'BAJAJ-AUTO': 'BAJAJ-AUTO',
  };
  return (map[nseSymbol] || nseSymbol) + YAHOO_SUFFIX;
}

// ── Fetch quotes from Yahoo Finance ──────────────────────────────
async function fetchYahooQuotes(symbols) {
  const yahooSymbols = symbols.map(toYahooSymbol);
  
  // Use Promise.all to fetch chart data for each symbol via v8 API
  // The v7/finance/quote endpoint now returns 401 Unauthorized, so we use v8/finance/chart
  const fetchPromises = yahooSymbols.map(async (symbolStr) => {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbolStr}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeout);

      if (!response.ok) return null;
      
      const data = await response.json();
      const meta = data?.chart?.result?.[0]?.meta;
      
      if (!meta) return null;

      // Extract the original NSE symbol
      const nseSymbol = (meta.symbol || '').replace('.NS', '').replace('%26', '&');
      
      return {
        symbol: nseSymbol,
        price: meta.regularMarketPrice || 0,
        change: (meta.regularMarketPrice || 0) - (meta.chartPreviousClose || 0),
        changePercent: meta.chartPreviousClose ? (((meta.regularMarketPrice || 0) - meta.chartPreviousClose) / meta.chartPreviousClose) * 100 : 0,
        dayHigh: meta.regularMarketDayHigh || meta.regularMarketPrice || 0,
        dayLow: meta.regularMarketDayLow || meta.regularMarketPrice || 0,
        prevClose: meta.chartPreviousClose || 0,
        open: meta.regularMarketOpen || meta.regularMarketPrice || 0,
        volume: meta.regularMarketVolume || 0,
        name: nseSymbol,
        source: 'yahoo_finance_v8',
        live: true,
      };
    } catch (err) {
      clearTimeout(timeout);
      return null;
    }
  });

  const results = await Promise.all(fetchPromises);
  return results.filter(Boolean); // Remove nulls
}

// ── GET /api/stocks/quotes?symbols=RELIANCE,TCS,INFY ────────────
router.get('/quotes', stockRateLimit, async (req, res) => {
  try {
    const rawSymbols = req.query.symbols;
    if (!rawSymbols || typeof rawSymbols !== 'string') {
      return res.status(400).json({ error: 'symbols query parameter is required (comma-separated)' });
    }

    const symbols = rawSymbols
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 30); // Max 30 symbols per request

    if (symbols.length === 0) {
      return res.status(400).json({ error: 'At least one symbol is required' });
    }

    const cacheKey = symbols.sort().join(',');
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json({ quotes: cached, cached: true, source: 'yahoo_finance' });
    }

    const quotes = await fetchYahooQuotes(symbols);
    setCache(cacheKey, quotes);

    return res.json({ quotes, cached: false, source: 'yahoo_finance' });
  } catch (err) {
    console.error('Stock quotes error:', err.message);
    return res.status(502).json({
      error: 'Failed to fetch live stock quotes',
      message: err.message,
      fallback: true,
    });
  }
});

// ── GET /api/stocks/market-status ────────────────────────────────
router.get('/market-status', stockRateLimit, async (req, res) => {
  const now = new Date();
  // IST is UTC+5:30
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);
  const hours = ist.getUTCHours();
  const minutes = ist.getUTCMinutes();
  const day = ist.getUTCDay(); // 0=Sun, 6=Sat
  const timeInMinutes = hours * 60 + minutes;

  // NSE trading hours: 9:15 AM - 3:30 PM IST, Mon-Fri
  const marketOpen = 9 * 60 + 15;  // 9:15 AM
  const marketClose = 15 * 60 + 30; // 3:30 PM
  const isWeekday = day >= 1 && day <= 5;
  const isDuringHours = timeInMinutes >= marketOpen && timeInMinutes <= marketClose;
  const isOpen = isWeekday && isDuringHours;

  return res.json({
    isOpen,
    exchange: 'NSE',
    currentIST: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
    tradingHours: '09:15 - 15:30 IST',
    day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day],
  });
});

module.exports = router;
