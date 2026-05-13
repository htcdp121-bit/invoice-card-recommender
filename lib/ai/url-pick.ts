import type { RecommendedCard } from '@/lib/types';

/**
 * 銀行域名 mapping：用於從 grounding sources 中過濾出該銀行的真實 URL。
 */
const ISSUER_DOMAIN_MAP: Array<{ keywords: string[]; domains: string[] }> = [
  { keywords: ['國泰世華', 'CUBE', 'Cathay'], domains: ['cathaybk.com.tw'] },
  { keywords: ['永豐', 'DAWHO', 'SinoPac'], domains: ['bank.sinopac.com', 'sinopac.com'] },
  { keywords: ['滙豐', '汇丰', 'HSBC'], domains: ['hsbc.com.tw'] },
  { keywords: ['台新', 'Richart', 'Taishin'], domains: ['taishinbank.com.tw'] },
  { keywords: ['玉山', 'E.SUN', 'ESun', 'ESUN'], domains: ['esunbank.com'] },
  { keywords: ['中信', '中國信託', 'CTBC'], domains: ['ctbcbank.com'] },
  { keywords: ['富邦', 'Fubon'], domains: ['fubon.com'] },
  { keywords: ['兆豐', 'Mega'], domains: ['megabank.com.tw'] },
  { keywords: ['第一銀行', '第一', 'First Bank'], domains: ['firstbank.com.tw'] },
  { keywords: ['華南', 'Hua Nan'], domains: ['hncb.com.tw'] },
  { keywords: ['星展', 'DBS'], domains: ['dbs.com.tw', 'dbs.com'] },
  { keywords: ['渣打', 'Standard Chartered'], domains: ['standardchartered.com.tw', 'sc.com'] },
  { keywords: ['花旗', 'Citi'], domains: ['citibank.com.tw'] },
  { keywords: ['遠東', 'FEIB'], domains: ['feib.com.tw'] },
  { keywords: ['新光', 'Shin Kong', 'SKB'], domains: ['skbank.com.tw'] },
  { keywords: ['上海商銀', 'SCSB'], domains: ['scsb.com.tw'] },
  { keywords: ['彰銀', '彰化銀行'], domains: ['chb.com.tw'] },
  { keywords: ['合作金庫', 'TCB'], domains: ['tcb-bank.com.tw'] },
  { keywords: ['土地銀行', '土銀'], domains: ['landbank.com.tw'] },
  { keywords: ['台灣銀行', '台銀'], domains: ['bot.com.tw'] },
  { keywords: ['LINE Bank', 'LINE Pay'], domains: ['linebank.com.tw'] },
];

export interface GroundingSource {
  title?: string;
  uri?: string;
}

function getHost(url: string): string {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return '';
  }
}

function matchIssuerDomain(card: RecommendedCard, host: string): boolean {
  const combined = (card.issuer + ' ' + card.name).toLowerCase();
  for (const entry of ISSUER_DOMAIN_MAP) {
    const hit = entry.keywords.some((k) => combined.includes(k.toLowerCase()));
    if (hit) {
      return entry.domains.some((d) => host.endsWith(d));
    }
  }
  return false;
}

/**
 * 在 grounding sources 中尋找最匹配此卡的真實 URL。
 */
export function pickRealUrlFromSources(
  card: RecommendedCard,
  sources: GroundingSource[],
): string | null {
  if (!sources || sources.length === 0) return null;

  const sameIssuer = sources.filter((s) => {
    const host = getHost(s.uri || '');
    return host && matchIssuerDomain(card, host);
  });
  if (sameIssuer.length === 0) return null;

  const tokens = (card.name + ' ' + (card.issuer || ''))
    .split(/[\s\-()（），,／/]+/)
    .filter((t) => /^[A-Za-z]{3,}$/.test(t))
    .map((t) => t.toLowerCase());

  if (tokens.length > 0) {
    const byName = sameIssuer.find((s) => {
      const blob = ((s.title || '') + ' ' + (s.uri || '')).toLowerCase();
      return tokens.some((t) => blob.includes(t));
    });
    if (byName && byName.uri) return byName.uri;
  }

  return sameIssuer[0].uri || null;
}

/**
 * 對整份 result 的所有卡的 officialUrl / applyUrl 嘗試以 grounding sources
 * 蓋寫成更可信的真實 URL（C 層）。
 */
export function overrideUrlsWithSources(
  cards: RecommendedCard[],
  sources: GroundingSource[],
): { cards: RecommendedCard[]; overrideCount: number } {
  let overrideCount = 0;
  const updated = cards.map((card) => {
    const pick = pickRealUrlFromSources(card, sources);
    if (!pick) return card;
    const next: RecommendedCard = { ...card };
    let didOverride = false;
    if (next.officialUrl !== pick) {
      next.officialUrl = pick;
      didOverride = true;
    }
    if (!next.applyUrl || next.applyUrl !== pick) {
      next.applyUrl = pick;
    }
    if (didOverride) overrideCount += 1;
    return next;
  });
  return { cards: updated, overrideCount };
}
