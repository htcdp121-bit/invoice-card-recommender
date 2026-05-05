'use client';

import { useEffect, useState } from 'react';
import type { JobRecord } from '@/lib/types';

export interface LoadingPollerProps {
  jobId: string | null;
  onDone: (job: JobRecord) => void;
  intervalMs?: number;
}

export default function LoadingPoller({ jobId, onDone, intervalMs = 2000 }: LoadingPollerProps) {
  const [status, setStatus] = useState<string>('queued');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/job/${jobId}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const job: JobRecord = await res.json();
        if (cancelled) return;
        setStatus(job.status);
        if (job.status === 'done') {
          onDone(job);
          return;
        }
        if (job.status === 'error') {
          setError(job.error || 'Unknown error');
          return;
        }
        setTimeout(tick, intervalMs);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      }
    };
    tick();
    return () => { cancelled = true; };
  }, [jobId, intervalMs, onDone]);

  if (!jobId) return null;
  return (
    <div className="p-3 border rounded bg-gray-50 text-sm">
      <span className="font-medium">任務狀態：</span>
      <span className="ml-2">{status}</span>
      {error && <span className="ml-2 text-red-600">{error}</span>}
    </div>
  );
}
