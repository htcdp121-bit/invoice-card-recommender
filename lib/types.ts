// 全局型別定義
export interface RecommendParams {
  annualFeeBudget: number;
  maxCards: number;
  horizonMonths: number;
  includeForeign: boolean;
  riskAversion: 'low' | 'mid' | 'high';
}

export interface RawInvoiceRow {
  invoiceDate: string;
  invoiceNumber: string;
  sellerTaxId: string;
  buyerTaxId: string;
  amount: number;
  category?: string;
  channel?: 'online' | 'pos' | 'foreign' | 'unknown';
}

export interface HashedInvoiceRow
  extends Omit<RawInvoiceRow, 'sellerTaxId' | 'buyerTaxId'> {
  sellerHash: string;
  buyerHash: string;
}

export interface CategorySpend {
  category: string;
  monthlyAvg: number;
  share: number;
  channelMix: { online: number; pos: number; foreign: number };
  topMerchants: Array<{ hash: string; amount: number; count: number }>;
}

export interface AggregatedInvoice {
  totalSpend: number;
  monthlyAvgSpend: number;
  monthsCovered: number;
  categories: CategorySpend[];
  generatedAt: string;
}

export interface CardRule {
  id: string;
  name: string;
  issuer: string;
  annualFee: number;
  feeWaiverRule?: string;
  baseRewardRate: number;
  categoryBonuses: Array<{
    categories: string[];
    rate: number;
    cap?: { period: 'month' | 'quarter' | 'year'; amount: number };
    requirement?: string;
  }>;
  channelBonuses?: Array<{
    channels: Array<'online' | 'pos' | 'foreign'>;
    rate: number;
    cap?: { period: 'month' | 'quarter' | 'year'; amount: number };
  }>;
  notes?: string;
}

/**
 * 單張卡在推薦結果中的詳細欄位（供前端五區塊顯示）。
 * AI 即時查詢時會填齊 officialUrl / promotionPeriod / benefits / personalizedReason；
 * 本地 fallback 則限於資料庫現有欄位，部分欄位可能為 undefined。
 */
export interface RecommendedCard {
  id?: string;
  name: string;
  issuer: string;
  annualFee?: number;
  feeWaiverRule?: string;
  /** 官方介紹頁面 URL（由 AI 即時搜尋取得） */
  officialUrl?: string;
  /** 線上申辦連結（若有） */
  applyUrl?: string;
  /** 人類可讀的優惠期限說明，例：2026/01/01 – 2026/12/31，或「長期有效」 */
  promotionPeriod?: string;
  /** 結構化優惠項目列表 */
  benefits?: Array<{
    title: string;
    detail: string;
    cap?: string;
    requirement?: string;
  }>;
  /** 針對本使用者消費結構的個人化推薦理由 */
  personalizedReason?: string;
  /** 警語與提醒（如：頻繁上限、指定連鎖限定等） */
  warnings?: string[];
}

export interface CardCombination {
  /** 推薦的卡片列表（含全部詳細欄位） */
  cards: RecommendedCard[];
  /** 年化總回饋（未扱年費）；即時查詢時可能為 0 或 undefined */
  grossAnnualReward?: number;
  totalAnnualFee?: number;
  netAnnualReward?: number;
  /** 組合層級的總體推薦理由（選填） */
  rationale?: string;
  warnings?: string[];
}

export interface RecommendationResult {
  combinations: CardCombination[];
  disclaimer?: string;
  jobId?: string;
  /** AI 來源標示：gemini = 即時查詢 / fallback = 本地保底 */
  source?: 'gemini' | 'fallback';
  /** 即時搜尋來源引用（grounding metadata） */
  sources?: Array<{ title?: string; uri?: string }>;
  /** 資料參考日期（AI 提供或伺服器產生） */
  generatedAt?: string;
}

export interface JobRecord {
  id: string;
  status: 'pending' | 'running' | 'done' | 'error';
  params: RecommendParams;
  result?: RecommendationResult;
  error?: string;
  createdAt: string;
  updatedAt: string;
}
