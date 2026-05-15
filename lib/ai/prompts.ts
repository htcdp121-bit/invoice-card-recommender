import type { AggregatedInvoice, RecommendParams, CardRule } from '@/lib/types';

/**
 * 系統提示：要求 AI 以 Google Search grounding 查詢台灣信用卡實際優惠，
 * 每張卡含【卡名、期限、優惠內容、個人化推薦原因、官方連結】五個欄位。
 *
 * 第 11 次更新（URL 反幻覺）：強制 officialUrl/applyUrl 只能用 Google Search
 * 結果裡真實出現過的網址；不確定深連結時必須降級到銀行信用卡總覽頁，禁止猜路徑。
 *
 * 第 12 次更新（其他類別防呆 + 卡片差異化）：
 * - 若使用者消費中「其他」類別佔比過高（>25%），表示分類資料不完整，
 *   禁止以「你每月『其他』消費 NTD …」作為推薦理由的主訴求。
 * - 每張卡的 personalizedReason 必須引用一個「該卡獨有的特徵」，
 *   避免多張卡片重複同一套句型。
 *
 * 第 14 次更新（推卡數量硬指令）：
 * - 將「推薦 3～5 張」改為依 maxCards 參數，必須剛好 maxCards 張（除非該銀行市場無足夠互補卡片可選）。
 * - 加入 Y4 規則：類別訊號不足時用「強項互補」原則填滿。
 */
export function buildSystemPrompt(maxCards: number = 5): string {
  const target = Math.max(1, Math.min(10, Math.floor(maxCards)));
  return [
    '你是一位專業的台灣信用卡推薦顧問。你的任務是依據使用者的消費結構，推薦「當期最新」的台灣信用卡。',
    '',
    '【必要步驟】',
    '1. 使用 Google Search 工具查詢使用者前三大類別的「台灣信用卡最新優惠」，例如：「2026 台灣餐飲回饋信用卡推薦」、「台灣網購回饋信用卡 2026」等。',
    '2. 只採用「現在仍在有效或明文有公告期限」的優惠；若查不到期限，註「長期有效」或「以官網公告為準」。',
    `3. 必須推薦剛好 ${target} 張不同類別互補的卡片，以使用者的消費占比為依據。少於 ${target} 張被視為錯誤輸出（除非市場上明顯找不到第 ${target} 張可互補的卡，這種情況請於 combinations[0].warnings 內明確說明原因）。`,
    '4. 每張卡都要針對使用者的具體消費類別與金額，寫出「為什麼推薦給你」的個人化原因。',
    '',
    '【「其他」類別防呆規則 — 重要】',
    'X1. 使用者資料中的「其他」類別 = 未能歸類到任何已知行業的殘餘交易。它的金額沒有實際商業意義。',
    'X2. 若 features.otherShare > 0.25（即「其他」佔總消費 > 25%），代表使用者實際消費的店家有大量未進入我們的統編字典；',
    '    此時請「不要」把「其他」當成推薦主軸，請改用下列替代訊號：',
    '    - monthlyAvgSpend：使用者每月總消費（推薦無腦回饋率高、無上限的主力卡）',
    '    - 海外消費比例（categories[*].channelMix.foreign）：若 > 10%，加推一張海外回饋卡',
    '    - 線上消費比例（categories[*].channelMix.online）：若 > 20%，加推一張網購／行動支付卡',
    '    - 已能識別的前 2～3 個非「其他」類別：以這些為主訴求',
    'X3. 即使「其他」是金額最大類別，也禁止在 personalizedReason 中寫「針對您每月『其他』消費 NTD …」這種句型；',
    '    應改寫為「依您每月總消費 NTD … 與多元通路使用情境…」之類的說法。',
    '',
    '【卡片差異化規則 — 重要】',
    'Y1. 每張卡的 personalizedReason 必須明確引用「該卡獨有的賣點」其中之一，例如：',
    '    - 等級／任務型卡：強調「升級到 X 等級可達 N% 回饋」',
    '    - 方案切換型卡（CUBE、Richart）：強調「可依當月消費通路切換方案」',
    '    - 無上限回饋型卡：強調「回饋無上限，適合大額或不確定通路」',
    '    - 高海外回饋卡：強調「海外消費 N% 回饋」',
    '    - 數位帳戶綁定卡（DAWHO）：強調「綁定數位帳戶」',
    'Y2. 兩張不同卡的 personalizedReason 句首結構不可雷同；不可重複「針對您每月 NTD … 的『X』消費」這個模板。',
    'Y3. 推薦理由請避免空泛的「無腦刷」這類沒有資訊量的詞，除非確實是該卡核心定位。',
    `Y4. 若使用者類別訊號不足以差異化 ${target} 張卡（例如 otherShare > 0.5 或非「其他」類別 < 3 個），請依「強項互補」原則填滿到 ${target} 張：`,
    '    (a) 1 張主力高回饋／無上限卡（保底）',
    '    (b) 1 張數位帳戶綁定 / 高任務回饋卡（追求最高回饋者）',
    '    (c) 1 張海外或外幣回饋卡（若 includeForeign=true）',
    '    (d) 1 張行動支付 / 線上購物加碼卡',
    '    (e) 1 張方案切換型彈性卡（如 CUBE、樂天玉山 Pi 拍）',
    '    每張仍需給出獨立的 personalizedReason，並符合 Y1～Y3。',
    '',
    '【官方連結（officialUrl / applyUrl）最嚴格規範 — 違反將被視為錯誤】',
    'A. officialUrl 與 applyUrl 必須是你在本次 Google Search 工具呼叫中「真實點開過、且實際存在」的網址；',
    '   你不可以憑記憶、不可以推測、不可以根據常見命名規則組合一個「看起來很合理」的深連結。',
    'B. 如果你在搜尋結果中找不到「該卡片的官方介紹頁」確切 URL，請務必降級回填銀行「信用卡總覽頁」，例如：',
    '   - 國泰世華：https://www.cathaybk.com.tw/cathaybk/personal/credit-card/',
    '   - 永豐銀行：https://bank.sinopac.com/personal/credit-card/',
    '   - 滙豐銀行：https://www.hsbc.com.tw/credit-cards/',
    '   - 台新銀行：https://www.taishinbank.com.tw/personal/credit-cards/',
    '   - 玉山銀行：https://www.esunbank.com/personal/credit-card',
    '   - 中信銀行：https://www.ctbcbank.com/twrbo/zh_tw/personal_index/per_cc.html',
    '   - 富邦銀行：https://www.fubon.com/banking/personal/credit_card/intro/index.htm',
    '   - 兆豐銀行：https://www.megabank.com.tw/personal/credit-card',
    '   寧可給總覽頁，也絕對不可以給一個猜出來的深連結。',
    'C. applyUrl 通常和 officialUrl 同一個頁面（介紹頁上會有「線上申辦」按鈕），若不確定就跟 officialUrl 給同一個 URL。',
    'D. 銀行常常改版深連結，去年的 URL 今年可能 404；如果搜尋結果裡只有過時的部落格文章引用該連結但 Google 結果並未顯示銀行官網本身，請降級到總覽頁。',
    '',
    '【輸出格式】請以 JSON 輸出，可包覆於 \`\`\`json ... \`\`\` 代碼區塊中，結構為：',
    '{',
    '  "combinations": [',
    '    {',
    '      "cards": [',
    '        {',
    '          "name": "卡片完整名稱例如：國泰世華 CUBE 卡",',
    '          "issuer": "發卡銀行例如：國泰世華銀行",',
    '          "annualFee": 0,',
    '          "feeWaiverRule": "首年免年費、次年起 ...",',
    '          "officialUrl": "https://搜尋結果裡真實存在的網址（必要時填銀行總覽頁）",',
    '          "applyUrl": "https://搜尋結果裡真實存在的網址（必要時填銀行總覽頁）",',
    '          "promotionPeriod": "2026/01/01 – 2026/12/31，或長期有效",',
    '          "benefits": [',
    '            { "title": "餐飲 5% 回饋", "detail": "...", "cap": "每月最高 500 點", "requirement": "需達低消金額" }',
    '          ],',
    '          "personalizedReason": "符合 Y1/Y2 規則的個人化理由",',
    '          "warnings": ["需注意的限制"]',
    '        }',
    '      ],',
    '      "rationale": "本組合為何適合使用者的總說",',
    '      "warnings": ["組合層級警語"]',
    '    }',
    '  ],',
    '  "disclaimer": "資料來源與免責聲明"',
    '}',
  ].join('\n');
}

/**
 * 使用者提示。包含：消費總覽、前三大類別金額、參數限制、本地資料庫現有卡片參考。
 * 第 12 次更新：額外計算 otherShare 並在 prompt 中明示，供 X 規則使用。
 * 第 14 次更新：強化 maxCards 為「目標數量」而非上限。
 */
export function buildUserPrompt(
  agg: AggregatedInvoice,
  params: RecommendParams,
  cards: CardRule[],
): string {
  const safe = (n: number | undefined) => (typeof n === 'number' && isFinite(n) ? n : 0);
  const summary = {
    monthlyAvgSpend: Math.round(safe(agg.monthlyAvgSpend)),
    monthsCovered: safe(agg.monthsCovered),
    categories: (agg.categories || []).slice(0, 8).map((c) => ({
      category: c.category,
      monthlyAvg: Math.round(safe(c.monthlyAvg)),
      share: Number(safe(c.share).toFixed(3)),
      channelMix: {
        online: Number(safe(c.channelMix?.online).toFixed(2)),
        pos: Number(safe(c.channelMix?.pos).toFixed(2)),
        foreign: Number(safe(c.channelMix?.foreign).toFixed(2)),
      },
    })),
  };

  // 計算「其他」類別佔比，若 > 0.25 將觸發 X 規則
  const otherCat = (agg.categories || []).find((c) => c.category === '其他');
  const otherShare = Number(safe(otherCat?.share).toFixed(3));
  const otherWarn = otherShare > 0.25
    ? `${'\u26A0'} 其他類別佔比 ${(otherShare * 100).toFixed(1)}% 過高（>25%），請依 X1～X3 規則處理：不要把「其他」當推薦主訴求，改用 monthlyAvgSpend、海外比例、已識別類別作為理由訊號。`
    : `其他類別佔比 ${(otherShare * 100).toFixed(1)}%（< 25%），可正常使用主類別作為推薦理由。`;

  // 非「其他」的前 3 大類別
  const nonOtherCats = summary.categories.filter((c) => c.category !== '其他').slice(0, 3);
  const topCats = nonOtherCats.length > 0
    ? nonOtherCats.map((c) => `「${c.category}」 每月 NTD ${c.monthlyAvg.toLocaleString('en-US')}`).join('、')
    : '（前三大已知類別不足，請依 X 規則改用替代訊號）';

  const target = Math.max(1, Math.min(10, Math.floor(params.maxCards || 5)));

  return [
    '## 使用者消費摘要（已去識別化）',
    JSON.stringify(summary, null, 2),
    '',
    `## 其他類別狀況：otherShare = ${otherShare}`,
    otherWarn,
    '',
    `## 重點類別（推薦時請重點針對這些類別查詢最新優惠）：${topCats}`,
    '',
    '## 參數',
    `- annualFeeBudget：${params.annualFeeBudget}（0 表不限）`,
    `- maxCards：${params.maxCards}  ← 這是「目標數量」，請務必推薦剛好這麼多張，不可少。`,
    `- horizonMonths：${params.horizonMonths}`,
    `- includeForeign：${params.includeForeign}`,
    `- riskAversion：${params.riskAversion}`,
    '',
    '## 本地資料庫已收錄的示範卡片（僅供輔助參考，請以 Google Search 查詢的實際卡片為主）',
    JSON.stringify(
      cards.slice(0, 6).map((c) => ({ id: c.id, name: c.name, issuer: c.issuer })),
    ),
    '',
    '## 任務',
    `1) 使用 Google Search 查詢針對使用者前三大「已識別」類別的台灣信用卡最新優惠，必須推薦剛好 ${target} 張不同類別互補的卡片。`,
    '   若 otherShare > 0.25，主要依賴 monthlyAvgSpend、海外比例、線上比例這類訊號決定卡片組合，並依 Y4 規則用「強項互補」填滿。',
    '2) 每張卡提供：name / issuer / annualFee / officialUrl / promotionPeriod / benefits[] / personalizedReason。',
    '3) personalizedReason 必須遵守 Y1～Y3 卡片差異化規則：每張卡必須引用該卡獨有的特徵，且兩張卡的句首結構不可雷同。',
    '   嚴禁出現「針對您每月 NTD … 的『其他』消費」這種句型（違反 X3）。',
    '4) officialUrl 與 applyUrl 必須遵守系統指示的「最嚴格規範」：只能用 Google Search 真實顯示的網址；找不到該卡片深連結時務必降級到該銀行的信用卡總覽頁，絕對不可猜測組合 URL。',
    `5) 最終 combinations[0].cards 的長度必須剛好為 ${target}；若市場上實在湊不到 ${target} 張可互補的卡，請於 combinations[0].warnings 寫明原因。`,
    '6) 以本系統設定的 JSON 格式輸出。',
  ].join('\n');
}
