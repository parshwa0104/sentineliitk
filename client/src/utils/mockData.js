// === Sentinel Mock Data — Nifty 50 + Sensex 30 ===
// Realistic Indian stock market simulation with EVI history

export const mockStocks = [
  // ── NIFTY 50 + SENSEX (Dual-listed) ───────────────────────────
  { symbol: 'RELIANCE',   name: 'Reliance Industries Ltd.',                index: ['NIFTY 50','SENSEX'], sector: 'Energy',         basePrice: 2420 },
  { symbol: 'TCS',        name: 'Tata Consultancy Services Ltd.',          index: ['NIFTY 50','SENSEX'], sector: 'IT',              basePrice: 3580 },
  { symbol: 'HDFCBANK',   name: 'HDFC Bank Ltd.',                          index: ['NIFTY 50','SENSEX'], sector: 'Banking',         basePrice: 1630 },
  { symbol: 'ICICIBANK',  name: 'ICICI Bank Ltd.',                         index: ['NIFTY 50','SENSEX'], sector: 'Banking',         basePrice: 1080 },
  { symbol: 'INFY',       name: 'Infosys Ltd.',                            index: ['NIFTY 50','SENSEX'], sector: 'IT',              basePrice: 1520 },
  { symbol: 'SBIN',       name: 'State Bank of India',                     index: ['NIFTY 50','SENSEX'], sector: 'Banking',         basePrice: 780 },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd.',                      index: ['NIFTY 50','SENSEX'], sector: 'Telecom',         basePrice: 1340 },
  { symbol: 'ITC',        name: 'ITC Ltd.',                                index: ['NIFTY 50','SENSEX'], sector: 'FMCG',            basePrice: 430 },
  { symbol: 'LT',         name: 'Larsen & Toubro Ltd.',                    index: ['NIFTY 50','SENSEX'], sector: 'Infrastructure',  basePrice: 3260 },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd.',                 index: ['NIFTY 50','SENSEX'], sector: 'FMCG',            basePrice: 2450 },
  { symbol: 'AXISBANK',   name: 'Axis Bank Ltd.',                          index: ['NIFTY 50','SENSEX'], sector: 'Banking',         basePrice: 1120 },
  { symbol: 'KOTAKBANK',  name: 'Kotak Mahindra Bank Ltd.',                index: ['NIFTY 50','SENSEX'], sector: 'Banking',         basePrice: 1880 },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd.',                      index: ['NIFTY 50','SENSEX'], sector: 'Finance',         basePrice: 6620 },
  { symbol: 'ASIANPAINT', name: 'Asian Paints Ltd.',                       index: ['NIFTY 50','SENSEX'], sector: 'Consumer',        basePrice: 2780 },
  { symbol: 'MARUTI',     name: 'Maruti Suzuki India Ltd.',                index: ['NIFTY 50','SENSEX'], sector: 'Auto',            basePrice: 10540 },
  { symbol: 'HCLTECH',    name: 'HCL Technologies Ltd.',                   index: ['NIFTY 50','SENSEX'], sector: 'IT',              basePrice: 1320 },
  { symbol: 'TITAN',      name: 'Titan Company Ltd.',                      index: ['NIFTY 50','SENSEX'], sector: 'Consumer',        basePrice: 3160 },
  { symbol: 'SUNPHARMA',  name: 'Sun Pharmaceutical Industries Ltd.',      index: ['NIFTY 50','SENSEX'], sector: 'Pharma',          basePrice: 1180 },
  { symbol: 'M&M',        name: 'Mahindra & Mahindra Ltd.',                index: ['NIFTY 50','SENSEX'], sector: 'Auto',            basePrice: 1560 },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd.',                        index: ['NIFTY 50','SENSEX'], sector: 'Auto',            basePrice: 640 },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement Ltd.',                   index: ['NIFTY 50','SENSEX'], sector: 'Cement',          basePrice: 7980 },
  { symbol: 'NTPC',       name: 'NTPC Ltd.',                               index: ['NIFTY 50','SENSEX'], sector: 'Power',           basePrice: 330 },
  { symbol: 'WIPRO',      name: 'Wipro Ltd.',                              index: ['NIFTY 50','SENSEX'], sector: 'IT',              basePrice: 420 },
  { symbol: 'NESTLEIND',  name: 'Nestle India Ltd.',                       index: ['NIFTY 50','SENSEX'], sector: 'FMCG',            basePrice: 22400 },
  { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv Ltd.',                      index: ['NIFTY 50','SENSEX'], sector: 'Finance',         basePrice: 1560 },
  { symbol: 'POWERGRID',  name: 'Power Grid Corporation of India Ltd.',    index: ['NIFTY 50','SENSEX'], sector: 'Power',           basePrice: 275 },
  { symbol: 'JSWSTEEL',   name: 'JSW Steel Ltd.',                          index: ['NIFTY 50','SENSEX'], sector: 'Metals',          basePrice: 810 },
  { symbol: 'TATASTEEL',  name: 'Tata Steel Ltd.',                         index: ['NIFTY 50','SENSEX'], sector: 'Metals',          basePrice: 126 },
  { symbol: 'INDUSINDBK', name: 'IndusInd Bank Ltd.',                      index: ['NIFTY 50','SENSEX'], sector: 'Banking',         basePrice: 1420 },
  { symbol: 'TECHM',      name: 'Tech Mahindra Ltd.',                      index: ['NIFTY 50','SENSEX'], sector: 'IT',              basePrice: 1240 },
  // ── NIFTY 50 Only ─────────────────────────────────────────────
  { symbol: 'ADANIENT',   name: 'Adani Enterprises Ltd.',                  index: ['NIFTY 50'], sector: 'Conglomerate',  basePrice: 2300 },
  { symbol: 'GRASIM',     name: 'Grasim Industries Ltd.',                  index: ['NIFTY 50'], sector: 'Cement',        basePrice: 2080 },
  { symbol: 'HINDALCO',   name: 'Hindalco Industries Ltd.',                index: ['NIFTY 50'], sector: 'Metals',        basePrice: 530 },
  { symbol: 'SBILIFE',    name: 'SBI Life Insurance Company Ltd.',         index: ['NIFTY 50'], sector: 'Insurance',     basePrice: 1380 },
  { symbol: 'DRREDDY',    name: "Dr. Reddy's Laboratories Ltd.",           index: ['NIFTY 50'], sector: 'Pharma',        basePrice: 5640 },
  { symbol: 'TATACONSUM', name: 'Tata Consumer Products Ltd.',             index: ['NIFTY 50'], sector: 'FMCG',          basePrice: 780 },
  { symbol: 'HDFCLIFE',   name: 'HDFC Life Insurance Company Ltd.',        index: ['NIFTY 50'], sector: 'Insurance',     basePrice: 620 },
  { symbol: 'EICHERMOT',  name: 'Eicher Motors Ltd.',                      index: ['NIFTY 50'], sector: 'Auto',          basePrice: 3680 },
  { symbol: 'DIVISLAB',   name: "Divi's Laboratories Ltd.",                index: ['NIFTY 50'], sector: 'Pharma',        basePrice: 3580 },
  { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals Enterprise Ltd.',        index: ['NIFTY 50'], sector: 'Healthcare',    basePrice: 5840 },
  { symbol: 'CIPLA',      name: 'Cipla Ltd.',                              index: ['NIFTY 50'], sector: 'Pharma',        basePrice: 1220 },
  { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto Ltd.',                         index: ['NIFTY 50'], sector: 'Auto',          basePrice: 5160 },
  { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp Ltd.',                      index: ['NIFTY 50'], sector: 'Auto',          basePrice: 4320 },
  { symbol: 'UPL',        name: 'UPL Ltd.',                                index: ['NIFTY 50'], sector: 'Chemicals',     basePrice: 540 },
  { symbol: 'COALINDIA',  name: 'Coal India Ltd.',                         index: ['NIFTY 50'], sector: 'Mining',        basePrice: 380 },
  { symbol: 'BPCL',       name: 'Bharat Petroleum Corporation Ltd.',       index: ['NIFTY 50'], sector: 'Energy',        basePrice: 570 },
  { symbol: 'ONGC',       name: 'Oil & Natural Gas Corporation Ltd.',      index: ['NIFTY 50'], sector: 'Energy',        basePrice: 250 },
  { symbol: 'ADANIPORTS', name: 'Adani Ports and SEZ Ltd.',                index: ['NIFTY 50'], sector: 'Infrastructure',basePrice: 880 },
  { symbol: 'BRITANNIA',  name: 'Britannia Industries Ltd.',               index: ['NIFTY 50'], sector: 'FMCG',          basePrice: 4840 },
  { symbol: 'LTIM',       name: 'LTIMindtree Ltd.',                        index: ['NIFTY 50'], sector: 'IT',            basePrice: 5120 },
];

// ── Default portfolio (user "owns" these) ────────────────────────
export const defaultPortfolio = [
  { symbol: 'RELIANCE',  qty: 12,  avgBuy: 2380 },
  { symbol: 'TCS',       qty: 5,   avgBuy: 3640 },
  { symbol: 'HDFCBANK',  qty: 20,  avgBuy: 1590 },
  { symbol: 'INFY',      qty: 15,  avgBuy: 1480 },
  { symbol: 'ICICIBANK', qty: 25,  avgBuy: 1050 },
  { symbol: 'ITC',       qty: 50,  avgBuy: 445 },
  { symbol: 'SBIN',      qty: 30,  avgBuy: 810 },
  { symbol: 'BHARTIARTL',qty: 10,  avgBuy: 1290 },
  { symbol: 'TATAMOTORS',qty: 40,  avgBuy: 680 },
  { symbol: 'BAJFINANCE',qty: 3,   avgBuy: 6740 },
  { symbol: 'SUNPHARMA', qty: 18,  avgBuy: 1150 },
  { symbol: 'WIPRO',     qty: 30,  avgBuy: 440 },
  { symbol: 'TITAN',     qty: 8,   avgBuy: 3220 },
  { symbol: 'MARUTI',    qty: 2,   avgBuy: 10320 },
  { symbol: 'LT',        qty: 6,   avgBuy: 3190 },
];

// ── Live price simulator ─────────────────────────────────────────
const livePrices = {};

export function initializePrices() {
  mockStocks.forEach(s => {
    livePrices[s.symbol] = {
      price: s.basePrice,
      prevClose: s.basePrice,
      dayHigh: s.basePrice,
      dayLow: s.basePrice,
    };
  });
}

export function tickPrices() {
  mockStocks.forEach(s => {
    const prev = livePrices[s.symbol] || { price: s.basePrice, prevClose: s.basePrice, dayHigh: s.basePrice, dayLow: s.basePrice };
    const volatility = 0.003 + Math.random() * 0.007; // 0.3%–1%
    const direction = Math.random() > 0.48 ? 1 : -1;   // slight upward bias
    const change = prev.price * volatility * direction;
    const newPrice = Math.max(prev.price + change, 1);
    livePrices[s.symbol] = {
      price: newPrice,
      prevClose: prev.prevClose,
      dayHigh: Math.max(prev.dayHigh, newPrice),
      dayLow: Math.min(prev.dayLow, newPrice),
    };
  });
}

export function getPrice(symbol) {
  const data = livePrices[symbol];
  if (!data) return { price: 0, change: 0, changePercent: 0, dayHigh: 0, dayLow: 0 };
  const change = data.price - data.prevClose;
  const changePercent = (change / data.prevClose) * 100;
  return {
    price: data.price,
    change,
    changePercent,
    dayHigh: data.dayHigh,
    dayLow: data.dayLow,
  };
}

export function getAllPrices() {
  return mockStocks.map(s => ({
    ...s,
    ...getPrice(s.symbol),
  }));
}

// ── Live price injection ─────────────────────────────────────────
// Called by Dashboard when real Yahoo Finance quotes arrive
let _isLive = false;

export function setLivePrices(quotes) {
  if (!Array.isArray(quotes) || quotes.length === 0) return;
  _isLive = true;
  quotes.forEach(q => {
    if (!q.symbol || !q.price) return;
    const existing = livePrices[q.symbol];
    livePrices[q.symbol] = {
      price: q.price,
      prevClose: q.prevClose || existing?.prevClose || q.price,
      dayHigh: q.dayHigh || existing?.dayHigh || q.price,
      dayLow: q.dayLow || existing?.dayLow || q.price,
      open: q.open || existing?.open || q.price,
      volume: q.volume || 0,
    };
  });
}

export function isLivePricing() {
  return _isLive;
}

export function resetToMock() {
  _isLive = false;
  initializePrices();
}

// ── EVI history (past 7 days) ────────────────────────────────────
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const eviHistory = days.map((day, i) => ({
  day,
  evi: [32, 41, 58, 73, 65, 48, 55][i],
  trades: [3, 5, 8, 12, 7, 2, 4][i],
  panicSells: [0, 0, 2, 5, 1, 0, 1][i],
}));

// ── Recovery stories for Intervention Modal ──────────────────────
export const recoveryStories = {
  RELIANCE:   { stock: 'Reliance',     drop: '18%', recovery: '6 weeks',  context: 'Reliance dropped 18% during the 2020 crash but recovered within 6 weeks and went on to rally 120% in the next year.' },
  TCS:        { stock: 'TCS',          drop: '15%', recovery: '5 weeks',  context: 'TCS fell 15% during a global tech sell-off but recovered in 5 weeks as earnings beat expectations.' },
  INFY:       { stock: 'Infosys',      drop: '22%', recovery: '8 weeks',  context: 'Infosys dropped 22% on whistleblower concerns but recovered in 8 weeks when investigation cleared management.' },
  HDFCBANK:   { stock: 'HDFC Bank',    drop: '12%', recovery: '4 weeks',  context: 'HDFC Bank fell 12% on RBI restrictions but bounced back in 4 weeks once the ban was lifted.' },
  TATAMOTORS: { stock: 'Tata Motors',  drop: '35%', recovery: '10 weeks', context: 'Tata Motors crashed 35% during EV concerns but recovered in 10 weeks on strong JLR and Nexon EV numbers.' },
  SBIN:       { stock: 'SBI',          drop: '20%', recovery: '7 weeks',  context: 'SBI fell 20% on NPA fears but recovered in 7 weeks as quarterly results showed improving asset quality.' },
  ITC:        { stock: 'ITC',          drop: '14%', recovery: '6 weeks',  context: 'ITC dropped 14% on sin tax concerns but recovered in 6 weeks as FMCG segment showed strong growth.' },
  DEFAULT:    { stock: 'this stock',   drop: '15%', recovery: '5 weeks',  context: 'Historical data shows that 73% of Nifty 50 stocks recover from 10%+ dips within 8 weeks.' },
};