import type { RawInvoiceRow } from '@/lib/types';
import { classifyByTaxId } from '@/lib/csv/taxid-classifier';
import { classifyByMerchant } from '@/lib/csv/aggregator';

/**
 * 解析財政部電子發票 CSV（區分 M / D / E 記錄型態）
 *
 * 欄位規格（pipe-separated）：
 *   M 主檔（每張發票一行）：
 *     cols[0]=M, cols[1]=載具名稱, cols[2]=載具號碼, cols[3]=發票日期,
 *     cols[4]=賣方統編, cols[5]=商店店名, cols[6]=發票號碼, cols[7]=總金額,
 *     cols[8]=發票狀態
 *   D 明細檔（每筆品項一行）：
 *     cols[0]=D, cols[1]=載具名稱, cols[2]=載具號碼, cols[3]=發票號碼,
 *     cols[4]=小計金額, cols[5]=品項名稱, ...
 *
 * 重要：本 parser 僅處理 M 行（避免 D 行金額重複累加）。
 * 分類優先序：
 *   1. classifyByTaxId(sellerTaxId) 命中 → 用 TAXID 表結果
 *   2. fallback：classifyByMerchant(merchantName) 用中文店名 keyword
 *   3. 仍未命中 → 留 undefined，下游歸入「其他」
 */
export async function parseInvoiceCsv(text: string): Promise<RawInvoiceRow[]> {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const rows: RawInvoiceRow[] = [];
  for (const line of lines) {
    const cols = line.split('|').map((c) => c.trim());
    if (cols.length < 8) continue;
    const tag = cols[0];
    // 只處理 M 行：M 已含發票總金額，D 行重複累加會雙計
    if (tag !== 'M') continue;
    const invoiceDate = cols[3] || '';
    const sellerTaxId = cols[4] || '';
    const merchantName = cols[5] || '';
    const invoiceNumber = cols[6] || '';
    const amount = Number(cols[7] || 0);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    const buyerTaxId = cols[9] || '';

    // 雙層分類：先用統編字典查精準對應，未命中則用店名 keyword fallback
    let category: string | undefined;
    let channel: 'online' | 'pos' | 'foreign' | 'unknown' = 'unknown';
    const taxCls = classifyByTaxId(sellerTaxId);
    if (taxCls) {
      category = taxCls.category;
      channel = taxCls.channel ?? 'unknown';
    } else if (merchantName) {
      const merchantCat = classifyByMerchant(merchantName);
      if (merchantCat && merchantCat !== '其他') {
        category = merchantCat;
        channel = 'pos';
      }
    }

    rows.push({
      invoiceDate,
      invoiceNumber,
      sellerTaxId,
      buyerTaxId,
      amount,
      category,
      channel,
    });
  }
  return rows;
}
