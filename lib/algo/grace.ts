import type { CardRule } from '@/lib/types';

/**
 * 讀取卡片規則中合資格門檻（grace）設定，例如「本期使用滿 X 筆才適用、
 * 下期未達標則退到基本回饋」。
 * 本函數在邊際貢獻回測下，計算某條 bonus 是否達標。
 */
export function isBonusUnlocked(
  requirement: string | undefined,
  monthlySpendOnCard: number,
): boolean {
  if (!requirement) return true;
  const m = requirement.match(/(\d+)/);
  if (!m) return true;
  const threshold = Number(m[1]);
  return monthlySpendOnCard >= threshold;
}

export function effectiveBaseRate(card: CardRule): number {
  return card.baseRewardRate ?? 0;
}
