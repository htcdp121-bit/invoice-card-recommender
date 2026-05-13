'use client';

import type { RecommendationResult, RecommendedCard } from '@/lib/types';

export interface ResultPanelProps {
  result: RecommendationResult | null;
}

function CardBlock({ card, idx }: { card: RecommendedCard; idx: number }) {
  return (
    <div className="border rounded-lg p-4 bg-white space-y-3">
      {/* 一區：卡名 + 發卡銀行 + 年費 */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-base font-semibold text-gray-900">
            #{idx + 1} {card.name}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">{card.issuer}</div>
        </div>
        <div className="text-right shrink-0">
          {typeof card.annualFee === 'number' && (
            <div className="text-xs text-gray-600">年費 NTD {card.annualFee.toLocaleString('en-US')}</div>
          )}
          {card.feeWaiverRule && (
            <div className="text-[11px] text-gray-500 mt-0.5">{card.feeWaiverRule}</div>
          )}
        </div>
      </div>

      {/* 二區：優惠期限 */}
      {card.promotionPeriod && (
        <div className="inline-block px-2 py-1 text-xs rounded bg-blue-50 text-blue-700 border border-blue-200">
          優惠期限：{card.promotionPeriod}
        </div>
      )}

      {/* 三區：優惠內容 */}
      {card.benefits && card.benefits.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-700">優惠內容</div>
          <ul className="space-y-1">
            {card.benefits.map((b, i) => (
              <li key={i} className="text-sm text-gray-800">
                <span className="font-medium">• {b.title}</span>
                {b.detail && <span className="text-gray-600">：{b.detail}</span>}
                {b.cap && (
                  <span className="ml-2 text-[11px] text-gray-500">（{b.cap}）</span>
                )}
                {b.requirement && !b.detail && (
                  <span className="ml-2 text-[11px] text-amber-700">需求：{b.requirement}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 四區：個人化推薦原因 */}
      {card.personalizedReason && (
        <div className="text-sm text-gray-800 bg-green-50 border border-green-200 rounded p-2">
          <span className="font-medium text-green-800">為什麼推薦給你：</span>
          {card.personalizedReason}
        </div>
      )}

      {/* 五區：官方連結（含驗證狀態註記） */}
      <div className="flex flex-wrap gap-2 pt-1 items-center">
        {card.officialUrl && (
          <a
            href={card.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-1.5 text-xs rounded border border-gray-300 hover:bg-gray-50 text-gray-700"
          >
            🔗 查看官方頁面 ↗
          </a>
        )}
        {card.applyUrl && card.applyUrl !== card.officialUrl && (
          <a
            href={card.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-1.5 text-xs rounded bg-blue-600 hover:bg-blue-700 text-white"
          >
            立即申辦 ↗
          </a>
        )}
        {!card.officialUrl && !card.applyUrl && (
          <span className="text-[11px] text-gray-400">本次未取得官方連結，請另行查詢銀行官網</span>
        )}
      </div>
      {(card.officialUrlNote || card.applyUrlNote) && (
        <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
          ⚠ {card.officialUrlNote || card.applyUrlNote}
        </div>
      )}

      {/* 警語 */}
      {card.warnings && card.warnings.length > 0 && (
        <ul className="text-xs text-orange-700 list-disc pl-5 mt-1">
          {card.warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      )}
    </div>
  );
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
  const allCards: RecommendedCard[] = [];
  for (const combo of result.combinations || []) {
    for (const c of combo.cards || []) allCards.push(c);
  }

  return (
    <div className="space-y-4">
      {/* 來源警示橫幅 */}
      {isFallback ? (
        <div className="p-3 rounded border border-amber-300 bg-amber-50 text-amber-800 text-sm">
          ⚠ 本次未能取得 AI 即時推薦。以下為本地保底邊際貢獻回測結果，<b>可能不含最新官網連結與優惠期限</b>。
        </div>
      ) : (
        <div className="p-3 rounded border border-emerald-300 bg-emerald-50 text-emerald-800 text-sm">
          ✓ 以下為 AI 透過 Google Search 即時查詢台灣各銀行官網後產生的推薦結果。所有官方連結經後端 HEAD 驗證；若深連結失效會自動降級至該銀行信用卡總覽頁（會以橘色橫條標示）。
        </div>
      )}

      <h2 className="text-lg font-semibold">推薦卡片清單（共 {allCards.length} 張）</h2>

      <div className="space-y-3">
        {allCards.map((card, idx) => (
          <CardBlock key={idx} card={card} idx={idx} />
        ))}
      </div>

      {result.combinations?.[0]?.rationale && (
        <div className="p-3 rounded border border-gray-200 bg-gray-50 text-sm text-gray-700">
          <span className="font-medium">總體組合說明：</span>{result.combinations[0].rationale}
        </div>
      )}

      {typeof result.combinations?.[0]?.netAnnualReward === 'number' &&
        (result.combinations[0].netAnnualReward as number) > 0 && (
          <div className="text-xs text-gray-600">
            估計年化淨回饋（全部推薦卡）：NTD {(result.combinations[0].netAnnualReward as number).toLocaleString('en-US')}
          </div>
        )}

      {result.sources && result.sources.length > 0 && (
        <div className="text-xs text-gray-500 border-t pt-2">
          <div className="font-medium mb-1">資料來源引用（AI 從這些頁面取得資訊）：</div>
          <ul className="space-y-0.5">
            {result.sources.map((s, i) => (
              <li key={i} className="truncate">
                •{' '}
                <a
                  href={s.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {s.title || s.uri}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.disclaimer && (
        <p className="text-[11px] text-gray-500 border-t pt-2">{result.disclaimer}</p>
      )}
    </div>
  );
}
