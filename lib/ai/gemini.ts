import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  AggregatedInvoice,
  RecommendParams,
  CardRule,
  RecommendationResult,
} from '@/lib/types';
import { buildSystemPrompt, buildUserPrompt } from './prompts';

/**
 * 模型備選順序：考慮 free-tier RPM/RPD 與 503 的能邱性，依序嘗試，
 * 遇到 429/503 會随機退讓到下一個模型。可透過 GEMINI_MODEL 環境變數見位這個順序之首。
 */
function modelCandidates(): string[] {
  const env = process.env.GEMINI_MODEL;
  const base = [
    'gemini-2.5-flash',
    'gemini-flash-latest',
    'gemini-2.5-flash-lite',
  ];
  if (env && !base.includes(env)) return [env, ...base];
  if (env) return [env, ...base.filter((m) => m !== env)];
  return base;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * 以 Google Search grounding 呼叫 Gemini，讓模型即時查詢台灣信用卡實際優惠。
 * 使用模型備選順序 + 重試以避免單一模型被 quota/overload 阫住。
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
  console.log('[gemini] candidates=', candidates.join(','));

  let lastErr: unknown = new Error('No model attempted');
  for (let i = 0; i < candidates.length; i++) {
    const modelName = candidates[i];
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: buildSystemPrompt(),
      generationConfig: { temperature: 0.4 },
      tools: [{ googleSearch: {} } as any],
    });

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        console.log(`[gemini] try ${modelName} attempt#${attempt + 1}`);
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
        const isRateLimit = /429|503|RESOURCE_EXHAUSTED|UNAVAILABLE/i.test(msg);
        console.error(
          `[gemini] ${modelName} attempt#${attempt + 1} failed (rateLimit=${isRateLimit}):`,
          msg.slice(0, 200),
        );
        if (!isRateLimit) break; // 非限流錯誤不重試，換下一個模型
        if (attempt === 0) await sleep(1500); // 1.5s 后重試同一模型一次
      }
    }
  }

  const msg = lastErr instanceof Error ? lastErr.message : String(lastErr);
  throw new Error('Gemini call failed (all candidates): ' + msg);
}

/**
 * 從模型回覆中抽取 JSON。支援 純JSON / \`\`\`json包裹 / 夾雜中間。
 */
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
