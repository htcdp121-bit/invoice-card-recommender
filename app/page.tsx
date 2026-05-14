'use client';

import { useState } from 'react';
import ParameterForm from '@/components/ParameterForm';
import InvoiceUploader from '@/components/InvoiceUploader';
import ResultPanel from '@/components/ResultPanel';
import LoadingPoller from '@/components/LoadingPoller';
import type {
  RecommendParams,
  AggregatedInvoice,
  RecommendationResult,
} from '@/lib/types';

export default function Page() {
  const [params, setParams] = useState<RecommendParams>({
    annualFeeBudget: 0,
    maxCards: 5,
    horizonMonths: 12,
    includeForeign: true,
    riskAversion: 'mid',
  });
  const [aggregate, setAggregate] = useState<AggregatedInvoice | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  async function handleRun() {
    if (!aggregate) {
      setError('請先上傳發票 CSV');
      return;
    }
    setError(null);
    setResult(null);
    setJobId(null);
    setLoading(true);
    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ params, aggregated: aggregate }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        setError(`提交失敗（HTTP ${res.status}）${text ? '：' + text.slice(0, 200) : ''}`);
        return;
      }
      const j = await res.json();
      if (j.result) {
        setResult(j.result);
      } else if (j.jobId) {
        setJobId(j.jobId);
      } else if (j.error) {
        setError(j.error);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const canRun = !!aggregate && !loading;

  return (
    <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      <header>
        <h1 className="text-3xl font-bold">發票推卡</h1>
        <p className="text-slate-600 mt-2">上傳發票 → 前端雜湊去識別化 → AI 邊際回測 → 推薦 5 張卡組合。</p>
      </header>
      <ParameterForm value={params} onChange={setParams} disabled={loading} />
      <InvoiceUploader onParsed={setAggregate} />
      <div>
        <button
          onClick={handleRun}
          className="w-full py-3 rounded-xl bg-slate-900 text-white font-semibold disabled:opacity-50"
          disabled={!canRun}
        >
          {loading ? '推薦運算中…' : '開始推薦'}
        </button>
        {!aggregate && (
          <p className="text-xs text-slate-500 mt-2 text-center">請先上傳發票 CSV 後才能開始推薦。</p>
        )}
      </div>
      {error && (
        <div className="p-3 rounded border border-red-300 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}
      {jobId && !result && (
        <LoadingPoller
          jobId={jobId}
          onDone={(job) => {
            if (job.result) setResult(job.result);
            if (job.error) setError(job.error);
          }}
        />
      )}
      {result && <ResultPanel result={result} aggregate={aggregate} />}
      <footer className="text-xs text-slate-500 text-center pt-10">
        本系統不儲存任何發票明細與個資，關閉頁面即釋放。
      </footer>
    </main>
  );
}
