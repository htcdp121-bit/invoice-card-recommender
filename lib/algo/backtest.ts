import type {
  AggregatedInvoice,
  RecommendParams,
  CardRule,
  RecommendationResult,
  CardCombination,
} from '@/lib/types';
import { greedyMarginalSelect, evaluateCombo } from './marginal';

/**
 * 本地邊際貢獻回測「保底結果」：
 *  - greedy 找最佳組合；若 greedy 找不到任何卡（cards=[]），
 *    退而選 base reward × 估算消費為最高的 1 張零年費卡，避免回空集合。
 */
export function localBacktest(
  agg: AggregatedInvoice,
  params: RecommendParams,
  cards: CardRule[],
): RecommendationResult {
  const filtered = params.includeForeign
    ? cards
    : cards.filter(
        (c) =>
          !(c.channelBonuses || []).some((b) => b.channels.includes('foreign')),
      );

  const top = greedyMarginalSelect(
    filtered,
    agg.categories,
    params.horizonMonths,
    params.maxCards,
    params.annualFeeBudget,
  );

  let combination: CardCombination = top.combination;

  // 保底：greedy 回空集合時，挑一張 base rate 最高且年費不超預算的卡
  if (combination.cards.length === 0 && filtered.length > 0) {
    const budget = params.annualFeeBudget;
    const candidates = filtered
      .filter((c) => budget <= 0 || (c.annualFee || 0) <= budget)
      .sort((a, b) => (b.baseRewardRate || 0) - (a.baseRewardRate || 0));
    const pick = candidates[0] || filtered[0];
    const horizonEval = evaluateCombo([pick], agg.categories, params.horizonMonths);
    const annualFactor = 12 / Math.max(params.horizonMonths, 1);
    combination = {
      cards: [{ id: pick.id, name: pick.name, issuer: pick.issuer }],
      grossAnnualReward: Math.round(horizonEval.gross * annualFactor),
      totalAnnualFee: pick.annualFee || 0,
      netAnnualReward: Math.round(horizonEval.net * annualFactor),
      rationale: '本地保底：邊際貢獻為負或無匹配規則，改以基礎回饋率最高且符合年費預算的卡片作為保底建議。',
    };
  }

  return {
    combinations: [combination],
    disclaimer:
      '本結果為本機邊際貢獻質心回測，僅作為 AI 推薦之參考與下限保護。',
  };
}
