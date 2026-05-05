import type { AggregatedInvoice, RecommendParams, CardRule, RecommendationResult } from '@/lib/types';
import { greedyMarginalSelect } from './marginal';

/**
 * 在 Gemini 輸出之外，本模組提供一個本地邊際貢獻回測「參考結果」，
 * 用來對 Gemini 推薦進行下限保護與交叉驗證。
 */
export function localBacktest(
  agg: AggregatedInvoice,
  params: RecommendParams,
  cards: CardRule[],
): RecommendationResult {
  const filtered = params.includeForeign
    ? cards
    : cards.filter((c) => !(c.channelBonuses || []).some((b) => b.channels.includes('foreign')));
  const top = greedyMarginalSelect(
    filtered,
    agg.categories,
    params.horizonMonths,
    params.maxCards,
    params.annualFeeBudget,
  );
  return {
    combinations: [top.combination],
    disclaimer: '本結果為本機邊際貢獻質心回測，仅作為 Gemini 輸出之參考與下限保護。',
  };
}
