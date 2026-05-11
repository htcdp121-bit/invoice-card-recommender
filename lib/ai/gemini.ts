import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  AggregatedInvoice,
  RecommendParams,
  CardRule,
  RecommendationResult,
} from '@/lib/types';
import { buildSystemPrompt, buildUserPrompt } from './prompts';

const MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

/**
 * 呼叫 Google AI Studio Gemini，請求以 JSON 輸出推薦組合。
 * 失敗時拋例外讓上層走 fallback；同時印出詳細 log 以利在 Vercel 端排查。
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
  console.log('[gemini] calling model', MODEL, 'cards=', cards.length);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: buildSystemPrompt(),
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.3,
    },
  });

  const userPrompt = buildUserPrompt(agg, params, cards);

  let raw = '';
  try {
    const result = await model.generateContent(userPrompt);
    raw = result.response.text();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[gemini] generateContent failed:', msg);
    throw new Error('Gemini call failed: ' + msg);
  }

  let parsed: RecommendationResult;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error('[gemini] JSON parse failed. raw head:', raw.slice(0, 500));
    throw new Error(
      'Gemini response is not valid JSON: ' + (e instanceof Error ? e.message : String(e)),
    );
  }

  if (!parsed.combinations || !Array.isArray(parsed.combinations)) {
    console.error('[gemini] Missing combinations array. parsed keys:', Object.keys(parsed || {}));
    throw new Error('Gemini response missing combinations array');
  }

  console.log('[gemini] success, combinations=', parsed.combinations.length);
  return parsed;
}
