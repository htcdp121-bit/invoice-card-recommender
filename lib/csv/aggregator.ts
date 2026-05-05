import type { HashedInvoiceRow, AggregatedInvoice, CategorySpend } from '@/lib/types';

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  '餐飲': ['餐', '食', '咖啡', '快餐', '餐廳', '薯條', '烘焙'],
  '超商量販': ['7-ELEVEN', '全家', 'OK超商', 'Costco', '家樂福', '全聯', '量販'],
  '交通': ['高講', '台鐵', '足講', '捷運', '油', 'UBER', 'Uber'],
  '網路購物': ['網', '趨趨', 'momo', 'PChome', 'Yahoo', '蝦皮'],
  '娛樂訂閱': ['Netflix', 'Spotify', 'YouTube', 'Apple', 'Google', '電影'],
  '旅遊住宿': ['航空', '飯店', '酒店', '旅餺', '旅行'],
};

export function classifyByMerchant(merchant: string | undefined): string {
  if (!merchant) return '其他';
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    if (kws.some((kw) => merchant.includes(kw))) return cat;
  }
  return '其他';
}

export function aggregateByCategory(rows: HashedInvoiceRow[]): AggregatedInvoice {
  if (rows.length === 0) {
    return {
      totalSpend: 0,
      monthlyAvgSpend: 0,
      monthsCovered: 0,
      categories: [],
      generatedAt: new Date().toISOString(),
    };
  }
  const months = new Set<string>();
  const totals = new Map<string, { sum: number; merchants: Map<string, { amount: number; count: number }>; ch: { online: number; pos: number; foreign: number } }>();
  let totalSpend = 0;
  for (const r of rows) {
    const cat = r.category || '其他';
    const ym = (r.invoiceDate || '').slice(0, 7);
    if (ym) months.add(ym);
    totalSpend += r.amount;
    if (!totals.has(cat)) totals.set(cat, { sum: 0, merchants: new Map(), ch: { online: 0, pos: 0, foreign: 0 } });
    const bucket = totals.get(cat)!;
    bucket.sum += r.amount;
    const m = bucket.merchants.get(r.sellerHash) || { amount: 0, count: 0 };
    m.amount += r.amount;
    m.count += 1;
    bucket.merchants.set(r.sellerHash, m);
    if (r.channel === 'online') bucket.ch.online += r.amount;
    else if (r.channel === 'foreign') bucket.ch.foreign += r.amount;
    else bucket.ch.pos += r.amount;
  }
  const monthsCovered = Math.max(months.size, 1);
  const categories: CategorySpend[] = Array.from(totals.entries()).map(([category, b]) => {
    const top = Array.from(b.merchants.entries())
      .map(([hash, v]) => ({ hash, amount: v.amount, count: v.count }))
      .sort((a, c) => c.amount - a.amount)
      .slice(0, 5);
    return {
      category,
      monthlyAvg: b.sum / monthsCovered,
      share: totalSpend > 0 ? b.sum / totalSpend : 0,
      channelMix: {
        online: b.sum > 0 ? b.ch.online / b.sum : 0,
        pos: b.sum > 0 ? b.ch.pos / b.sum : 0,
        foreign: b.sum > 0 ? b.ch.foreign / b.sum : 0,
      },
      topMerchants: top,
    };
  });
  categories.sort((a, b) => b.monthlyAvg - a.monthlyAvg);
  return {
    totalSpend,
    monthlyAvgSpend: totalSpend / monthsCovered,
    monthsCovered,
    categories,
    generatedAt: new Date().toISOString(),
  };
}
