import type { RawInvoiceRow, HashedInvoiceRow } from '@/lib/types';

/**
 * 在瀨覽器端將買/卖方統一編號進行 SHA-256 hash。
 * 使用 Web Crypto API，不上傳原始識別資料。
 */
async function sha256(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashTaxIds(rows: RawInvoiceRow[]): Promise<HashedInvoiceRow[]> {
  const out: HashedInvoiceRow[] = [];
  const cache = new Map<string, string>();
  const getHash = async (id: string) => {
    if (!id) return '';
    const hit = cache.get(id);
    if (hit) return hit;
    const h = await sha256(id);
    const short = h.slice(0, 16);
    cache.set(id, short);
    return short;
  };
  for (const r of rows) {
    const sellerHash = await getHash(r.sellerTaxId);
    const buyerHash = await getHash(r.buyerTaxId);
    const { sellerTaxId, buyerTaxId, ...rest } = r;
    out.push({ ...rest, sellerHash, buyerHash });
  }
  return out;
}
