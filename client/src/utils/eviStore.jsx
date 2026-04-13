// ═══════════════════════════════════════════════════════════════════
// EVI Store — Centralized, Event-Driven Emotional Volatility Index
// ═══════════════════════════════════════════════════════════════════
// Provides a React Context that tracks user behavior in real-time
// and computes a live EVI score. All components share the same state.

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';

// ── Action types ─────────────────────────────────────────────────
const EVI_ACTIONS = {
  SET_SCORE: 'SET_SCORE',
  RECORD_EVENT: 'RECORD_EVENT',
  PUSH_HISTORY: 'PUSH_HISTORY',
  SET_MARKET_DATA: 'SET_MARKET_DATA',
  SET_SESSION_START: 'SET_SESSION_START',
};

// ── Event types and their immediate EVI impact ───────────────────
const EVENT_WEIGHTS = {
  sell_click:           +8,   // Clicked SELL on a stock
  sell_attempt:         +10,  // Tried to sell during high EVI (intervention shown)
  sell_confirmed:       +12,  // Proceeded past the intervention modal
  sell_cancelled:       -5,   // Held position after seeing intervention
  rapid_portfolio_view: +3,   // Checking portfolio in quick succession
  rapid_stock_switch:   +2,   // Switching between stocks rapidly
  sell_hover:           +1,   // Hovering over sell button
  ai_chat_opened:       -3,   // Consulted the AI coach
  ai_chat_query:        -2,   // Sent a message to AI
  buy_click:            +3,   // FOMO buy during volatile market
  page_switch:          +1,   // Switching between pages rapidly
};

// ── Initial state ────────────────────────────────────────────────
const initialState = {
  score: 30,                 // Current EVI score (0-100)
  events: [],                // Recent behavior events (last 10 min)
  history: [],               // EVI timeline for charts
  marketData: {              // Live market volatility data
    avgChangePercent: 0,
    losersCount: 0,
    gainersCount: 0,
    portfolioLossPercent: 0,
  },
  sessionStart: Date.now(),  // When the user started the session
};

// ── Reducer ──────────────────────────────────────────────────────
function eviReducer(state, action) {
  switch (action.type) {
    case EVI_ACTIONS.SET_SCORE:
      return { ...state, score: Math.round(Math.min(Math.max(action.payload, 0), 100)) };

    case EVI_ACTIONS.RECORD_EVENT: {
      const event = {
        ...action.payload,
        timestamp: Date.now(),
      };
      // Keep only events from last 10 minutes
      const tenMinAgo = Date.now() - 10 * 60 * 1000;
      const filtered = [...state.events, event].filter(e => e.timestamp > tenMinAgo);
      return { ...state, events: filtered };
    }

    case EVI_ACTIONS.PUSH_HISTORY: {
      const entry = {
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        evi: state.score,
        timestamp: Date.now(),
      };
      // Keep last 100 data points
      const newHistory = [...state.history, entry].slice(-100);
      return { ...state, history: newHistory };
    }

    case EVI_ACTIONS.SET_MARKET_DATA:
      return { ...state, marketData: { ...state.marketData, ...action.payload } };

    case EVI_ACTIONS.SET_SESSION_START:
      return { ...state, sessionStart: action.payload };

    default:
      return state;
  }
}

// ── Compute EVI from current state ───────────────────────────────
function computeEVIFromState(state) {
  let evi = 25; // Baseline: mild awareness

  // 1. Portfolio stress (max +25)
  const lossPercent = state.marketData.portfolioLossPercent || 0;
  if (lossPercent < 0) {
    evi += Math.min(Math.abs(lossPercent) * 5, 25);
  }

  // 2. Market volatility — based on how many stocks are losing (max +15)
  const { losersCount, gainersCount, avgChangePercent } = state.marketData;
  const totalStocks = losersCount + gainersCount;
  if (totalStocks > 0) {
    const loserRatio = losersCount / totalStocks;
    evi += Math.min(loserRatio * 15, 15);
  }
  // Amplify if market is moving sharply negative
  if (avgChangePercent < -1) {
    evi += Math.min(Math.abs(avgChangePercent) * 3, 10);
  }

  // 3. Recent event impacts (max +35)
  const fiveMinAgo = Date.now() - 5 * 60 * 1000;
  const recentEvents = state.events.filter(e => e.timestamp > fiveMinAgo);
  let eventImpact = 0;
  recentEvents.forEach(e => {
    const weight = EVENT_WEIGHTS[e.type] || 0;
    // Decay: more recent events have higher weight
    const age = (Date.now() - e.timestamp) / 1000; // seconds
    const decayFactor = Math.max(0.2, 1 - age / 300); // decay over 5 min
    eventImpact += weight * decayFactor;
  });
  evi += Math.min(Math.max(eventImpact, -10), 35);

  // 4. Rapid-fire actions in last 60 seconds (panic clicking) (max +15)
  const oneMinAgo = Date.now() - 60 * 1000;
  const rapidActions = state.events.filter(e => e.timestamp > oneMinAgo).length;
  if (rapidActions > 3) {
    evi += Math.min((rapidActions - 3) * 3, 15);
  }

  // 5. Session fatigue (max +10)
  const sessionMinutes = (Date.now() - state.sessionStart) / 60000;
  if (sessionMinutes > 30) {
    evi += Math.min((sessionMinutes - 30) / 6, 10);
  }

  return Math.round(Math.min(Math.max(evi, 0), 100));
}

// ── Context ──────────────────────────────────────────────────────
const EVIContext = createContext(null);

export function EVIProvider({ children }) {
  const [state, dispatch] = useReducer(eviReducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Recalculate EVI every 2 seconds using exponential smoothing
  useEffect(() => {
    const interval = setInterval(() => {
      const computed = computeEVIFromState(stateRef.current);
      const current = stateRef.current.score;
      // Exponential smoothing: fast rise (0.4), slow fall (0.15)
      const alpha = computed > current ? 0.4 : 0.15;
      const smoothed = Math.round(current + alpha * (computed - current));
      dispatch({ type: EVI_ACTIONS.SET_SCORE, payload: smoothed });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Push EVI history every 30 seconds for the behavior chart
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: EVI_ACTIONS.PUSH_HISTORY });
    }, 30000);
    // Push initial point
    dispatch({ type: EVI_ACTIONS.PUSH_HISTORY });
    return () => clearInterval(interval);
  }, []);

  // ── Public API ───────────────────────────────────────────────
  const recordEvent = useCallback((eventType, metadata = {}) => {
    dispatch({
      type: EVI_ACTIONS.RECORD_EVENT,
      payload: { type: eventType, ...metadata },
    });
  }, []);

  const updateMarketData = useCallback((data) => {
    dispatch({ type: EVI_ACTIONS.SET_MARKET_DATA, payload: data });
  }, []);

  const setScore = useCallback((score) => {
    dispatch({ type: EVI_ACTIONS.SET_SCORE, payload: score });
  }, []);

  const value = {
    score: state.score,
    events: state.events,
    history: state.history,
    marketData: state.marketData,
    sessionStart: state.sessionStart,
    recordEvent,
    updateMarketData,
    setScore,
  };

  return (
    <EVIContext.Provider value={value}>
      {children}
    </EVIContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────
export function useEVI() {
  const ctx = useContext(EVIContext);
  if (!ctx) {
    throw new Error('useEVI must be used within an EVIProvider');
  }
  return ctx;
}

export { EVENT_WEIGHTS, computeEVIFromState };
export default EVIContext;
