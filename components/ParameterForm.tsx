'use client';

import { useState } from 'react';
import type { RecommendParams } from '@/lib/types';

export interface ParameterFormProps {
  onSubmit: (params: RecommendParams) => void;
  disabled?: boolean;
}

export default function ParameterForm({ onSubmit, disabled }: ParameterFormProps) {
  const [annualFeeBudget, setAnnualFeeBudget] = useState<number>(0);
  const [maxCards, setMaxCards] = useState<number>(5);
  const [horizonMonths, setHorizonMonths] = useState<number>(12);
  const [includeForeign, setIncludeForeign] = useState<boolean>(true);
  const [riskAversion, setRiskAversion] = useState<'low' | 'mid' | 'high'>('mid');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ annualFeeBudget, maxCards, horizonMonths, includeForeign, riskAversion });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-white">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex flex-col text-sm">
          <span className="font-medium mb-1">年費預算（NTD）</span>
          <input
            type="number"
            min={0}
            value={annualFeeBudget}
            onChange={(e) => setAnnualFeeBudget(Number(e.target.value))}
            className="border rounded px-2 py-1"
          />
        </label>
        <label className="flex flex-col text-sm">
          <span className="font-medium mb-1">最多卡片數（預設 5）</span>
          <input
            type="number"
            min={1}
            max={10}
            value={maxCards}
            onChange={(e) => setMaxCards(Number(e.target.value))}
            className="border rounded px-2 py-1"
          />
        </label>
        <label className="flex flex-col text-sm">
          <span className="font-medium mb-1">回測期間（月）</span>
          <input
            type="number"
            min={1}
            max={36}
            value={horizonMonths}
            onChange={(e) => setHorizonMonths(Number(e.target.value))}
            className="border rounded px-2 py-1"
          />
        </label>
        <label className="flex flex-col text-sm">
          <span className="font-medium mb-1">風險偏好</span>
          <select
            value={riskAversion}
            onChange={(e) => setRiskAversion(e.target.value as 'low' | 'mid' | 'high')}
            className="border rounded px-2 py-1"
          >
            <option value="low">低（追求最高回饋）</option>
            <option value="mid">中（平衡）</option>
            <option value="high">高（重視穩定）</option>
          </select>
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={includeForeign}
          onChange={(e) => setIncludeForeign(e.target.checked)}
        />
        <span>包含海外消費與外幣交易</span>
      </label>
      <button
        type="submit"
        disabled={disabled}
        className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
      >
        開始推薦
      </button>
    </form>
  );
}
