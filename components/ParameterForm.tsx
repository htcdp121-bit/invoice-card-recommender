'use client';

import type { RecommendParams } from '@/lib/types';

export interface ParameterFormProps {
  value: RecommendParams;
  onChange: (params: RecommendParams) => void;
  disabled?: boolean;
}

/**
 * 受控版表單：每次欄位變動立即把 params 回拋給上層 state。
 * 移除原「開始推薦」按鈕；觸發實際推薦由 page.tsx 的主按鈕負責，避免雙按鈕語意混淆。
 */
export default function ParameterForm({ value, onChange, disabled }: ParameterFormProps) {
  const update = (patch: Partial<RecommendParams>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-white">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex flex-col text-sm">
          <span className="font-medium mb-1">年費預算（NTD，0 表不限）</span>
          <input
            type="number"
            min={0}
            value={value.annualFeeBudget}
            onChange={(e) => update({ annualFeeBudget: Number(e.target.value) })}
            disabled={disabled}
            className="border rounded px-2 py-1 disabled:bg-slate-100"
          />
        </label>
        <label className="flex flex-col text-sm">
          <span className="font-medium mb-1">最多卡片數（預設 5）</span>
          <input
            type="number"
            min={1}
            max={10}
            value={value.maxCards}
            onChange={(e) => update({ maxCards: Number(e.target.value) })}
            disabled={disabled}
            className="border rounded px-2 py-1 disabled:bg-slate-100"
          />
        </label>
        <label className="flex flex-col text-sm">
          <span className="font-medium mb-1">回測期間（月）</span>
          <input
            type="number"
            min={1}
            max={36}
            value={value.horizonMonths}
            onChange={(e) => update({ horizonMonths: Number(e.target.value) })}
            disabled={disabled}
            className="border rounded px-2 py-1 disabled:bg-slate-100"
          />
        </label>
        <label className="flex flex-col text-sm">
          <span className="font-medium mb-1">風險偏好</span>
          <select
            value={value.riskAversion}
            onChange={(e) => update({ riskAversion: e.target.value as 'low' | 'mid' | 'high' })}
            disabled={disabled}
            className="border rounded px-2 py-1 disabled:bg-slate-100"
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
          checked={value.includeForeign}
          onChange={(e) => update({ includeForeign: e.target.checked })}
          disabled={disabled}
        />
        <span>包含海外消費與外幣交易</span>
      </label>
    </div>
  );
}

