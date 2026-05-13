import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/client';
import { callGeminiRecommendation } from '@/lib/ai/gemini';
import { localBacktest } from '@/lib/algo/backtest';
import { overrideUrlsWithSources } from '@/lib/ai/url-pick';
import { verifyAndFallbackUrls } from '@/lib/ai/url-verify';
import type {
  AggregatedInvoice,
  RecommendParams,
  CardRule,
  JobRecord,
  RecommendedCard,
} from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface PostBody {
  aggregated: AggregatedInvoice;
  params: RecommendParams;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PostBody;
    if (!body || !body.aggregated || !body.params) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const supabase = getServerSupabase();

    const { data: cards, error: cardsError } = await supabase
      .from('card_rules')
      .select('*');
    if (cardsError) throw cardsError;
    const cardRules = ((cards || []) as any[]).map((c) => ({
      id: c.id,
      name: c.name,
      issuer: c.issuer,
      annualFee: c.annual_fee ?? 0,
      baseRewardRate: c.base_reward_rate ?? 0,
      categoryBonuses: c.category_bonuses ?? [],
      channelBonuses: c.channel_bonuses ?? [],
      notes: c.notes,
    })) as CardRule[];
    console.log('[recommend] cards loaded:', cardRules.length);

    const jobId = crypto.randomUUID();
    const now = new Date().toISOString();
    const initialJob: JobRecord = {
      id: jobId,
      status: 'running',
      params: body.params,
      createdAt: now,
      updatedAt: now,
    };
    await supabase.from('jobs').insert(initialJob);

    let result: any;
    let fallbackReason: string | null = null;
    try {
      result = await callGeminiRecommendation(body.aggregated, body.params, cardRules);
      result.source = 'gemini';
    } catch (err) {
      fallbackReason = err instanceof Error ? err.message : String(err);
      console.error('[recommend] Falling back to localBacktest. reason:', fallbackReason);
      result = localBacktest(body.aggregated, body.params, cardRules);
      result.disclaimer =
        (result.disclaimer || '') +
        ' （AI 推薦不可用，本次以本地保底邊際貢獻回測產出；原因：' +
        fallbackReason +
        '）';
      result.source = 'fallback';
    }

    // ====== URL 反幻覺三層處理（AI 推薦才需要） ======
    if (result.source === 'gemini' && Array.isArray(result.combinations)) {
      const sources = (result.sources || []) as Array<{ title?: string; uri?: string }>;
      let totalOverride = 0;
      const verifyStats: Array<{ ok: number; fb: number; nu: number }> = [];

      for (const combo of result.combinations) {
        if (!Array.isArray(combo.cards)) continue;

        // C 層：用 grounding sources 蓋寫 AI 給的 URL
        const picked = overrideUrlsWithSources(combo.cards as RecommendedCard[], sources);
        totalOverride += picked.overrideCount;

        // B 層：對覆蓋後的 URL 做 HEAD 驗證 + 銀行總覽頁 fallback
        const verified = await verifyAndFallbackUrls(picked.cards);
        combo.cards = verified.cards;
        verifyStats.push({
          ok: verified.stats.okCount,
          fb: verified.stats.fallbackCount,
          nu: verified.stats.nullCount,
        });
      }
      console.log(
        '[recommend] url-pipeline override=',
        totalOverride,
        ' verifyStats=',
        JSON.stringify(verifyStats),
      );
    }

    result.jobId = jobId;
    await supabase
      .from('jobs')
      .update({ status: 'done', result, updatedAt: new Date().toISOString() })
      .eq('id', jobId);

    return NextResponse.json({ jobId, result }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[recommend] fatal:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
