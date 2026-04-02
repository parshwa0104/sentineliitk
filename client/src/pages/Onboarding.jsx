import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postOnboard } from '../utils/api';

const questions = [
  {
    id: 'riskTolerance', text: 'RISK TOLERANCE CLASSIFICATION',
    options: [
      { value: 'conservative', label: 'CONSERVATIVE — Safety over returns' },
      { value: 'moderate', label: 'MODERATE — Balanced risk/reward' },
      { value: 'aggressive', label: 'AGGRESSIVE — High risk tolerance' },
    ],
  },
  {
    id: 'experience', text: 'TRADING EXPERIENCE LEVEL',
    options: [
      { value: 'beginner', label: 'NOVICE — Less than 1 year' },
      { value: 'intermediate', label: 'INTERMEDIATE — 1–3 years' },
      { value: 'advanced', label: 'VETERAN — 3+ years' },
    ],
  },
  {
    id: 'goalTimeline', text: 'INVESTMENT HORIZON',
    options: [
      { value: 'short', label: 'SHORT-TERM — Under 1 year' },
      { value: 'medium', label: 'MEDIUM-TERM — 1–5 years' },
      { value: 'long', label: 'LONG-TERM — 5+ years' },
    ],
  },
  {
    id: 'reactionToLoss', text: 'STRESS RESPONSE: PORTFOLIO DROPS 10% IN A DAY',
    options: [
      { value: 'panic', label: 'PANIC — Liquidate all positions immediately' },
      { value: 'worried', label: 'ANXIOUS — Consider partial exit' },
      { value: 'calm', label: 'CALM — Monitor and hold' },
      { value: 'opportunistic', label: 'OPPORTUNISTIC — Buy the dip' },
    ],
  },
  {
    id: 'tradingFrequency', text: 'PORTFOLIO MONITORING FREQUENCY',
    options: [
      { value: 'daily', label: 'OBSESSIVE — Multiple times daily' },
      { value: 'weekly', label: 'REGULAR — Few times per week' },
      { value: 'monthly', label: 'PERIODIC — Once a month' },
      { value: 'rarely', label: 'PASSIVE — Almost never' },
    ],
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [offlineNotice, setOfflineNotice] = useState(false);

  const currentQ = questions[step];
  const handleSelect = (value) => setAnswers(prev => ({ ...prev, [currentQ.id]: value }));
  const handleNext = () => { if (step < questions.length - 1) setStep(step + 1); };
  const handleBack = () => { if (step > 0) setStep(step - 1); };

  const handleSubmit = async () => {
    setLoading(true);
    setOfflineNotice(false);
    let userId = null;
    try {
      const response = await postOnboard({ name: name || 'Ram', investorProfile: answers });
      userId = response?.userId || null;
    } catch (err) {
      // Show a visible notice that we're in demo mode
      setOfflineNotice(true);
    }
    localStorage.setItem('sentinel_profile', JSON.stringify({ name: name || 'Ram', userId, ...answers }));
    setLoading(false);
    // Small delay so user sees the notice
    if (offlineNotice) {
      setTimeout(() => navigate('/dashboard'), 1500);
    } else {
      navigate('/dashboard');
    }
  };

  const isLast = step === questions.length - 1;
  const isAnswered = answers[currentQ?.id];

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="max-w-lg w-full border border-terminal-border">
        {/* Header */}
        <div className="border-b border-terminal-border px-6 py-4">
          <div className="text-[10px] font-mono text-terminal-green/50 tracking-[3px] mb-1">SENTINEL CALIBRATION</div>
          <div className="text-lg font-bold uppercase tracking-wider">Operator Profile Setup</div>
          <div className="text-xs text-terminal-dim mt-1">5 questions to calibrate behavioral detection thresholds</div>
        </div>

        {/* Progress Bar */}
        <div className="flex border-b border-terminal-border">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 ${i < step ? 'bg-terminal-green' : i === step ? 'bg-terminal-green/50' : 'bg-terminal-border'}`}
            />
          ))}
        </div>

        <div className="p-6">
          {/* Offline notice */}
          {offlineNotice && (
            <div className="mb-4 border border-terminal-amber/30 bg-terminal-amber/5 px-3 py-2 text-[11px] font-mono text-terminal-amber animate-fade">
              ⚠ SERVER OFFLINE — Launching in demo mode. Your profile is saved locally.
            </div>
          )}

          {/* Name Input on first step */}
          {step === 0 && (
            <div className="mb-6">
              <label className="text-[10px] text-terminal-muted uppercase tracking-wider block mb-2">OPERATOR DESIGNATION</label>
              <input
                type="text"
                placeholder="Enter name..."
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-black border border-terminal-border px-3 py-2 text-sm font-mono text-white placeholder-terminal-muted/50 focus:outline-none focus:border-terminal-green"
              />
            </div>
          )}

          {/* Question */}
          <div key={step}>
            <div className="flex items-center gap-2 mb-4">
              <span className="font-mono text-[10px] text-terminal-green/50">[{String(step + 1).padStart(2, '0')}/05]</span>
              <span className="text-xs font-bold uppercase tracking-wider">{currentQ.text}</span>
            </div>

            <div className="flex flex-col gap-2">
              {currentQ.options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={`btn-terminal w-full text-left px-4 py-3 text-xs border transition-colors
                    ${answers[currentQ.id] === opt.value
                      ? 'border-terminal-green bg-terminal-green/10 text-terminal-green'
                      : 'border-terminal-border text-terminal-dim hover:border-terminal-border-light hover:text-white hover:bg-white/[0.02]'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex mt-6 divide-x divide-terminal-border border border-terminal-border">
            <button
              onClick={handleBack}
              disabled={step === 0}
              className={`btn-terminal flex-1 py-2.5 text-[10px] uppercase tracking-[2px] ${step === 0 ? 'text-terminal-muted/30 cursor-not-allowed' : 'text-terminal-dim hover:text-white hover:bg-white/5'}`}
            >
              ← BACK
            </button>
            {isLast ? (
              <button
                onClick={handleSubmit}
                disabled={!isAnswered || loading}
                className={`btn-terminal flex-1 py-2.5 text-[10px] uppercase tracking-[2px] font-bold
                  ${isAnswered ? 'bg-terminal-green/10 text-terminal-green hover:bg-terminal-green/20' : 'text-terminal-muted/30 cursor-not-allowed'}`}
              >
                {loading ? 'INITIALIZING...' : 'LAUNCH DASHBOARD →'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!isAnswered}
                className={`btn-terminal flex-1 py-2.5 text-[10px] uppercase tracking-[2px]
                  ${isAnswered ? 'text-terminal-green hover:bg-terminal-green/5' : 'text-terminal-muted/30 cursor-not-allowed'}`}
              >
                NEXT →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
