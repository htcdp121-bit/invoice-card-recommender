import type { HashedInvoiceRow, AggregatedInvoice, CategorySpend } from '@/lib/types';

// 台灣常見商家/品牌/品項關鍵字，由上而下優先比對；命中即歸類，不再往下找。
// 注意：放在前面的類別優先（例如「加油」需早於「交通」，避免被一般運輸吃掉）。
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  '加油': [
    '中油', '台塑', '台亞', '全國加油', '西聯', '山隆', '統一加油', '加油站', '油站',
    'CPC', 'FPCC', 'Esso', 'Mobil',
  ],
  '餐飲': [
    '餐', '食', '飲', '咖啡', '茶', '快餐', '餐廳', '便當', '早餐', '午餐', '晚餐', '宵夜',
    '小吃', '麵', '飯', '粥', '湯', '燒', '烤', '炸', '煎', '滷', '蒸',
    '火鍋', '燒肉', '燒烤', '串燒', '日式', '韓式', '泰式', '義式', '中式', '美式',
    '壽司', '拉麵', '丼', '咖哩', '披薩', 'Pizza', '漢堡', 'Burger', '三明治', '吐司',
    '雞', '鴨', '牛', '豬', '魚', '海鮮', '蝦', '蟹', '羊',
    '麥當勞', '肯德基', 'KFC', 'Subway', '摩斯', 'MOS', '頂呱呱', '丹丹',
    '必勝客', 'Pizza Hut', '達美樂', '拿坡里', '21世紀', '吉野家', 'すき家', '松屋',
    '鼎泰豐', '王品', '瓦城', '陶板屋', '夏慕尼', '聚', '藝奇', '原燒', '西堤', '石二鍋',
    '海底撈', '錢都', '築間', '老四川', '輕井澤', '涮乃葉', '銅盤', '兩餐',
    '星巴克', 'Starbucks', '路易莎', 'Louisa', '85度C', '伯朗', '丹堤', 'Cama',
    '麥味登', '美而美', '可頌坊', '弘爺', '拉亞',
    '手搖', '珍奶', '珍珠', '奶茶', '茶飲', '清心', '50嵐', '五十嵐', '迷客夏', '可不可',
    '一沐日', 'CoCo', '茶湯會', 'KOI', '春水堂', '麻古', '龜記', '吃茶三千', '茶之魔手',
    '烘焙', '蛋糕', '麵包', '甜點', '85度', '聖瑪莉', '亞尼克', '吳寶春',
    'Uber Eats', 'Foodpanda', 'foodpanda',
  ],
  '超商量販': [
    '7-ELEVEN', '7-11', '統一超商', '全家', 'FamilyMart', 'OK超商', 'OK Mart', '萊爾富', 'Hi-Life',
    'Costco', '好市多', '家樂福', 'Carrefour', '大潤發', 'RT-MART', '愛買', 'A.mart',
    '全聯', 'PXMart', '美廉社', '量販', '楓康', '裕毛屋',
  ],
  '網路購物': [
    'momo', 'PChome', 'Pchome', '蝦皮', 'Shopee', 'Yahoo購物', 'Yahoo奇摩購物', 'Yahoo拍賣',
    '博客來', 'books.com', 'ASAP', '生活市集', '松果購物', 'Buy123', '東森購物', 'ETMall',
    '樂天', 'Rakuten', '友和', 'Yuanta', '誠品線上', 'iHerb', 'Amazon', 'eBay',
    '網購', '網路商店', '電商', '購物網', '網路', '線上',
  ],
  '娛樂訂閱': [
    'Netflix', 'Disney', 'Disney+', 'Spotify', 'Apple Music', 'YouTube', 'YouTube Premium',
    'KKBOX', 'KKTV', 'myVideo', 'friDay', 'LINE TV', 'LINE Music', 'Hami Video', 'CATCHPLAY',
    'iTunes', 'App Store', 'Google Play', 'Google One', 'iCloud',
    'PlayStation', 'PSN', 'Xbox', 'Nintendo', 'Steam',
    'Adobe', 'Microsoft 365', 'Office 365', 'Notion', 'Dropbox', 'Evernote', 'ChatGPT', 'OpenAI',
    '電影', '影城', '威秀', 'Vieshow', '國賓', '秀泰', 'in89', 'MUVIE', '新光影城',
    'KTV', '錢櫃', '好樂迪', '星聚點',
  ],
  '旅遊住宿': [
    '航空', '長榮', '華航', '星宇', '台灣虎航', '立榮', '華信',
    '飯店', '酒店', '旅館', '民宿', '汽車旅館', '會館', 'Hotel', 'Inn', 'Resort',
    '晶華', '君悅', '六福', '老爺', '雲品', '日月行館', '凱撒', '福華', '國賓',
    'Booking', 'Agoda', 'Klook', 'KKday', 'Trip.com', 'Expedia', 'Airbnb', 'Hotels.com',
    '旅行社', '旅遊', '雄獅', '可樂', '東南', '易遊網', 'ezTravel',
  ],
  '交通': [
    '高鐵', '台鐵', '捷運', '台北捷運', '高雄捷運', '桃園捷運', 'MRT',
    '客運', '統聯', '國光', '和欣', '阿羅哈', '日統',
    'Uber', 'UBER', 'LINE TAXI', '計程車', '台灣大車隊', '大都會',
    '停車', '停車場', 'iPark', '嘟嘟房', 'TPark', 'YouBike', '微笑單車',
    'ETC', '遠通電收',
  ],
  '醫療藥妝': [
    '屈臣氏', 'Watsons', '康是美', 'COSMED', '寶雅', 'POYA', '康美',
    '丁丁', '大樹', '杏一', '佑全', '躍獅', '健康人生', '欣康', '丁丁連鎖', '維康',
    '藥局', '藥房', '醫院', '診所', '醫美', '牙醫', '眼科', '皮膚科',
  ],
  '百貨服飾': [
    '新光三越', 'SOGO', '太平洋崇光', '遠百', '遠東百貨', '微風', 'Breeze', 'Bellavita',
    '京站', '統一時代', '美麗華', '101', '大遠百', '台茂', '夢時代', '大江', '中友',
    'UNIQLO', 'GU', 'ZARA', 'H&M', 'NET', 'Net', 'GAP', 'Lativ', '無印良品', 'MUJI',
    'Nike', 'Adidas', 'New Balance', 'PUMA', 'Skechers', 'Under Armour',
    '服飾', '專櫃', '百貨',
  ],
  '3C家電': [
    '燦坤', '全國電子', '順發', '大同3C', '通訊行', '神腦', '聯強', '德誼', 'Studio A',
    'Apple', '蘋果', 'iStore',
    '三井', 'Sony', 'SAMSUNG', '三星', 'ASUS', '華碩', 'Acer', '宏碁', 'HTC', '小米', 'Xiaomi',
    '家電', '冷氣', '冰箱', '洗衣機', '電視', '相機',
  ],
};

export function classifyByMerchant(merchant: string | undefined): string {
  if (!merchant) return '其他';
  const m = merchant.toLowerCase();
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of kws) {
      if (merchant.includes(kw) || m.includes(kw.toLowerCase())) return cat;
    }
  }
  return '其他';
}

export function aggregateByCategory(rows: HashedInvoiceRow[]): AggregatedInvoice {
  if (rows.length === 0) {
    return {
      totalSpend: 0,
      monthlyAvgSpend: 0,
      monthsCovered: 0,
      categories: [],
      generatedAt: new Date().toISOString(),
    };
  }
  const months = new Set<string>();
  const totals = new Map<
    string,
    {
      sum: number;
      merchants: Map<string, { amount: number; count: number }>;
      ch: { online: number; pos: number; foreign: number };
    }
  >();
  let totalSpend = 0;
  for (const r of rows) {
    const cat = r.category || '其他';
    const ym = (r.invoiceDate || '').slice(0, 7);
    if (ym) months.add(ym);
    totalSpend += r.amount;
    if (!totals.has(cat))
      totals.set(cat, { sum: 0, merchants: new Map(), ch: { online: 0, pos: 0, foreign: 0 } });
    const bucket = totals.get(cat)!;
    bucket.sum += r.amount;
    const mm = bucket.merchants.get(r.sellerHash) || { amount: 0, count: 0 };
    mm.amount += r.amount;
    mm.count += 1;
    bucket.merchants.set(r.sellerHash, mm);
    if (r.channel === 'online') bucket.ch.online += r.amount;
    else if (r.channel === 'foreign') bucket.ch.foreign += r.amount;
    else bucket.ch.pos += r.amount;
  }
  const monthsCovered = Math.max(months.size, 1);
  const categories: CategorySpend[] = Array.from(totals.entries()).map(([category, b]) => {
    const top = Array.from(b.merchants.entries())
      .map(([hash, v]) => ({ hash, amount: v.amount, count: v.count }))
      .sort((a, c) => c.amount - a.amount)
      .slice(0, 5);
    return {
      category,
      monthlyAvg: b.sum / monthsCovered,
      share: totalSpend > 0 ? b.sum / totalSpend : 0,
      channelMix: {
        online: b.sum > 0 ? b.ch.online / b.sum : 0,
        pos: b.sum > 0 ? b.ch.pos / b.sum : 0,
        foreign: b.sum > 0 ? b.ch.foreign / b.sum : 0,
      },
      topMerchants: top,
    };
  });
  categories.sort((a, b) => b.monthlyAvg - a.monthlyAvg);
  return {
    totalSpend,
    monthlyAvgSpend: totalSpend / monthsCovered,
    monthsCovered,
    categories,
    generatedAt: new Date().toISOString(),
  };
}
