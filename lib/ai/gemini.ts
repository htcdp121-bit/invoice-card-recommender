import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AggregatedInvoice, RecommendParams, CardRule, RecommendationResult } from '@/lib/types';
import { buildSystemPrompt, buildUserPrompt } from './prompts';

const MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

/**
 * 呼叫 Google AI Studio Gemini，請求以 JSON 輸出推薦組合。
 * 使用邊際貢獻規則提示，同時接收完整規則集，不進行多輪對話。
 */
export async function callGeminiRecommendation(
  agg: AggregatedInvoice,
  params: RecommendParams,
  cards: CardRule[],
): Promise<RecommendationResult> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error('Missing GOOGLE_AI_API_KEY');
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
  const result = await model.generateContent(userPrompt);
  const raw = result.response.text();
  let parsed: RecommendationResult;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error('Gemini response is not valid JSON: ' + (e instanceof Error ? e.message : String(e)));
  }
  if (!parsed.combinations || !Array.isArray(parsed.combinations)) {
    throw new Error('Gemini response missing combinations array');
  }
  return parsed;
}
