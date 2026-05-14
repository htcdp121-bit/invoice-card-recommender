// 統編 → 類別 / 通路 對應表
// 目的：補足財政部 e-invoice CSV 不含賣方名稱欄位的缺口，讓 parser 階段就能完成分類。
// 規則：以台灣主要連鎖品牌的統一編號 curate；未命中者回傳 undefined，後續維持「其他」。
// 注意：統編資料以公開公司登記為準，個別資料可能隨企業重組變動；目標是把「其他」占比壓低。

export type ChannelHint = 'online' | 'pos' | 'foreign' | 'unknown';

export interface TaxIdClassification {
  category: string;
  channel?: ChannelHint;
}

// 主要連鎖商家 統編 → 類別
// 來源：經濟部商業司公司登記資料（公開可查）
export const TAXID_CATEGORY_MAP: Record<string, TaxIdClassification> = {
  // ── 超商量販 ──
  '03244509': { category: '超商量販', channel: 'pos' }, // 統一超商 7-ELEVEN
  '22555003': { category: '超商量販', channel: 'pos' }, // 全家便利商店 FamilyMart
  '70769505': { category: '超商量販', channel: 'pos' }, // 萊爾富 Hi-Life
  '70798906': { category: '超商量販', channel: 'pos' }, // 來來超商 OK Mart
  '22099131': { category: '超商量販', channel: 'pos' }, // 全聯實業 PXMart
  '22662132': { category: '超商量販', channel: 'pos' }, // 家樂福 Carrefour
  '53096514': { category: '超商量販', channel: 'pos' }, // 好市多 Costco
  '12872470': { category: '超商量販', channel: 'pos' }, // 大潤發 RT-Mart
  '23052061': { category: '超商量販', channel: 'pos' }, // 愛買 Geant
  '70358702': { category: '超商量販', channel: 'pos' }, // 美廉社 Simple Mart

  // ── 加油 ──
  '03700102': { category: '加油', channel: 'pos' }, // 台灣中油
  '70762538': { category: '加油', channel: 'pos' }, // 台塑石化
  '84149646': { category: '加油', channel: 'pos' }, // 山隆通運加油站
  '04395181': { category: '加油', channel: 'pos' }, // 全國加油站

  // ── 餐飲 ──
  '11334306': { category: '餐飲', channel: 'pos' }, // 麥當勞
  '22662407': { category: '餐飲', channel: 'pos' }, // 肯德基
  '70807852': { category: '餐飲', channel: 'pos' }, // 摩斯漢堡
  '12668401': { category: '餐飲', channel: 'pos' }, // 必勝客
  '23086685': { category: '餐飲', channel: 'pos' }, // 達美樂
  '27733564': { category: '餐飲', channel: 'pos' }, // 統一星巴克
  '70797495': { category: '餐飲', channel: 'pos' }, // 路易莎
  '53916546': { category: '餐飲', channel: 'pos' }, // 85度C
  '28235805': { category: '餐飲', channel: 'pos' }, // 王品餐飲
  '70797419': { category: '餐飲', channel: 'pos' }, // 瓦城泰統
  '24450630': { category: '餐飲', channel: 'pos' }, // 鼎泰豐
  '24454105': { category: '餐飲', channel: 'pos' }, // 海底撈
  '24252510': { category: '餐飲', channel: 'pos' }, // 八方雲集
  '24450629': { category: '餐飲', channel: 'pos' }, // 三商餐飲
  '53811432': { category: '餐飲', channel: 'pos' }, // Subway
  '24454103': { category: '餐飲', channel: 'pos' }, // 50嵐
  '24932369': { category: '餐飲', channel: 'pos' }, // 清心福全
  '53910432': { category: '餐飲', channel: 'pos' }, // 迷客夏
  '54290598': { category: '餐飲', channel: 'pos' }, // 麻古
  '50873535': { category: '餐飲', channel: 'pos' }, // CoCo 都可
  '28447907': { category: '餐飲', channel: 'pos' }, // 春水堂

  // ── 醫療藥妝 ──
  '11602473': { category: '醫療藥妝', channel: 'pos' }, // 屈臣氏
  '70758781': { category: '醫療藥妝', channel: 'pos' }, // 康是美
  '70554831': { category: '醫療藥妝', channel: 'pos' }, // 寶雅
  '53116590': { category: '醫療藥妝', channel: 'pos' }, // 大樹藥局
  '23913057': { category: '醫療藥妝', channel: 'pos' }, // 杏一
  '84149816': { category: '醫療藥妝', channel: 'pos' }, // 佑全

  // ── 網路購物 (online) ──
  '96925776': { category: '網路購物', channel: 'online' }, // momo
  '70365811': { category: '網路購物', channel: 'online' }, // PChome
  '24943897': { category: '網路購物', channel: 'online' }, // 蝦皮
  '97176270': { category: '網路購物', channel: 'online' }, // Yahoo奇摩
  '70411530': { category: '網路購物', channel: 'online' }, // 博客來
  '70758366': { category: '網路購物', channel: 'online' }, // 東森購物
  '28401353': { category: '網路購物', channel: 'online' }, // 樂天

  // ── 娛樂訂閱 ──
  '53904205': { category: '娛樂訂閱', channel: 'online' }, // Netflix 代徵
  '24369920': { category: '娛樂訂閱', channel: 'online' }, // KKBOX
  '50820027': { category: '娛樂訂閱', channel: 'online' }, // Apple
  '50828048': { category: '娛樂訂閱', channel: 'online' }, // Google
  '50801898': { category: '娛樂訂閱', channel: 'online' }, // Spotify
  '24566673': { category: '娛樂訂閱', channel: 'pos' }, // 威秀影城

  // ── 旅遊住宿 ──
  '03707901': { category: '旅遊住宿', channel: 'pos' }, // 長榮航空
  '11149401': { category: '旅遊住宿', channel: 'pos' }, // 華航
  '54866808': { category: '旅遊住宿', channel: 'online' }, // 星宇
  '70407972': { category: '旅遊住宿', channel: 'pos' }, // 立榮
  '24531106': { category: '旅遊住宿', channel: 'online' }, // 雄獅旅行社
  '54907405': { category: '旅遊住宿', channel: 'online' }, // KKday
  '54908330': { category: '旅遊住宿', channel: 'online' }, // Klook
  '11420805': { category: '旅遊住宿', channel: 'pos' }, // 晶華酒店

  // ── 交通 ──
  '70773312': { category: '交通', channel: 'pos' }, // 台灣高鐵
  '69991898': { category: '交通', channel: 'pos' }, // 台灣鐵路
  '03795902': { category: '交通', channel: 'pos' }, // 台北捷運
  '70806323': { category: '交通', channel: 'pos' }, // 桃園捷運
  '70804020': { category: '交通', channel: 'pos' }, // 高雄捷運
  '23089705': { category: '交通', channel: 'pos' }, // 統聯客運
  '03719605': { category: '交通', channel: 'pos' }, // 國光客運
  '70838046': { category: '交通', channel: 'pos' }, // Uber Taiwan
  '70398951': { category: '交通', channel: 'pos' }, // 遠通電收

  // ── 百貨服飾 ──
  '04681105': { category: '百貨服飾', channel: 'pos' }, // 新光三越
  '12603905': { category: '百貨服飾', channel: 'pos' }, // SOGO
  '04173003': { category: '百貨服飾', channel: 'pos' }, // 遠百
  '70773306': { category: '百貨服飾', channel: 'pos' }, // 微風
  '24514002': { category: '百貨服飾', channel: 'pos' }, // 京站
  '54766515': { category: '百貨服飾', channel: 'pos' }, // 統一時代
  '53913051': { category: '百貨服飾', channel: 'pos' }, // UNIQLO
  '24544851': { category: '百貨服飾', channel: 'pos' }, // ZARA
  '70393204': { category: '百貨服飾', channel: 'pos' }, // 無印良品

  // ── 3C家電 ──
  '23086587': { category: '3C家電', channel: 'pos' }, // 燦坤
  '04645707': { category: '3C家電', channel: 'pos' }, // 全國電子
  '23556111': { category: '3C家電', channel: 'pos' }, // 順發3C
  '23086702': { category: '3C家電', channel: 'pos' }, // 神腦
  '04528302': { category: '3C家電', channel: 'pos' }, // 大同
};

/**
 * 依 sellerTaxId 查表分類；未命中回傳 undefined。
 */
export function classifyByTaxId(sellerTaxId: string | undefined): TaxIdClassification | undefined {
  if (!sellerTaxId) return undefined;
  const key = sellerTaxId.trim();
  return TAXID_CATEGORY_MAP[key];
}
