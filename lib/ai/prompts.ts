import type { AggregatedInvoice, RecommendParams, CardRule } from '@/lib/types';

/**
 * 組裝 Gemini 提示詞：將消費分類、年費預算、卹選卡片規則與邊際貢獻回測規則集成。
 */
export function buildSystemPrompt(): string {
  return [
    '你是一位台灣信用卡状態及邊際貢獻回測專家。',
    '請依據使用者提供的消費結構、卹選卡片規則與參數，推薦最佳的 1-N 張信用卡組合（以 marginal contribution 為主）。',
    '必須考慮年費、回饋上限、合資格門檻（grace）、電商及海外通路差異。',
    '最後輸出必須是合規 JSON，不可包含 markdown 包裝。',
  ].join('\n');
}

export function buildUserPrompt(
  agg: AggregatedInvoice,
  params: RecommendParams,
  cards: CardRule[],
): string {
  const summary = {
    monthlyAvgSpend: Math.round(agg.monthlyAvgSpend),
    monthsCovered: agg.monthsCovered,
    categories: agg.categories.map((c) => ({
      category: c.category,
      monthlyAvg: Math.round(c.monthlyAvg),
      share: Number(c.share.toFixed(3)),
      channelMix: {
        online: Number(c.channelMix.online.toFixed(2)),
        pos: Number(c.channelMix.pos.toFixed(2)),
        foreign: Number(c.channelMix.foreign.toFixed(2)),
      },
    })),
  };
  return [
    '## 使用者參數',
    JSON.stringify(params),
    '## 消費說明（已去識別化）',
    JSON.stringify(summary),
    '## 卹選卡片規則集',
    JSON.stringify(cards),
    '## 輸出規格',
    'JSON: { combinations: Array<{ cards: Array<{id,name,issuer}>, grossAnnualReward:number, totalAnnualFee:number, netAnnualReward:number, rationale:string, warnings?:string[] }>, disclaimer:string }',
    '請推薦不超過 ' + params.maxCards + ' 張的組合，Top ' + Math.min(5, params.maxCards) + ' 個。',
  ].join('\n');
}
