'use client';

import { useRef, useState } from 'react';
import { parseInvoiceCsv } from '@/lib/csv/parser';
import { hashTaxIds } from '@/lib/csv/hash';
import { aggregateByCategory } from '@/lib/csv/aggregator';
import type { AggregatedInvoice } from '@/lib/types';

export interface InvoiceUploaderProps {
  onParsed: (data: AggregatedInvoice) => void;
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
      <p className="text-sm font-medium mb-2">上傳財政部電子發票 CSV（資料僅在瀨覽器中処理）</p>
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
      <p className="text-xs text-gray-500 mt-2">【隱私】買方統一編號在瀨覽器端進行 SHA-256 hash，不上傳原始識別資料。</p>
    </div>
  );
}
