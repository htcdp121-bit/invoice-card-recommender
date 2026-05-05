import type { CardRule, CategorySpend } from '@/lib/types';
import { applyCap } from './cap';

/**
 * Waterfall 分配：在多張卡中，逐個分類選出狀態下可提供最高邊際回饋率的卡片，
 * 並依上限進行分配，超出部分退到下一個選項。
 */
export interface CardAllocation {
  cardId: string;
  category: string;
  amount: number;
  rate: number;
  reward: number;
}

export function bestRateForCategory(card: CardRule, category: CategorySpend): number {
  let best = card.baseRewardRate;
  for (const b of card.categoryBonuses) {
    if (b.categories.includes(category.category)) best = Math.max(best, b.rate);
  }
  return best;
}

export function waterfall(
  cards: CardRule[],
  categories: CategorySpend[],
  horizonMonths: number,
): CardAllocation[] {
  const remainingCaps = new Map<string, Map<string, number>>();
  for (const card of cards) {
    const m = new Map<string, number>();
    for (const b of card.categoryBonuses) {
      const cap = b.cap ? applyCap(Number.POSITIVE_INFINITY, b.cap, horizonMonths) : Number.POSITIVE_INFINITY;
      for (const cat of b.categories) m.set(cat, cap);
    }
    remainingCaps.set(card.id, m);
  }
  const out: CardAllocation[] = [];
  for (const cat of categories) {
    let remainingSpend = cat.monthlyAvg * horizonMonths;
    while (remainingSpend > 0) {
      let bestCard: CardRule | null = null;
      let bestRate = 0;
      for (const card of cards) {
        const rate = bestRateForCategory(card, cat);
        const room = remainingCaps.get(card.id)?.get(cat.category) ?? Number.POSITIVE_INFINITY;
        if (room > 0 && rate > bestRate) {
          bestRate = rate;
          bestCard = card;
        }
      }
      if (!bestCard) break;
      const room = remainingCaps.get(bestCard.id)?.get(cat.category) ?? Number.POSITIVE_INFINITY;
      const allocate = Math.min(remainingSpend, room);
      out.push({
        cardId: bestCard.id,
        category: cat.category,
        amount: allocate,
        rate: bestRate,
        reward: allocate * bestRate,
      });
      const map = remainingCaps.get(bestCard.id)!;
      const newRoom = (map.get(cat.category) ?? Number.POSITIVE_INFINITY) - allocate;
      map.set(cat.category, newRoom <= 0 ? 0 : newRoom);
      remainingSpend -= allocate;
    }
  }
  return out;
}
