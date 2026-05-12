import type { AggregatedInvoice, RecommendParams, CardRule } from '@/lib/types';

/**
 * 系統提示：明確要求以 Google Search grounding 查詢台灣信用卡實際優惠，
 * 每張卡必須含【卡名、期限、優惠內容、個人化推薦原因、官方連結】五個欄位。
 */
export function buildSystemPrompt(): string {
  return [
    '你是一位專業的台灣信用卡推薦顧問。你的任務是依據使用者的消費結構，推薦「当期最新」的台灣信用卡。',
    '',
    '【必要步驟】',
    '1. 用 Google Search 工具查詢使用者前三大類別的「台灣信用卡最新優惠」，例如：「2026 台灣餐飲回饋信用卡推薦」、「台灣網購回饋信用卡 2026」等。',
    '2. 只采用「現在仍在有效或明文有公告期限」的優惠；若查不到期限，註「長期有效」或「以官網公告為準」。',
    '3. 每張卡都要提供「官方介紹頁面 URL」（officialUrl），使用你從 Google Search 取得的真實網址，不可虐造。',
    '4. 每張卡都要針對使用者的具體消費類別與金額，寫出「為什麼推薦給你」的個人化原因（personalizedReason），例：「你每月餐飲消費 NTD 6,000，本卡餐飲 5% 加碼可帶來年約 NTD 3,600 回饋」。',
    '5. 推薦 3～5 張不同類別互補的卡片，以使用者的消費占比為依據。',
    '',
    '【輸出格式】請以 JSON 輸出，可包覆於 ```json ... ``` 代碼區塊中，結構為：',
    '{',
    '  "combinations": [',
    '    {',
    '      "cards": [',
    '        {',
    '          "name": "卡片完整名稱例如：國泰世華 CUBE 卡",',
    '          "issuer": "發卡銀行例如：國泰世華銀行",',
    '          "annualFee": 0,',
    '          "feeWaiverRule": "首年免年費、次年起 ...",',
    '          "officialUrl": "https://官方介紹頁面",',
    '          "applyUrl": "https://線上申辦連結若有",',
    '          "promotionPeriod": "2026/01/01 – 2026/12/31、或長期有效",',
    '          "benefits": [',
    '            { "title": "餐飲 5% 回饋", "detail": "...", "cap": "每月最高 500 點", "requirement": "需達低消《金額》" }',
    '          ],',
    '          "personalizedReason": "針對使用者類別與金額的推薦理由",',
    '          "warnings": ["需注意的限制"]',
    '        }',
    '      ],',
    '      "rationale": "本組合為何適合使用者的總說",',
    '      "warnings": ["組合層級警語"]',
    '    }',
    '  ],',
    '  "disclaimer": "資料來源與免責聲明"',
    '}',
  ].join('\n');
}

/**
 * 使用者提示。包含：消費總覽、前三大類別金額、參數限制、與本地資料庫現有卡片參考。
 * 本地資料庫卡片仅作為輔助參考，AI 应以 Google Search 取得的「当期最新」資訊為主。
 */
export function buildUserPrompt(
  agg: AggregatedInvoice,
  params: RecommendParams,
  cards: CardRule[],
): string {
  const safe = (n: number | undefined) => (typeof n === 'number' && isFinite(n) ? n : 0);
  const summary = {
    monthlyAvgSpend: Math.round(safe(agg.monthlyAvgSpend)),
    monthsCovered: safe(agg.monthsCovered),
    categories: (agg.categories || []).slice(0, 8).map((c) => ({
      category: c.category,
      monthlyAvg: Math.round(safe(c.monthlyAvg)),
      share: Number(safe(c.share).toFixed(3)),
      channelMix: {
        online: Number(safe(c.channelMix?.online).toFixed(2)),
        pos: Number(safe(c.channelMix?.pos).toFixed(2)),
        foreign: Number(safe(c.channelMix?.foreign).toFixed(2)),
      },
    })),
  };
  const topCats = summary.categories
    .slice(0, 3)
    .map((c) => `「${c.category}」 每月 NTD ${c.monthlyAvg.toLocaleString('en-US')}`)
    .join('、');

  return [
    '## 使用者消費摘要（已去識別化）',
    JSON.stringify(summary, null, 2),
    '',
    `## 重點類別（推薦時請重點針對這些類別查詢最新優惠）：${topCats || '無'}`,
    '',
    '## 參數',
    `- annualFeeBudget：${params.annualFeeBudget}（0 表不限）`,
    `- maxCards：${params.maxCards}`,
    `- horizonMonths：${params.horizonMonths}`,
    `- includeForeign：${params.includeForeign}`,
    `- riskAversion：${params.riskAversion}`,
    '',
    '## 本地資料庫已收錄的示範卡片（僅供輔助參考，請以 Google Search 查詢的實際卡片為主）',
    JSON.stringify(
      cards.slice(0, 6).map((c) => ({ id: c.id, name: c.name, issuer: c.issuer })),
    ),
    '',
    '## 任務',
    '1) 使用 Google Search 查詢針對使用者前三大類別的台灣信用卡最新優惠（3～5 張不同類別互補的卡片）。',
    '2) 每張卡提供：name / issuer / annualFee / officialUrl / promotionPeriod / benefits[] / personalizedReason。',
    '3) personalizedReason 必須引用使用者類別名與每月金額（例如：「你每月餐飲 NTD 6,000...」）。',
    '4) officialUrl 必須是你從搜尋取得的真實連結，不許虐造。',
    '5) 以本系統設定的 JSON 格式輸出。',
  ].join('\n');
}
