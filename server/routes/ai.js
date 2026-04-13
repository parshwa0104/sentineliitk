const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk').default;
const OpenAI = require('openai');
const { GoogleGenAI } = require('@google/genai');
const rateLimit = require('express-rate-limit');

const chatRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return null;
  }

  return new Anthropic({ apiKey });
}

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return null;
  }

  return new OpenAI({
    apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
  });
}

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  return new GoogleGenAI({ apiKey });
}

function resolveProvider() {
  const configured = (process.env.AI_PROVIDER || '').trim().toLowerCase();
  if (configured === 'groq' || configured === 'anthropic' || configured === 'gemini') {
    return configured;
  }

  if (process.env.GEMINI_API_KEY) {
    return 'gemini';
  }

  if (process.env.GROQ_API_KEY) {
    return 'groq';
  }

  if (process.env.ANTHROPIC_API_KEY) {
    return 'anthropic';
  }

  return 'none';
}

function sanitizeText(input, maxLen = 2000) {
  if (typeof input !== 'string') {
    return '';
  }
  return input.trim().slice(0, maxLen);
}

const SYSTEM_PROMPT = `You are Sentinel AI, a behavioral finance coach embedded in a trading dashboard. 
You have access to the user's trading patterns and emotional state (EVI score).

Your personality:
- Empathetic but honest — never judgmental
- Use clear, simple language — no jargon
- Reference specific user data when possible
- Give actionable advice, not vague platitudes
- Use Indian market context (Nifty, Sensex, NSE/BSE)

Key behavioral finance concepts you use:
- Loss aversion (losses feel 2x worse than equivalent gains)
- Anchoring bias (fixating on purchase price)
- Herding (following crowd into FOMO buys)
- Disposition effect (selling winners too early, holding losers too long)
- Recency bias (overweighting recent events)

Always be supportive. Your goal is to help users make rational decisions, not stop them from trading.`;

// POST /api/ai/chat
router.post('/chat', chatRateLimit, async (req, res) => {
  try {
    const { message, eviScore, portfolio, recentActions } = req.body || {};
    const cleanMessage = sanitizeText(message, 4000);

    if (!cleanMessage) {
      return res.status(400).json({ error: 'message is required' });
    }

    const provider = resolveProvider();

    const normalizedEvi = Number.isFinite(Number(eviScore)) ? Number(eviScore) : 'N/A';

    const contextMessage = `
Current user state:
- EVI Score: ${normalizedEvi}/100
- Portfolio summary: ${sanitizeText(portfolio || 'N/A', 1500)}
- Recent actions: ${sanitizeText(recentActions || 'None', 1000)}

User message: ${cleanMessage}`;

    if (provider === 'groq') {
      const groq = getGroqClient();
      if (!groq) {
        return res.status(503).json({
          error: 'AI service not configured. Set GROQ_API_KEY in server/.env',
        });
      }

      const completion = await groq.chat.completions.create({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        temperature: 0.4,
        max_tokens: 500,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: contextMessage },
        ],
      });

      const reply = completion.choices?.[0]?.message?.content?.trim()
        || 'I need a moment to think about that.';

      return res.json({ reply, provider: 'groq' });
    }

    if (provider === 'anthropic') {
      const anthropic = getAnthropicClient();
      if (!anthropic) {
        return res.status(503).json({
          error: 'AI service not configured. Set ANTHROPIC_API_KEY in server/.env',
        });
      }

      const response = await anthropic.messages.create({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: contextMessage }],
      });

      const reply = response.content[0]?.text || 'I need a moment to think about that.';
      return res.json({ reply, provider: 'anthropic' });
    }

    if (provider === 'gemini') {
      const gemini = getGeminiClient();
      if (!gemini) {
        return res.status(503).json({
          error: 'AI service not configured. Set GEMINI_API_KEY in server/.env',
        });
      }

      let reply = '';
      let retries = 2;

      while (retries >= 0) {
        try {
          const response = await gemini.models.generateContent({
            model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
            contents: contextMessage,
            config: {
              systemInstruction: SYSTEM_PROMPT,
              temperature: 0.4,
              maxOutputTokens: 1500,
            }
          });

          reply = response.text || '';

          // Detect mid-sentence API truncation/cut-offs
          if (reply.length > 20 && !/[.!?]$/.test(reply.trim()) && retries > 0) {
            retries--;
            continue;
          }
          break; // Success
        } catch (err) {
          if (retries === 0) throw err;
          retries--;
          await new Promise(r => setTimeout(r, 1000)); // wait 1s before retry
        }
      }

      if (!reply) {
        reply = 'I am currently analyzing your patterns, but my connection is unstable. Please hold your positions and take a deep breath.';
      }

      return res.json({ reply, provider: 'gemini' });
    }

    return res.status(503).json({
      error: 'AI service not configured. Set GEMINI_API_KEY, GROQ_API_KEY or ANTHROPIC_API_KEY in server/.env',
    });
  } catch (err) {
    const detail = err?.response?.data || err?.errorDetails || err?.message || 'Unknown error';
    console.error('AI chat error:', JSON.stringify(detail).slice(0, 500));
    return res.status(502).json({ error: 'AI provider request failed' });
  }
});

module.exports = router;
