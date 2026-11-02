import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Play, ShieldCheck, RefreshCw } from 'lucide-react';

interface TestResult {
  id: number;
  rule: string;
  passed: boolean;
  details: string;
  timestamp: string;
}

export const TestsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ total: number; passed: number; failed: number; results: TestResult[] } | null>(null);

  const runTests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/public/run-tests');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="bg-white text-neutral-900 py-12 md:py-20 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 text-neutral-800 rounded-full text-xs font-semibold uppercase tracking-wider">
            <span>Powered by Mãrçò 💯</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-black tracking-tight">Automated Business Rules Test Suite</h1>
              <p className="text-xs text-neutral-500 mt-1">
                Live verification of all 20 mandatory business rules specified in Project Requirements Section 25.
              </p>
            </div>
            <button
              onClick={runTests}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Executing Tests...' : 'Run All 20 Tests'}</span>
            </button>
          </div>
        </div>

        {/* Scorecard */}
        {data && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200">
              <span className="text-[10px] font-bold uppercase text-neutral-400">Total Test Cases</span>
              <p className="text-3xl font-extrabold text-neutral-900 mt-1">{data.total}</p>
            </div>
            <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200">
              <span className="text-[10px] font-bold uppercase text-emerald-800">Passed</span>
              <p className="text-3xl font-extrabold text-emerald-700 mt-1">{data.passed}</p>
            </div>
            <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200">
              <span className="text-[10px] font-bold uppercase text-neutral-400">Failed</span>
              <p className={`text-3xl font-extrabold mt-1 ${data.failed > 0 ? 'text-rose-600' : 'text-neutral-400'}`}>
                {data.failed}
              </p>
            </div>
          </div>
        )}

        {/* Test List */}
        <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-3xl overflow-hidden bg-white shadow-xs">
          {data?.results.map((t) => (
            <div key={t.id} className="p-4 sm:p-5 flex items-start gap-4 hover:bg-neutral-50/50 transition">
              <div className="mt-0.5">
                {t.passed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                )}
              </div>
              <div className="space-y-1 flex-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-neutral-400 font-bold">#{t.id}</span>
                  <span className="font-bold text-neutral-900">{t.rule}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    t.passed ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                  }`}>
                    {t.passed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
                <p className="text-neutral-600 text-[11px] leading-relaxed">{t.details}</p>
              </div>
            </div>
          ))}

          {loading && !data && (
            <div className="p-12 text-center text-xs text-neutral-500">
              Running automated test suite against backend database...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
