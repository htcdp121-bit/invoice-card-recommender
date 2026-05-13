import type { RecommendedCard } from '@/lib/types';

/**
 * 銀行信用卡總覽頁 fallback：當深連結驗證失敗時，自動降級到該銀行的卡片總覽頁。
 */
const ISSUER_OVERVIEW_MAP: Array<{ keywords: string[]; overview: string }> = [
  { keywords: ['國泰世華', 'CUBE', 'Cathay'], overview: 'https://www.cathaybk.com.tw/cathaybk/personal/credit-card/' },
  { keywords: ['永豐', 'DAWHO', 'SinoPac'], overview: 'https://bank.sinopac.com/personal/credit-card/' },
  { keywords: ['滙豐', '汇丰', 'HSBC'], overview: 'https://www.hsbc.com.tw/credit-cards/' },
  { keywords: ['台新', 'Richart', 'Taishin'], overview: 'https://www.taishinbank.com.tw/personal/credit-cards/' },
  { keywords: ['玉山', 'E.SUN', 'ESun', 'ESUN'], overview: 'https://www.esunbank.com/personal/credit-card' },
  { keywords: ['中信', '中國信託', 'CTBC'], overview: 'https://www.ctbcbank.com/twrbo/zh_tw/personal_index/per_cc.html' },
  { keywords: ['富邦', 'Fubon'], overview: 'https://www.fubon.com/banking/personal/credit_card/intro/index.htm' },
  { keywords: ['兆豐', 'Mega'], overview: 'https://www.megabank.com.tw/personal/credit-card' },
  { keywords: ['第一銀行', '第一', 'First Bank'], overview: 'https://www.firstbank.com.tw/sites/twn/personal/credit-card' },
  { keywords: ['華南', 'Hua Nan'], overview: 'https://www.hncb.com.tw/wps/portal/HNCB/Personal/CreditCard' },
  { keywords: ['星展', 'DBS'], overview: 'https://www.dbs.com.tw/personal/cards/default.page' },
  { keywords: ['渣打', 'Standard Chartered'], overview: 'https://www.sc.com/tw/credit-cards/' },
  { keywords: ['花旗', 'Citi'], overview: 'https://www.citibank.com.tw/sim/creditcard/' },
  { keywords: ['遠東', 'FEIB'], overview: 'https://www.feib.com.tw/personal/credit-card/' },
  { keywords: ['新光', 'Shin Kong', 'SKB'], overview: 'https://www.skbank.com.tw/2017/PERSONAL/CARD/' },
  { keywords: ['上海商銀', 'SCSB'], overview: 'https://www.scsb.com.tw/content/personal/personal02_1.jsp' },
  { keywords: ['彰銀', '彰化銀行'], overview: 'https://www.chb.com.tw/wps/portal/CHB/PFM/CreditCardOnline' },
  { keywords: ['合作金庫', 'TCB'], overview: 'https://www.tcb-bank.com.tw/personal-banking/credit-card' },
  { keywords: ['LINE Bank', 'LINE Pay'], overview: 'https://www.linebank.com.tw/' },
];

/** URL 黑名單關鍵字：實際打開後 redirect 到這些路徑就視為失效。 */
const BLACKLIST_PATTERNS = [
  /\/maintenance-page\//i,
  /\/error\//i,
  /\/404/i,
  /\/notfound/i,
  /\/sinopacBT\/index\.html/i,
  /\/index\.html$/i,
  /\/index\.htm$/i,
];

interface VerifyOutcome {
  ok: boolean;
  finalUrl?: string;
  reason?: string;
}

/** 對單一 URL 做 GET 驗證（含 timeout、follow redirect、黑名單檢查）。 */
async function verifyOneUrl(url: string, timeoutMs = 3000): Promise<VerifyOutcome> {
  if (!url) return { ok: false, reason: 'empty' };
  if (!/^https?:\/\//i.test(url)) return { ok: false, reason: 'invalid scheme' };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: ctrl.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'zh-TW,zh;q=0.9',
      },
    });
    const finalUrl = res.url || url;
    if (res.status >= 400) return { ok: false, finalUrl, reason: 'http ' + res.status };
    for (const re of BLACKLIST_PATTERNS) {
      if (re.test(finalUrl)) return { ok: false, finalUrl, reason: 'blacklisted redirect' };
    }
    return { ok: true, finalUrl };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, reason: msg };
  } finally {
    clearTimeout(timer);
  }
}

function pickOverview(card: RecommendedCard): string | null {
  const combined = (card.issuer + ' ' + card.name).toLowerCase();
  for (const entry of ISSUER_OVERVIEW_MAP) {
    const hit = entry.keywords.some((k) => combined.includes(k.toLowerCase()));
    if (hit) return entry.overview;
  }
  return null;
}

/**
 * 對所有卡片的 officialUrl / applyUrl 做平行驗證，並做必要 fallback。
 */
export async function verifyAndFallbackUrls(
  cards: RecommendedCard[],
): Promise<{
  cards: RecommendedCard[];
  stats: { okCount: number; fallbackCount: number; nullCount: number };
}> {
  const tasks: Array<Promise<RecommendedCard>> = cards.map(async (card) => {
    const next: RecommendedCard = { ...card };
    const overview = pickOverview(card);

    if (next.officialUrl) {
      const r = await verifyOneUrl(next.officialUrl);
      if (!r.ok) {
        if (overview) {
          next.officialUrl = overview;
          next.officialUrlNote = '此為銀行信用卡總覽頁（深連結未驗證通過）';
        } else {
          next.officialUrlNote = '此連結未驗證通過，請以銀行官網為準';
        }
      }
    } else if (overview) {
      next.officialUrl = overview;
      next.officialUrlNote = '此為銀行信用卡總覽頁（AI 未提供深連結）';
    }

    if (next.applyUrl) {
      const r = await verifyOneUrl(next.applyUrl);
      if (!r.ok) {
        if (overview) {
          next.applyUrl = overview;
          next.applyUrlNote = '此為銀行信用卡總覽頁（申辦頁深連結未驗證通過）';
        } else {
          next.applyUrlNote = '此連結未驗證通過，請以銀行官網為準';
        }
      }
    } else if (overview && next.officialUrl !== overview) {
      next.applyUrl = overview;
      next.applyUrlNote = '此為銀行信用卡總覽頁（AI 未提供申辦頁）';
    }

    return next;
  });

  const updated = await Promise.all(tasks);

  let okCount = 0;
  let fallbackCount = 0;
  let nullCount = 0;
  for (const c of updated) {
    if (c.officialUrlNote || c.applyUrlNote) fallbackCount += 1;
    else if (c.officialUrl) okCount += 1;
    else nullCount += 1;
  }

  return { cards: updated, stats: { okCount, fallbackCount, nullCount } };
}
