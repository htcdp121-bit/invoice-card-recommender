'use client';
import { useState } from 'react';
import ParameterForm from '@/components/ParameterForm';
import type { RecommendParams } from '@/lib/types';
import InvoiceUploader from '@/components/InvoiceUploader';
import ResultPanel from '@/components/ResultPanel';
import LoadingPoller from '@/components/LoadingPoller';
import type { AggregatedInvoice, RecommendationResult } from '@/lib/types';

export default function Page() {
  const [params, setParams] = useState<RecommendParams>({ annualFeeBudget: 0, maxCards: 5, horizonMonths: 12, includeForeign: false, riskAversion: 'mid' });
  const [aggregate, setAggregate] = useState<AggregatedInvoice | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    if (!aggregate) { setError('請先上傳發票 CSV'); return; }
    setError(null);
    setResult(null);
    const res = await fetch('/api/recommend', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ params, aggregate })
    });
    if (!res.ok) { setError('提交失敗，請稍後再試'); return; }
    const j = await res.json();
    setJobId(j.jobId);
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      <header>
        <h1 className="text-3xl font-bold">發票推卡</h1>
        <p className="text-slate-600 mt-2">上傳發票 → 前端雜湊去識別化 → AI 邊際回測 → 推薦 5 張卡組合。</p>
      </header>

      <ParameterForm onSubmit={setParams} disabled={!aggregate} />
      <InvoiceUploader onParsed={setAggregate} />

      <button
        onClick={handleRun}
        className="w-full py-3 rounded-xl bg-slate-900 text-white font-semibold disabled:opacity-50"
        disabled={!aggregate}
      >
        開始精算
      </button>

      {error && <p className="text-red-600">{error}</p>}
      {jobId && !result && <LoadingPoller jobId={jobId} onDone={(job) => { if (job.result) setResult(job.result); if (job.error) setError(job.error); }} />}
      {result && <ResultPanel result={result} />}

      <footer className="text-xs text-slate-500 text-center pt-10">
        本系統不儲存任何發票明細與個資，關閉頁面即釋放。
      </footer>
    </main>
  );
}
