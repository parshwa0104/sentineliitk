import axios from 'axios';

// ── Centralized API Client ───────────────────────────────────────
// Single Axios instance with timeout, error handling, and offline detection.
// All frontend components should import from here instead of raw axios.

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Connection state ─────────────────────────────────────────────
let _online = true;
const listeners = new Set();

export function isBackendOnline() {
  return _online;
}

export function onConnectionChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function setOnline(status) {
  if (_online !== status) {
    _online = status;
    listeners.forEach(fn => fn(status));
  }
}

// ── Response / Error interceptors ────────────────────────────────
api.interceptors.response.use(
  (response) => {
    setOnline(true);
    return response;
  },
  (error) => {
    if (!error.response) {
      // Network error — server unreachable
      setOnline(false);
    }
    return Promise.reject(error);
  },
);

// ── Convenience wrappers ─────────────────────────────────────────
export async function postChat(payload) {
  const res = await api.post('/ai/chat', payload);
  return res.data;
}

export async function postOnboard(payload) {
  const res = await api.post('/user/onboard', payload);
  return res.data;
}

export async function getUser(userId) {
  const res = await api.get(`/user/${userId}`);
  return res.data;
}

export async function logBehaviorEvent(payload) {
  const res = await api.post('/behavior/log', payload);
  return res.data;
}

export async function getBehaviorEvents(userId) {
  const res = await api.get(`/behavior/events/${userId}`);
  return res.data;
}

export async function getServerEVI(userId) {
  const res = await api.get(`/behavior/evi/${userId}`);
  return res.data;
}

export async function checkHealth() {
  const res = await api.get('/health');
  setOnline(true);
  return res.data;
}

export default api;
