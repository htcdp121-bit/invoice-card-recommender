import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  AggregatedInvoice,
  RecommendParams,
  CardRule,
  RecommendationResult,
} from '@/lib/types';
import { buildSystemPrompt, buildUserPrompt } from './prompts';

/**
 * 備選模型清單：限為 2 個以內，以免 Vercel Hobby 計畫 60s timeout 被追梳。
 */
function modelCandidates(): string[] {
  const env = process.env.GEMINI_MODEL;
  if (env) return [env, 'gemini-flash-latest'].filter((v, i, a) => a.indexOf(v) === i).slice(0, 2);
  return ['gemini-2.5-flash', 'gemini-flash-latest'];
}

/**
 * 以 Google Search grounding 呼叫 Gemini，讓模型即時查詢台灣信用卡實際優惠。
 * 為避免 Vercel function 超時，最多嘗試 2 個模型，每個 1 次；重試限制在 timeout 內完成。
 * 第 14 次更新：將 params.maxCards 傳入 buildSystemPrompt 作為硬指令。
 */
export async function callGeminiRecommendation(
  agg: AggregatedInvoice,
  params: RecommendParams,
  cards: CardRule[],
): Promise<RecommendationResult> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    console.error('[gemini] Missing GOOGLE_AI_API_KEY env');
    throw new Error('Missing GOOGLE_AI_API_KEY');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const userPrompt = buildUserPrompt(agg, params, cards);
  const candidates = modelCandidates();
  console.log('[gemini] candidates=', candidates.join(','), 'maxCards=', params.maxCards);

  let lastErr: unknown = new Error('No model attempted');
  for (let i = 0; i < candidates.length; i++) {
    const modelName = candidates[i];
    try {
      console.log(`[gemini] try ${modelName}`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: buildSystemPrompt(params.maxCards),
        generationConfig: { temperature: 0.4 },
        tools: [{ googleSearch: {} } as any],
      });
      const response: any = await model.generateContent(userPrompt);
      const raw: string = response.response.text();

      const sources: Array<{ title?: string; uri?: string }> = [];
      try {
        const cand = response.response?.candidates || [];
        const meta = cand[0]?.groundingMetadata;
        const chunks = meta?.groundingChunks || [];
        for (const ch of chunks) {
          const web = ch.web;
          if (web?.uri) sources.push({ title: web.title, uri: web.uri });
        }
      } catch (e) {
        console.warn('[gemini] grounding metadata parse failed:', e);
      }

      const json = extractJson(raw);
      if (!json) {
        console.error('[gemini] No JSON found. raw head:', raw.slice(0, 300));
        throw new Error('Gemini response did not contain JSON');
      }
      let parsed: any;
      try {
        parsed = JSON.parse(json);
      } catch (e) {
        console.error('[gemini] JSON parse failed. head:', json.slice(0, 300));
        throw new Error(
          'Gemini response JSON parse failed: ' +
            (e instanceof Error ? e.message : String(e)),
        );
      }
      if (!parsed.combinations || !Array.isArray(parsed.combinations)) {
        console.error(
          '[gemini] Missing combinations array. keys:',
          Object.keys(parsed || {}),
        );
        throw new Error('Gemini response missing combinations array');
      }
      console.log(
        '[gemini] success model=',
        modelName,
        'combos=',
        parsed.combinations.length,
        'sources=',
        sources.length,
        'firstComboCards=',
        parsed.combinations[0]?.cards?.length ?? 0,
      );
      return {
        combinations: parsed.combinations,
        disclaimer: parsed.disclaimer,
        sources,
        generatedAt: new Date().toISOString(),
      } as RecommendationResult;
    } catch (e) {
      lastErr = e;
      const msg = e instanceof Error ? e.message : String(e);
      const isTransient = /429|503|RESOURCE_EXHAUSTED|UNAVAILABLE/i.test(msg);
      console.error(
        `[gemini] ${modelName} failed (transient=${isTransient}):`,
        msg.slice(0, 200),
      );
      if (!isTransient) break; // 非短暫錯誤不換模型
    }
  }

  const msg = lastErr instanceof Error ? lastErr.message : String(lastErr);
  throw new Error('Gemini call failed (all candidates): ' + msg);
}

function extractJson(text: string): string | null {
  if (!text) return null;
  const trimmed = text.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed;
  const codeFence = /\`\`\`(?:json)?\s*([\s\S]*?)\`\`\`/i.exec(text);
  if (codeFence && codeFence[1]) {
    const inner = codeFence[1].trim();
    if (inner.startsWith('{')) return inner;
  }
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first >= 0 && last > first) return text.slice(first, last + 1).trim();
  return null;
}
