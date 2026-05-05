import type { CardRule, CategorySpend, CardCombination } from '@/lib/types';
import { waterfall } from './waterfall';

/**
 * 邊際貢獻回測演算：計算「加入某張卡」能帶來多少額外淸回饋。
 * 在質心（greedy）集合建構中，不斷選出邊際淸貢獻最高的卡片加入組合，
 * 直到達到 maxCards 或邊際貢獻為負為止。
 */
export interface MarginalResult {
  combination: CardCombination;
  selectedIds: string[];
}

export function evaluateCombo(
  selected: CardRule[],
  categories: CategorySpend[],
  horizonMonths: number,
): { gross: number; fee: number; net: number } {
  if (selected.length === 0) return { gross: 0, fee: 0, net: 0 };
  const allocations = waterfall(selected, categories, horizonMonths);
  const gross = allocations.reduce((sum, a) => sum + a.reward, 0);
  const annualFactor = horizonMonths / 12;
  const fee = selected.reduce((sum, c) => sum + (c.annualFee || 0) * annualFactor, 0);
  return { gross, fee, net: gross - fee };
}

export function greedyMarginalSelect(
  cards: CardRule[],
  categories: CategorySpend[],
  horizonMonths: number,
  maxCards: number,
  annualFeeBudget: number,
): MarginalResult {
  const selected: CardRule[] = [];
  const remaining = [...cards];
  let current = evaluateCombo(selected, categories, horizonMonths);
  while (selected.length < maxCards) {
    let bestCard: CardRule | null = null;
    let bestDelta = 0;
    let bestEval = current;
    for (const card of remaining) {
      const trial = [...selected, card];
      const evalTrial = evaluateCombo(trial, categories, horizonMonths);
      const totalFee = trial.reduce((s, c) => s + c.annualFee, 0);
      if (annualFeeBudget > 0 && totalFee > annualFeeBudget) continue;
      const delta = evalTrial.net - current.net;
      if (delta > bestDelta) {
        bestDelta = delta;
        bestCard = card;
        bestEval = evalTrial;
      }
    }
    if (!bestCard || bestDelta <= 0) break;
    selected.push(bestCard);
    remaining.splice(remaining.indexOf(bestCard), 1);
    current = bestEval;
  }
  const annualFactor = 12 / Math.max(horizonMonths, 1);
  const combination: CardCombination = {
    cards: selected.map((c) => ({ id: c.id, name: c.name, issuer: c.issuer })),
    grossAnnualReward: Math.round(current.gross * annualFactor),
    totalAnnualFee: selected.reduce((s, c) => s + c.annualFee, 0),
    netAnnualReward: Math.round(current.net * annualFactor),
    rationale: '以邊際淸貢獻質心選取；各類別依 waterfall 分配。',
  };
  return { combination, selectedIds: selected.map((c) => c.id) };
}
