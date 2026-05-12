import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  AggregatedInvoice,
  RecommendParams,
  CardRule,
  RecommendationResult,
} from '@/lib/types';
import { buildSystemPrompt, buildUserPrompt } from './prompts';

const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

/**
 * 以 Google Search grounding 呼叫 Gemini，讓模型即時查詢台灣信用卡實際優惠。
 * 因為 grounding tool 與 responseMimeType:'application/json' 不相容，
 * 模型回傳為 Markdown-wrapped JSON / 混文本，此處需 robust 解析。
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

  console.log('[gemini] calling model', MODEL, 'fallbackCards=', cards.length);
  const genAI = new GoogleGenerativeAI(apiKey);

  // 啟用 Google Search grounding；不設 responseMimeType 以避免 API 術突
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: buildSystemPrompt(),
    generationConfig: {
      temperature: 0.4,
    },
    tools: [{ googleSearch: {} } as any],
  });

  const userPrompt = buildUserPrompt(agg, params, cards);

  let response: any;
  try {
    response = await model.generateContent(userPrompt);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[gemini] generateContent failed:', msg);
    throw new Error('Gemini call failed: ' + msg);
  }

  const raw: string = response.response.text();
  // 取出 grounding metadata 來源
  const sources: Array<{ title?: string; uri?: string }> = [];
  try {
    const candidates = response.response?.candidates || [];
    const meta = candidates[0]?.groundingMetadata;
    const chunks = meta?.groundingChunks || [];
    for (const ch of chunks) {
      const web = ch.web;
      if (web?.uri) sources.push({ title: web.title, uri: web.uri });
    }
  } catch (e) {
    console.warn('[gemini] grounding metadata parse failed:', e);
  }

  // 從回覆中抽出 JSON（可能被 ```json ... ``` 包裹）
  const json = extractJson(raw);
  if (!json) {
    console.error('[gemini] No JSON found. raw head:', raw.slice(0, 500));
    throw new Error('Gemini response did not contain JSON');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    console.error('[gemini] JSON parse failed. extracted head:', json.slice(0, 500));
    throw new Error(
      'Gemini response JSON parse failed: ' + (e instanceof Error ? e.message : String(e)),
    );
  }

  if (!parsed.combinations || !Array.isArray(parsed.combinations)) {
    console.error('[gemini] Missing combinations array. parsed keys:', Object.keys(parsed || {}));
    throw new Error('Gemini response missing combinations array');
  }

  console.log('[gemini] success, combinations=', parsed.combinations.length, 'sources=', sources.length);

  return {
    combinations: parsed.combinations,
    disclaimer: parsed.disclaimer,
    sources,
    generatedAt: new Date().toISOString(),
  } as RecommendationResult;
}

/**
 * 從模型回覆中抽取 JSON。支援：
 *  - 純 JSON
 *  - ```json ... ``` 包裹
 *  - 夾雜在文字中的第一個 { ... } 區塊
 */
function extractJson(text: string): string | null {
  if (!text) return null;
  const trimmed = text.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed;
  const codeFence = /```(?:json)?s*([sS]*?)```/i.exec(text);
  if (codeFence && codeFence[1]) {
    const inner = codeFence[1].trim();
    if (inner.startsWith('{')) return inner;
  }
  // fallback：抓第一個 { 起、最後一個 } 結
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first >= 0 && last > first) {
    return text.slice(first, last + 1).trim();
  }
  return null;
}
