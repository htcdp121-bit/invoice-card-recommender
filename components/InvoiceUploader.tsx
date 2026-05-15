'use client';

import { useRef, useState } from 'react';
import { parseInvoiceCsv } from '@/lib/csv/parser';
import { hashTaxIds } from '@/lib/csv/hash';
import { aggregateByCategory } from '@/lib/csv/aggregator';
import { getTaxIdMapSize } from '@/lib/csv/taxid-classifier';
import type { AggregatedInvoice } from '@/lib/types';

export interface InvoiceUploaderProps {
  onParsed: (data: AggregatedInvoice) => void;
}

/**
 * 第 14 次更新：在去識別化後、聚合前，計算「未分類統編」統計並暴露到 window，
 * 供使用者在 DevTools console 匯出 top-N 未分類統編，用於擴充 TAXID_CATEGORY_MAP。
 */
function computeTaxIdStats(rows: Array<{ sellerTaxId: string; amount: number; category?: string }>) {
  const unclassified = new Map<string, { amount: number; count: number }>();
  let classifiedAmount = 0;
  let unclassifiedAmount = 0;
  let classifiedCount = 0;
  let unclassifiedCount = 0;
  for (const r of rows) {
    if (r.category) {
      classifiedAmount += r.amount;
      classifiedCount += 1;
    } else {
      unclassifiedAmount += r.amount;
      unclassifiedCount += 1;
      const key = r.sellerTaxId || '(empty)';
      const cur = unclassified.get(key) || { amount: 0, count: 0 };
      cur.amount += r.amount;
      cur.count += 1;
      unclassified.set(key, cur);
    }
  }
  const totalAmount = classifiedAmount + unclassifiedAmount;
  const totalCount = classifiedCount + unclassifiedCount;
  return {
    unclassified,
    stats: {
      totalCount,
      totalAmount,
      classifiedCount,
      classifiedAmount,
      unclassifiedCount,
      unclassifiedAmount,
      coverageByCount: totalCount > 0 ? classifiedCount / totalCount : 0,
      coverageByAmount: totalAmount > 0 ? classifiedAmount / totalAmount : 0,
      dictSize: getTaxIdMapSize(),
    },
  };
}

export default function InvoiceUploader({ onParsed }: InvoiceUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setStatus('讀取檔案中...');
    try {
      const allRows: Awaited<ReturnType<typeof parseInvoiceCsv>> = [];
      for (const file of Array.from(files)) {
        const text = await file.text();
        const rows = await parseInvoiceCsv(text);
        allRows.push(...rows);
      }
      setStatus('去識別化中...');
      const hashed = await hashTaxIds(allRows);

      // 第 14 次更新：暴露 debug 統計到 window，方便使用者匯出未分類 top-N 統編
      if (typeof window !== 'undefined') {
        const { unclassified, stats } = computeTaxIdStats(hashed as any);
        (window as any).__unclassifiedTaxIds = unclassified;
        (window as any).__taxidStats = stats;
        // eslint-disable-next-line no-console
        console.log(
          '[InvoiceUploader] taxid coverage:',
          `${(stats.coverageByCount * 100).toFixed(1)}%`,
          'by count,',
          `${(stats.coverageByAmount * 100).toFixed(1)}%`,
          'by amount; dictSize=',
          stats.dictSize,
          '; unclassified taxids=',
          unclassified.size,
        );
        // eslint-disable-next-line no-console
        console.log(
          '[InvoiceUploader] 要查未分類 top 50，請貼：',
          'console.table(Array.from(window.__unclassifiedTaxIds.entries()).map(([k,v])=>({taxId:k,amount:v.amount,count:v.count})).sort((a,b)=>b.amount-a.amount).slice(0,50))',
        );
      }

      setStatus('聚合分類中...');
      const aggregated = aggregateByCategory(hashed);
      setStatus(`解析完成：共 ${hashed.length} 筆交易`);
      onParsed(aggregated);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`解析失敗：${message}`);
      setStatus('');
    }
  };

  return (
    <div className="p-4 border border-dashed rounded-lg bg-white">
      <p className="text-sm font-medium mb-2">上傳財政部電子發票 CSV（資料僅在瀏覽器中処理）</p>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="text-sm"
      />
      {status && <p className="text-xs text-gray-600 mt-2">{status}</p>}
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      <p className="text-xs text-gray-500 mt-2">【隱私】買方統一編號在瀏覽器端進行 SHA-256 hash，不上傳原始識別資料。</p>
    </div>
  );
}
