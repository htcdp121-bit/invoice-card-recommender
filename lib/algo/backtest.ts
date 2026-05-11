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
 *    退而以「淨年化回饋最高且非負」的零年費卡作為保底；
 *    若仍找不到，最後才考量任何卡作保底建議。
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

  // 保底：greedy 回空集合時挑一張「淨回饋最佳且年費合預算」的卡
  if (combination.cards.length === 0 && filtered.length > 0) {
    const budget = params.annualFeeBudget;
    const annualFactor = 12 / Math.max(params.horizonMonths, 1);
    const ranked = filtered
      .filter((c) => budget <= 0 || (c.annualFee || 0) <= budget)
      .map((c) => {
        const ev = evaluateCombo([c], agg.categories, params.horizonMonths);
        return { card: c, gross: ev.gross * annualFactor, net: ev.net * annualFactor };
      })
      // 優先「淨回饋為正」且最大；其次「淨回饋最大（即使是負，挑損失最少）」
      .sort((a, b) => {
        const aPositive = a.net >= 0 ? 1 : 0;
        const bPositive = b.net >= 0 ? 1 : 0;
        if (aPositive !== bPositive) return bPositive - aPositive;
        return b.net - a.net;
      });
    const pick = ranked[0]?.card || filtered[0];
    const pickEval = ranked[0] || {
      card: pick,
      gross: 0,
      net: -(pick.annualFee || 0),
    };
    combination = {
      cards: [{ id: pick.id, name: pick.name, issuer: pick.issuer }],
      grossAnnualReward: Math.round(pickEval.gross),
      totalAnnualFee: pick.annualFee || 0,
      netAnnualReward: Math.round(pickEval.net),
      rationale:
        '本地保底：邊際貢獻為負或無匹配規則，改以「淨年化回饋最高且符合年費預算」的卡作為保底建議。',
    };
  }

  return {
    combinations: [combination],
    disclaimer:
      '本結果為本機邊際貢獻質心回測，僅作為 AI 推薦之參考與下限保護。',
  };
}
