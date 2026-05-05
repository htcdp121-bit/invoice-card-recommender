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

export interface HashedInvoiceRow extends Omit<RawInvoiceRow, 'sellerTaxId' | 'buyerTaxId'> {
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

export interface CardCombination {
  cards: Array<{ id: string; name: string; issuer: string }>;
  grossAnnualReward: number;
  totalAnnualFee: number;
  netAnnualReward: number;
  rationale: string;
  warnings?: string[];
}

export interface RecommendationResult {
  combinations: CardCombination[];
  disclaimer?: string;
  jobId?: string;
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
