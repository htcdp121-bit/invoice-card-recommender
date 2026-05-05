import type { CardRule } from '@/lib/types';

/**
 * 計算上限（cap）下的實際可認列金額。
 * 在邊際貢獻回測中，任何一條 cap 滿則不再計反動。
 */
export function applyCap(
  amount: number,
  cap: { period: 'month' | 'quarter' | 'year'; amount: number } | undefined,
  horizonMonths: number,
): number {
  if (!cap) return amount;
  const periods = cap.period === 'month' ? horizonMonths : cap.period === 'quarter' ? Math.ceil(horizonMonths / 3) : Math.ceil(horizonMonths / 12);
  const totalCap = cap.amount * periods;
  return Math.min(amount, totalCap);
}

/**
 * 估計一張卡在 horizon 期間的列金上限总和。
 */
export function totalCapForCard(card: CardRule, horizonMonths: number): number {
  let total = 0;
  for (const b of card.categoryBonuses) {
    if (b.cap) total += applyCap(Number.POSITIVE_INFINITY, b.cap, horizonMonths);
  }
  for (const b of card.channelBonuses || []) {
    if (b.cap) total += applyCap(Number.POSITIVE_INFINITY, b.cap, horizonMonths);
  }
  return total;
}
