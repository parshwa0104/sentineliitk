import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import Dashboard from './componenets/Dashboard';
import AIChatPage from './pages/AIChatPage';
import BehaviorPage from './pages/BehaviorPage';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/ai-chat" element={<AIChatPage />} />
        <Route path="/behavior" element={<BehaviorPage />} />
      </Routes>
    </div>
  );
}

export default App;
