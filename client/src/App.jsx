import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { EVIProvider } from './utils/eviStore';
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import Dashboard from './componenets/Dashboard';
import AIChatPage from './pages/AIChatPage';
import BehaviorPage from './pages/BehaviorPage';

function App() {
  return (
    <EVIProvider>
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/ai-chat" element={<AIChatPage />} />
          <Route path="/behavior" element={<BehaviorPage />} />
        </Routes>
      </div>
    </EVIProvider>
  );
}

export default App;
