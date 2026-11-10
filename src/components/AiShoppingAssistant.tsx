import React, { useState } from 'react';
import { Sparkles, Send, X, ShoppingBag, Check, Bot, ArrowRight, Lightbulb } from 'lucide-react';

interface AiShoppingAssistantProps {
  onApplyItems?: (itemsText: string, estimatedPrice?: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const AiShoppingAssistant: React.FC<AiShoppingAssistantProps> = ({
  onApplyItems,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'ask'>('list');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Chat tab state
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: 'Hello! I am your M-PARTNER AI Assistant. How can I help you with your neighborhood shopping, subscription plans, or local runner deliveries today?',
    },
  ]);

  if (!isOpen) return null;

  const quickPrompts = [
    'Weekly breakfast essentials: milk, multigrain bread, eggs, butter, bananas',
    'Dinner recipe ingredients for Paneer Butter Masala for 4 people',
    'Household cleaning staples: dishwash gel, floor cleaner, sponges, paper towels',
  ];

  const handleGenerateList = async (customPrompt?: string) => {
    const textToSubmit = customPrompt || prompt;
    if (!textToSubmit.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/v1/ai/smart-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToSubmit }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setResult(data.data);
      }
    } catch (err) {
      console.error('AI list generation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAskAi = async () => {
    if (!chatQuestion.trim()) return;
    const q = chatQuestion;
    setChatQuestion('');
    setChatHistory((prev) => [...prev, { sender: 'user', text: q }]);
    setChatLoading(true);

    try {
      const res = await fetch('/api/v1/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      setChatHistory((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: data.answer || 'I am ready to assist with your M-PARTNER orders and queries.',
        },
      ]);
    } catch {
      setChatHistory((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'M-PARTNER provides subscription-based personal runner shopping. Please check back in a moment.',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const applyToOrder = () => {
    if (!result || !result.items) return;
    const formatted = result.items
      .map((item: any) => `• ${item.name} (${item.quantity}) - ~₹${item.estimatedPriceInr}`)
      .join('\n');
    if (onApplyItems) {
      onApplyItems(formatted, result.totalEstimatedPrice);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-neutral-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm tracking-tight">M-PARTNER AI Suite</h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/20 font-mono">Gemini 3.8</span>
              </div>
              <p className="text-[11px] text-neutral-400">Powered by Mãrçò 💯</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-neutral-200 bg-neutral-50 px-4 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('list')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'list'
                ? 'border-black text-black'
                : 'border-transparent text-neutral-500 hover:text-black'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Smart List Maker</span>
          </button>
          <button
            onClick={() => setActiveTab('ask')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ask'
                ? 'border-black text-black'
                : 'border-transparent text-neutral-500 hover:text-black'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Concierge</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'list' ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-800 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  <span>What do you need today? Type naturally or paste notes:</span>
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. 1L toned milk, brown bread, dozen farm eggs, 250g paneer, and garlic paste for butter paneer..."
                  rows={3}
                  className="w-full text-xs p-3 rounded-2xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition"
                />
              </div>

              {/* Quick suggestions */}
              <div className="space-y-1.5">
                <p className="text-[11px] text-neutral-500 font-medium">Quick Suggestions:</p>
                <div className="flex flex-wrap gap-1.5">
                  {quickPrompts.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setPrompt(q);
                        handleGenerateList(q);
                      }}
                      className="text-[11px] text-neutral-600 bg-neutral-100 hover:bg-neutral-200 px-2.5 py-1 rounded-xl transition cursor-pointer text-left truncate max-w-full"
                    >
                      {q.split(':')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleGenerateList()}
                disabled={loading || !prompt.trim()}
                className="w-full py-2.5 rounded-xl bg-black text-white text-xs font-semibold hover:bg-neutral-800 disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Gemini AI is parsing and estimating INR prices...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Generate Structured Shopping List</span>
                  </>
                )}
              </button>

              {/* Parsed Result Display */}
              {result && (
                <div className="mt-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900">{result.summary}</h4>
                      <p className="text-[10px] text-neutral-500">
                        Suggested Stores: {result.suggestedStores?.join(', ') || 'Local Stores'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-neutral-500 uppercase font-semibold">Est. Total</span>
                      <p className="text-sm font-extrabold text-neutral-900">₹{result.totalEstimatedPrice}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {result.items?.map((item: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-white border border-neutral-200"
                      >
                        <div>
                          <span className="font-medium text-neutral-900">{item.name}</span>
                          <span className="text-[10px] text-neutral-400 ml-1.5">({item.quantity})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">
                            {item.category}
                          </span>
                          <span className="font-semibold text-neutral-800">~₹{item.estimatedPriceInr}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {result.runnerInstructions && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                      <strong>Runner Tip:</strong> {result.runnerInstructions}
                    </div>
                  )}

                  {onApplyItems && (
                    <button
                      onClick={applyToOrder}
                      className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Apply Items to Order Request</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col h-[350px]">
              {/* Chat History */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {chatHistory.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.sender === 'ai' && (
                      <div className="w-6 h-6 rounded-lg bg-neutral-900 text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] text-xs p-3 rounded-2xl ${
                        msg.sender === 'user'
                          ? 'bg-black text-white rounded-tr-none'
                          : 'bg-neutral-100 text-neutral-800 rounded-tl-none border border-neutral-200'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-lg bg-neutral-900 text-white flex items-center justify-center text-[10px]">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <div className="p-2.5 rounded-xl bg-neutral-100 text-neutral-500 text-xs flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-neutral-400 animate-pulse"></div>
                      <div className="w-2 h-2 rounded-full bg-neutral-400 animate-pulse delay-75"></div>
                      <div className="w-2 h-2 rounded-full bg-neutral-400 animate-pulse delay-150"></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="pt-3 border-t border-neutral-200 flex gap-2">
                <input
                  type="text"
                  value={chatQuestion}
                  onChange={(e) => setChatQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskAi()}
                  placeholder="Ask about plans, wallet, runner verification..."
                  className="flex-1 text-xs px-3 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:border-black"
                />
                <button
                  onClick={handleAskAi}
                  disabled={!chatQuestion.trim() || chatLoading}
                  className="px-3.5 py-2 rounded-xl bg-black text-white text-xs font-semibold hover:bg-neutral-800 disabled:opacity-50 transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
