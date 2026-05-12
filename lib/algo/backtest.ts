import type {
  AggregatedInvoice,
  RecommendParams,
  CardRule,
  RecommendationResult,
  CardCombination,
  RecommendedCard,
} from '@/lib/types';
import { greedyMarginalSelect, evaluateCombo } from './marginal';

/**
 * 本地邊際貢獻回測「保底結果」：
 * - 先以 greedy 找到最佳組合；
 * - 若仍為空，退而以「淸年化回饋最高且非負」的零年費卡作為保底；
 * - 仍找不到則以任意卡作保底。
 * 輸出結構依循新版 RecommendedCard（由式包括 name/issuer/annualFee以及個人化原因）。
 */
export function localBacktest(
  agg: AggregatedInvoice,
  params: RecommendParams,
  cards: CardRule[],
): RecommendationResult {
  const filtered = params.includeForeign
    ? cards
    : cards.filter(
        (c) => !(c.channelBonuses || []).some((b) => b.channels.includes('foreign')),
      );
  const top = greedyMarginalSelect(
    filtered,
    agg.categories,
    params.horizonMonths,
    params.maxCards,
    params.annualFeeBudget,
  );

  // 將 greedyMarginalSelect 回傳的簡易 cards 轉換為 RecommendedCard
  const topCategories = (agg.categories || [])
    .slice(0, 3)
    .map((c) => `${c.category}(每月 NTD ${Math.round(c.monthlyAvg).toLocaleString('en-US')})`)
    .join('、');

  const enrichOne = (id: string, name: string, issuer: string): RecommendedCard => {
    const rule = cards.find((c) => c.id === id);
    return {
      id,
      name,
      issuer,
      annualFee: rule?.annualFee,
      feeWaiverRule: rule?.feeWaiverRule,
      personalizedReason: topCategories
        ? `依據你的前三大類別：${topCategories}，本卡為本地邊際貢獻回測推薦。官方連結由 AI 即時查詢；本次 AI 不可用，請另行查詢官網以取得最新優惠。`
        : '本次為本地保底推薦。',
      benefits: rule?.categoryBonuses?.slice(0, 3).map((b) => ({
        title: `${b.categories.join('/')} 加碼 ${(b.rate * 100).toFixed(1)}%`,
        detail: b.requirement || '',
        cap: b.cap ? `${b.cap.period} 上限 ${b.cap.amount.toLocaleString('en-US')}` : undefined,
        requirement: b.requirement,
      })),
    };
  };

  let combination: CardCombination = {
    cards: top.combination.cards.map((c) => enrichOne(c.id, c.name, c.issuer)),
    grossAnnualReward: top.combination.grossAnnualReward,
    totalAnnualFee: top.combination.totalAnnualFee,
    netAnnualReward: top.combination.netAnnualReward,
    rationale: top.combination.rationale,
    warnings: top.combination.warnings,
  };

  // 保底：greedy 回空集合時挑一張「淸回饋最佳且年費合預算」的卡
  if (combination.cards.length === 0 && filtered.length > 0) {
    const budget = params.annualFeeBudget;
    const annualFactor = 12 / Math.max(params.horizonMonths, 1);
    const ranked = filtered
      .filter((c) => budget <= 0 || (c.annualFee || 0) <= budget)
      .map((c) => {
        const ev = evaluateCombo([c], agg.categories, params.horizonMonths);
        return { card: c, gross: ev.gross * annualFactor, net: ev.net * annualFactor };
      })
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
      cards: [enrichOne(pick.id, pick.name, pick.issuer)],
      grossAnnualReward: Math.round(pickEval.gross),
      totalAnnualFee: pick.annualFee || 0,
      netAnnualReward: Math.round(pickEval.net),
      rationale: '本地保底：邊際貢獻為負或無匹配規則，改以「淸年化回饋最高且符合年費預算」的卡作為保底建議。',
    };
  }

  return {
    combinations: [combination],
    disclaimer:
      '本結果為本機邊際貢獻質心回測，僅作為 AI 即時推薦之參考與下限保護。官方連結與当期優惠請以各銀行官網為準。',
  };
}
