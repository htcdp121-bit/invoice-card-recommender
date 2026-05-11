'use client';

import type { RecommendationResult } from '@/lib/types';

export interface ResultPanelProps {
  result: (RecommendationResult & { source?: 'gemini' | 'fallback' }) | null;
}

export default function ResultPanel({ result }: ResultPanelProps) {
  if (!result) {
    return (
      <div className="p-4 border rounded-lg bg-white text-sm text-gray-500">
        尚未產生推薦結果。請上傳發票 CSV 並設定參數後點選「開始推薦」。
      </div>
    );
  }
  const isFallback = result.source === 'fallback';
  return (
    <div className="p-4 border rounded-lg bg-white space-y-4">
      {isFallback && (
        <div className="p-3 rounded border border-amber-300 bg-amber-50 text-amber-800 text-sm">
          ⚠ 本次未能取得 AI 推薦結果，以下為本地保底邏輯（邊際貢獻 / 最高基礎回饋率）的建議。
        </div>
      )}
      <h2 className="text-lg font-semibold">
        推薦組合 Top {result.combinations.length}
      </h2>
      <ul className="space-y-3">
        {result.combinations.map((combo, idx) => (
          <li key={idx} className="border rounded p-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">
                #{idx + 1} {combo.cards.map((c) => c.name).join(' + ') || '（無建議卡片）'}
              </span>
              <span className="text-sm text-green-700">
                年化淨回饋 NTD {combo.netAnnualReward.toLocaleString()}
              </span>
            </div>
            <div className="text-xs text-gray-600 mt-1">
              原始回饋：{combo.grossAnnualReward.toLocaleString()}｜年費：{combo.totalAnnualFee.toLocaleString()}
            </div>
            <p className="text-sm mt-2">{combo.rationale}</p>
            {combo.warnings && combo.warnings.length > 0 && (
              <ul className="text-xs text-orange-600 mt-2 list-disc pl-5">
                {combo.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
      {result.disclaimer && (
        <p className="text-xs text-gray-500 border-t pt-2">{result.disclaimer}</p>
      )}
    </div>
  );
}
