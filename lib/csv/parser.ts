import type { RawInvoiceRow } from '@/lib/types';
import { classifyByTaxId } from '@/lib/csv/taxid-classifier';

/**
 * 解析財政部電子發票 CSV（區分 M / D / E 記錄型態）
 * 輸入在瀨覽器端処理，不上傳原始識別資料。
 * 在 hash 之前依 sellerTaxId 查表分類，避免分類資訊在 hash 階段消失。
 */
export async function parseInvoiceCsv(text: string): Promise<RawInvoiceRow[]> {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const rows: RawInvoiceRow[] = [];
  for (const line of lines) {
    const cols = line.split('|').map((c) => c.trim());
    if (cols.length < 7) continue;
    const tag = cols[0];
    if (tag !== 'M' && tag !== 'D') continue;
    const invoiceDate = cols[3] || '';
    const sellerTaxId = cols[4] || '';
    const buyerTaxId = cols[5] || '';
    const invoiceNumber = cols[6] || '';
    const amount = Number(cols[7] || 0);
    if (!Number.isFinite(amount)) continue;
    const cls = classifyByTaxId(sellerTaxId);
    rows.push({
      invoiceDate,
      invoiceNumber,
      sellerTaxId,
      buyerTaxId,
      amount,
      category: cls?.category,
      channel: cls?.channel ?? 'unknown',
    });
  }
  return rows;
}
