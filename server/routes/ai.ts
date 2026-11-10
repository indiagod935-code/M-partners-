import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';

const router = Router();

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function parseItemsLocally(prompt: string) {
  const tokens = prompt
    .split(/[\n,;+]+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const items = tokens.map((line, idx) => {
    let category = 'Grocery';
    let estPrice = 50;
    let store = 'Local General Store';
    const lower = line.toLowerCase();

    if (lower.includes('milk') || lower.includes('paneer') || lower.includes('curd') || lower.includes('cheese') || lower.includes('butter')) {
      category = 'Dairy';
      estPrice = lower.includes('paneer') ? 110 : 35;
      store = 'Dairy / Mother Dairy';
    } else if (lower.includes('egg') || lower.includes('bread') || lower.includes('tea') || lower.includes('coffee') || lower.includes('biscuit')) {
      category = 'Bakery & Breakfast';
      estPrice = lower.includes('egg') ? 60 : 45;
      store = 'Bakery / Kirana Store';
    } else if (lower.includes('potato') || lower.includes('onion') || lower.includes('tomato') || lower.includes('vegetable') || lower.includes('apple') || lower.includes('banana')) {
      category = 'Fresh Produce';
      estPrice = 40;
      store = 'Local Vegetable Vendor';
    } else if (lower.includes('medicine') || lower.includes('tablet') || lower.includes('syrup') || lower.includes('dettol') || lower.includes('band')) {
      category = 'Pharmacy';
      estPrice = 90;
      store = 'Neighborhood Pharmacy / Chemist';
    }

    return {
      id: `item_${idx + 1}`,
      name: line,
      quantity: '1 pack',
      category,
      estimatedPriceInr: estPrice,
      storeType: store,
    };
  });

  const total = items.reduce((sum, it) => sum + it.estimatedPriceInr, 0);
  const stores = Array.from(new Set(items.map((i) => i.storeType)));

  return {
    summary: `Structured ${items.length} shopping items`,
    items,
    totalEstimatedPrice: total,
    suggestedStores: stores.length > 0 ? stores : ['Local Neighborhood Market'],
    runnerInstructions: 'Verify freshness and check store invoice before doorstep delivery.',
  };
}

// 1. Smart Shopping List Parser & Estimator
router.post('/smart-list', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ success: false, error: 'Shopping prompt text is required' });
  }

  const ai = getGeminiClient();

  if (ai) {
    try {
      const systemInstruction = `You are the AI Shopping Assistant for M-PARTNER (Powered by Mãrçò 💯).
The customer gives a rough shopping request, recipe idea, or messy text notes.
Parse it into a clean, structured JSON object with realistic Indian Rupee (INR ₹) estimated prices.
Format strictly as JSON:
{
  "summary": "Short 1-sentence summary of the order",
  "items": [
    {
      "id": "1",
      "name": "Standard item name",
      "quantity": "e.g. 500g, 1L, 2 packets",
      "category": "Dairy | Produce | Spices | Snacks | Pharmacy | Household",
      "estimatedPriceInr": 50,
      "storeType": "e.g. Local Kirana Store, Mother Dairy / Nandini, Pharmacy"
    }
  ],
  "totalEstimatedPrice": 250,
  "suggestedStores": ["Store 1", "Store 2"],
  "runnerInstructions": "Helpful tip for the assigned local Runner"
}`;

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Gemini timeout')), 4000)
      );

      const response: any = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              role: 'user',
              parts: [{ text: `Customer shopping request: "${prompt}"` }],
            },
          ],
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        }),
        timeoutPromise,
      ]);

      const text = response.text || '{}';
      const parsedData = JSON.parse(text);
      return res.json({
        success: true,
        source: 'gemini-3.8-flash',
        data: parsedData,
      });
    } catch (err: any) {
      console.warn('[Gemini Smart-List Fallback]:', err?.message || err);
      // Fall through to resilient local engine
    }
  }

  // Resilient fallback when offline or during API high-demand spikes
  const fallbackData = parseItemsLocally(prompt);
  return res.json({
    success: true,
    source: 'intelligent_local_engine',
    data: fallbackData,
  });
});

// 2. M-PARTNER AI Knowledge & Delivery Advisor
router.post('/assistant', async (req, res) => {
  const { question, userContext } = req.body;
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ success: false, error: 'Question is required' });
  }

  const ai = getGeminiClient();

  if (ai) {
    try {
      const systemInstruction = `You are M-PARTNER's friendly, efficient AI concierge (Powered by Mãrçò 💯).
Key facts:
- Platform: M-PARTNER
- Parent Brand: Mãrçò 💯
- Tagline: Your Needs. Your Trusted Partner.
- Model: Subscription-based local shopping assistance.
- Customer gets a dedicated neighborhood Runner who visits stores and delivers to doorstep.
- Delivery fee is covered by subscription credits (Starter: ₹200 for 20 deliveries, Standard: ₹400 for 40 deliveries, Premium: ₹750 for 80 deliveries).
- Samaan (groceries) are paid from the customer's Shopping Wallet balance or shop's UPI QR code.
- Every delivery requires customer to share a 6-digit Delivery OTP with the Runner.
Answer clearly, concisely, and warmly in the user's language (English or Hinglish/Hindi).`;

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Gemini timeout')), 4000)
      );

      const response: any = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              role: 'user',
              parts: [{ text: `User Question: "${question}" (Context: ${JSON.stringify(userContext || {})})` }],
            },
          ],
          config: {
            systemInstruction,
            temperature: 0.4,
          },
        }),
        timeoutPromise,
      ]);

      if (response && response.text) {
        return res.json({
          success: true,
          source: 'gemini-3.8-flash',
          answer: response.text,
        });
      }
    } catch (err: any) {
      console.warn('[Gemini Assistant Fallback]:', err?.message || err);
    }
  }

  return res.json({
    success: true,
    source: 'intelligent_local_engine',
    answer:
      'M-PARTNER (Powered by Mãrçò 💯) connects you with a dedicated local Runner for all your neighborhood shopping needs. Subscription plans start at just ₹200 for 20 doorstep deliveries. Grocery purchases are paid securely via your Shopping Wallet or verified UPI payments.',
  });
});

export default router;
