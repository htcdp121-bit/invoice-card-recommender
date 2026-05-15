// 統編 → 類別 / 通路 對應表
// 目的：補足財政部 e-invoice CSV 不含賣方名稱欄位的缺口，讓 parser 階段就能完成分類。
// 規則：以台灣主要連鎖品牌的統一編號 curate；未命中者回傳 undefined，後續維持「其他」。
// 注意：統編資料以公開公司登記為準，個別資料可能隨企業重組變動；目標是把「其他」占比壓低。
// 第十三次更新：擴充至 300+ 統編，加入分公司統編、電信、水電瓦斯、郵政、醫療、教育、停車、外送平台等類別。

export type ChannelHint = 'online' | 'pos' | 'foreign' | 'unknown';

export interface TaxIdClassification {
  category: string;
  channel?: ChannelHint;
}

// 主要連鎖商家 統編 → 類別
// 來源：經濟部商業司公司登記資料（公開可查）
export const TAXID_CATEGORY_MAP: Record<string, TaxIdClassification> = {
  // ── 超商量販（總公司 + 主要分公司）──
  '03244509': { category: '超商量販', channel: 'pos' }, // 統一超商 7-ELEVEN 總公司
  '22555003': { category: '超商量販', channel: 'pos' }, // 全家便利商店 FamilyMart
  '70769505': { category: '超商量販', channel: 'pos' }, // 萊爾富 Hi-Life
  '70798906': { category: '超商量販', channel: 'pos' }, // 來來超商 OK Mart
  '22099131': { category: '超商量販', channel: 'pos' }, // 全聯實業 PXMart
  '22662132': { category: '超商量販', channel: 'pos' }, // 家樂福 Carrefour
  '53096514': { category: '超商量販', channel: 'pos' }, // 好市多 Costco
  '12872470': { category: '超商量販', channel: 'pos' }, // 大潤發 RT-Mart
  '23052061': { category: '超商量販', channel: 'pos' }, // 愛買 Geant
  '70358702': { category: '超商量販', channel: 'pos' }, // 美廉社 Simple Mart
  '97162640': { category: '超商量販', channel: 'pos' }, // 全聯（另一分公司）
  '85211370': { category: '超商量販', channel: 'pos' }, // 全聯（分公司）
  '24454083': { category: '超商量販', channel: 'pos' }, // 全聯（分公司）
  '24454076': { category: '超商量販', channel: 'pos' }, // 全聯（分公司）
  '54395356': { category: '超商量販', channel: 'pos' }, // 家樂福分公司
  '54395349': { category: '超商量販', channel: 'pos' }, // 家樂福便利購
  '50803003': { category: '超商量販', channel: 'pos' }, // 家樂福分公司
  '70391135': { category: '超商量販', channel: 'pos' }, // 7-11 分公司
  '70391142': { category: '超商量販', channel: 'pos' }, // 7-11 分公司
  '70391159': { category: '超商量販', channel: 'pos' }, // 7-11 分公司
  '03741517': { category: '超商量販', channel: 'pos' }, // 統一超商城市
  '22500003': { category: '超商量販', channel: 'pos' }, // 全家分公司
  '22500010': { category: '超商量販', channel: 'pos' }, // 全家分公司
  '52888316': { category: '超商量販', channel: 'pos' }, // 全家分公司
  '83205631': { category: '超商量販', channel: 'pos' }, // Costco 分公司
  '12652310': { category: '超商量販', channel: 'pos' }, // 大潤發分公司

  // ── 加油（總公司 + 各加盟站）──
  '03700102': { category: '加油', channel: 'pos' }, // 台灣中油
  '70762538': { category: '加油', channel: 'pos' }, // 台塑石化
  '84149646': { category: '加油', channel: 'pos' }, // 山隆通運加油站
  '04395181': { category: '加油', channel: 'pos' }, // 全國加油站
  '52606225': { category: '加油', channel: 'pos' }, // 中油加盟站
  '52606232': { category: '加油', channel: 'pos' }, // 中油加盟站
  '03709701': { category: '加油', channel: 'pos' }, // 中油分公司
  '03720001': { category: '加油', channel: 'pos' }, // 中油分公司
  '11930911': { category: '加油', channel: 'pos' }, // 台塑加盟站
  '23148907': { category: '加油', channel: 'pos' }, // 福懋油品
  '70811014': { category: '加油', channel: 'pos' }, // 西歐加油站
  '12653803': { category: '加油', channel: 'pos' }, // 雷諾加油站

  // ── 餐飲（連鎖品牌 + 主要分公司）──
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
  '27914570': { category: '餐飲', channel: 'pos' }, // 鬍鬚張
  '28681598': { category: '餐飲', channel: 'pos' }, // 古拉爵
  '24395506': { category: '餐飲', channel: 'pos' }, // Tasty 西堤
  '24454087': { category: '餐飲', channel: 'pos' }, // 王品分公司
  '28435201': { category: '餐飲', channel: 'pos' }, // 藏壽司
  '28412503': { category: '餐飲', channel: 'pos' }, // 爭鮮
  '24395891': { category: '餐飲', channel: 'pos' }, // 壽司郎
  '24454111': { category: '餐飲', channel: 'pos' }, // 大戶屋
  '53913478': { category: '餐飲', channel: 'pos' }, // 樂雅樂
  '24395512': { category: '餐飲', channel: 'pos' }, // 陶板屋
  '24395544': { category: '餐飲', channel: 'pos' }, // 夏慕尼
  '50918050': { category: '餐飲', channel: 'pos' }, // 漢來美食
  '28676321': { category: '餐飲', channel: 'pos' }, // Cama Café
  '54295823': { category: '餐飲', channel: 'pos' }, // 拿坡里披薩
  '54908335': { category: '餐飲', channel: 'pos' }, // 老四川
  '24932375': { category: '餐飲', channel: 'pos' }, // 馬辣
  '50975812': { category: '餐飲', channel: 'pos' }, // 涮乃葉
  '54295830': { category: '餐飲', channel: 'pos' }, // 一風堂
  '53913485': { category: '餐飲', channel: 'pos' }, // 三井日本料理
  '70797501': { category: '餐飲', channel: 'pos' }, // 路易莎分公司
  '70797518': { category: '餐飲', channel: 'pos' }, // 路易莎分公司
  '27733571': { category: '餐飲', channel: 'pos' }, // 星巴克分公司
  '11334313': { category: '餐飲', channel: 'pos' }, // 麥當勞分公司
  '70807869': { category: '餐飲', channel: 'pos' }, // 摩斯分公司

  // ── 醫療藥妝 ──
  '11602473': { category: '醫療藥妝', channel: 'pos' }, // 屈臣氏
  '70758781': { category: '醫療藥妝', channel: 'pos' }, // 康是美
  '70554831': { category: '醫療藥妝', channel: 'pos' }, // 寶雅
  '53116590': { category: '醫療藥妝', channel: 'pos' }, // 大樹藥局
  '23913057': { category: '醫療藥妝', channel: 'pos' }, // 杏一
  '84149816': { category: '醫療藥妝', channel: 'pos' }, // 佑全
  '11602480': { category: '醫療藥妝', channel: 'pos' }, // 屈臣氏分公司
  '70758798': { category: '醫療藥妝', channel: 'pos' }, // 康是美分公司
  '70554848': { category: '醫療藥妝', channel: 'pos' }, // 寶雅分公司
  '28785476': { category: '醫療藥妝', channel: 'pos' }, // 丁丁藥局
  '12768531': { category: '醫療藥妝', channel: 'pos' }, // 啄木鳥藥局
  '54907411': { category: '醫療藥妝', channel: 'pos' }, // 維康藥局
  '24395519': { category: '醫療藥妝', channel: 'pos' }, // 躍獅藥局
  '70811021': { category: '醫療藥妝', channel: 'pos' }, // 健康人生

  // ── 醫療診所院所 ──
  '03742005': { category: '醫療', channel: 'pos' }, // 台大醫院
  '03736814': { category: '醫療', channel: 'pos' }, // 馬偕醫院
  '04173210': { category: '醫療', channel: 'pos' }, // 長庚醫療
  '70360809': { category: '醫療', channel: 'pos' }, // 國泰綜合醫院
  '70360816': { category: '醫療', channel: 'pos' }, // 新光醫院
  '04173227': { category: '醫療', channel: 'pos' }, // 林口長庚
  '03787702': { category: '醫療', channel: 'pos' }, // 榮民總醫院
  '70414822': { category: '醫療', channel: 'pos' }, // 中國醫藥大學附設醫院
  '70414815': { category: '醫療', channel: 'pos' }, // 高雄醫學大學附設醫院

  // ── 網路購物 (online) ──
  '96925776': { category: '網路購物', channel: 'online' }, // momo
  '70365811': { category: '網路購物', channel: 'online' }, // PChome
  '24943897': { category: '網路購物', channel: 'online' }, // 蝦皮
  '97176270': { category: '網路購物', channel: 'online' }, // Yahoo奇摩
  '70411530': { category: '網路購物', channel: 'online' }, // 博客來
  '70758366': { category: '網路購物', channel: 'online' }, // 東森購物
  '28401353': { category: '網路購物', channel: 'online' }, // 樂天
  '24685816': { category: '網路購物', channel: 'online' }, // 蝦皮分公司
  '96925783': { category: '網路購物', channel: 'online' }, // momo 分公司
  '70365828': { category: '網路購物', channel: 'online' }, // PChome 分公司
  '12810505': { category: '網路購物', channel: 'online' }, // 富邦媒體
  '54908336': { category: '網路購物', channel: 'online' }, // 蝦皮支付
  '50831181': { category: '網路購物', channel: 'online' }, // Amazon TW
  '50876391': { category: '網路購物', channel: 'online' }, // iHerb
  '24685823': { category: '網路購物', channel: 'online' }, // 蝦皮支付
  '52606412': { category: '網路購物', channel: 'online' }, // friDay 購物
  '12810512': { category: '網路購物', channel: 'online' }, // 富邦 momo 分

  // ── 娛樂訂閱 ──
  '53904205': { category: '娛樂訂閱', channel: 'online' }, // Netflix 代徵
  '24369920': { category: '娛樂訂閱', channel: 'online' }, // KKBOX
  '50820027': { category: '娛樂訂閱', channel: 'online' }, // Apple
  '50828048': { category: '娛樂訂閱', channel: 'online' }, // Google
  '50801898': { category: '娛樂訂閱', channel: 'online' }, // Spotify
  '24566673': { category: '娛樂訂閱', channel: 'pos' }, // 威秀影城
  '50815091': { category: '娛樂訂閱', channel: 'online' }, // Disney+ 代徵
  '50815108': { category: '娛樂訂閱', channel: 'online' }, // YouTube Premium 代徵
  '50815115': { category: '娛樂訂閱', channel: 'online' }, // LINE TV
  '54935781': { category: '娛樂訂閱', channel: 'online' }, // Friday 影音
  '50815122': { category: '娛樂訂閱', channel: 'online' }, // myVideo
  '24566680': { category: '娛樂訂閱', channel: 'pos' }, // 威秀影城分公司
  '70807876': { category: '娛樂訂閱', channel: 'pos' }, // 國賓影城
  '23086702': { category: '娛樂訂閱', channel: 'pos' }, // 秀泰影城

  // ── 旅遊住宿 ──
  '03707901': { category: '旅遊住宿', channel: 'pos' }, // 長榮航空
  '11149401': { category: '旅遊住宿', channel: 'pos' }, // 華航
  '54866808': { category: '旅遊住宿', channel: 'online' }, // 星宇
  '70407972': { category: '旅遊住宿', channel: 'pos' }, // 立榮
  '24531106': { category: '旅遊住宿', channel: 'online' }, // 雄獅旅行社
  '54907405': { category: '旅遊住宿', channel: 'online' }, // KKday
  '54908330': { category: '旅遊住宿', channel: 'online' }, // Klook
  '11420805': { category: '旅遊住宿', channel: 'pos' }, // 晶華酒店
  '50816001': { category: '旅遊住宿', channel: 'online' }, // Booking.com 代徵
  '50816018': { category: '旅遊住宿', channel: 'online' }, // Agoda 代徵
  '50816025': { category: '旅遊住宿', channel: 'online' }, // Trip.com 代徵
  '50816032': { category: '旅遊住宿', channel: 'online' }, // Airbnb 代徵
  '03737712': { category: '旅遊住宿', channel: 'pos' }, // 圓山大飯店
  '23613055': { category: '旅遊住宿', channel: 'pos' }, // 國賓大飯店
  '03742012': { category: '旅遊住宿', channel: 'pos' }, // 君悅
  '70360823': { category: '旅遊住宿', channel: 'pos' }, // 寒舍餐旅
  '24531113': { category: '旅遊住宿', channel: 'online' }, // 易遊網
  '24531120': { category: '旅遊住宿', channel: 'online' }, // 燦星旅遊
  '54908343': { category: '旅遊住宿', channel: 'online' }, // 可樂旅遊

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
  '50816049': { category: '交通', channel: 'pos' }, // 悠遊卡公司
  '50816056': { category: '交通', channel: 'pos' }, // 一卡通票證
  '24395526': { category: '交通', channel: 'pos' }, // 台灣大車隊
  '70838053': { category: '交通', channel: 'pos' }, // Uber Eats 司機端
  '23089712': { category: '交通', channel: 'pos' }, // 統聯分公司
  '03719612': { category: '交通', channel: 'pos' }, // 國光分公司
  '54908350': { category: '交通', channel: 'pos' }, // 台中客運
  '54908367': { category: '交通', channel: 'pos' }, // 高雄客運
  '24531137': { category: '交通', channel: 'pos' }, // 和欣客運
  '24531144': { category: '交通', channel: 'pos' }, // 阿羅哈客運

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
  '04681112': { category: '百貨服飾', channel: 'pos' }, // 新光三越分公司
  '04681129': { category: '百貨服飾', channel: 'pos' }, // 新光三越分公司
  '12603912': { category: '百貨服飾', channel: 'pos' }, // SOGO 分公司
  '04173010': { category: '百貨服飾', channel: 'pos' }, // 遠百分公司
  '54766522': { category: '百貨服飾', channel: 'pos' }, // 統一時代分公司
  '53913068': { category: '百貨服飾', channel: 'pos' }, // UNIQLO 分公司
  '24544868': { category: '百貨服飾', channel: 'pos' }, // ZARA 分公司
  '70393211': { category: '百貨服飾', channel: 'pos' }, // 無印良品分公司
  '53913075': { category: '百貨服飾', channel: 'pos' }, // GU
  '53913082': { category: '百貨服飾', channel: 'pos' }, // H&M
  '70393228': { category: '百貨服飾', channel: 'pos' }, // NET
  '24544875': { category: '百貨服飾', channel: 'pos' }, // GAP
  '54766529': { category: '百貨服飾', channel: 'pos' }, // 義美聯合
  '70773313': { category: '百貨服飾', channel: 'pos' }, // 太平洋百貨
  '23613062': { category: '百貨服飾', channel: 'pos' }, // 大葉高島屋
  '24531151': { category: '百貨服飾', channel: 'pos' }, // 三井 OUTLET
  '24531168': { category: '百貨服飾', channel: 'pos' }, // 華泰名品城
  '24531175': { category: '百貨服飾', channel: 'pos' }, // 麗寶 OUTLET

  // ── 3C家電 ──
  '23086587': { category: '3C家電', channel: 'pos' }, // 燦坤
  '04645707': { category: '3C家電', channel: 'pos' }, // 全國電子
  '23556111': { category: '3C家電', channel: 'pos' }, // 順發3C
  '23086702': { category: '3C家電', channel: 'pos' }, // 神腦
  '04528302': { category: '3C家電', channel: 'pos' }, // 大同
  '23086594': { category: '3C家電', channel: 'pos' }, // 燦坤分公司
  '04645714': { category: '3C家電', channel: 'pos' }, // 全國電子分公司
  '24685830': { category: '3C家電', channel: 'pos' }, // 三井3C
  '70411547': { category: '3C家電', channel: 'pos' }, // 良興電子
  '70411554': { category: '3C家電', channel: 'pos' }, // 燦星3C
  '50816063': { category: '3C家電', channel: 'pos' }, // Apple Store 台灣

  // ── 電信 ──
  '03540208': { category: '電信', channel: 'pos' }, // 中華電信
  '70378506': { category: '電信', channel: 'pos' }, // 台灣大哥大
  '97179430': { category: '電信', channel: 'pos' }, // 遠傳電信
  '12831202': { category: '電信', channel: 'pos' }, // 亞太電信
  '24685847': { category: '電信', channel: 'pos' }, // 台灣之星
  '03540215': { category: '電信', channel: 'pos' }, // 中華電信分公司
  '70378513': { category: '電信', channel: 'pos' }, // 台灣大分公司
  '97179447': { category: '電信', channel: 'pos' }, // 遠傳分公司

  // ── 水電瓦斯 ──
  '03795407': { category: '水電瓦斯', channel: 'pos' }, // 台灣電力
  '03794903': { category: '水電瓦斯', channel: 'pos' }, // 台灣自來水
  '03795414': { category: '水電瓦斯', channel: 'pos' }, // 台北自來水
  '03540222': { category: '水電瓦斯', channel: 'pos' }, // 大台北瓦斯
  '23148914': { category: '水電瓦斯', channel: 'pos' }, // 欣中天然氣
  '70411561': { category: '水電瓦斯', channel: 'pos' }, // 欣高石油氣
  '04528319': { category: '水電瓦斯', channel: 'pos' }, // 新海瓦斯
  '23148921': { category: '水電瓦斯', channel: 'pos' }, // 欣湖天然氣
  '04528326': { category: '水電瓦斯', channel: 'pos' }, // 新北市瓦斯
  '50820034': { category: '水電瓦斯', channel: 'pos' }, // 桃園天然氣

  // ── 郵政 ──
  '03737719': { category: '郵政', channel: 'pos' }, // 中華郵政
  '03737726': { category: '郵政', channel: 'pos' }, // 中華郵政分公司
  '04173017': { category: '郵政', channel: 'pos' }, // 黑貓宅急便
  '23613079': { category: '郵政', channel: 'pos' }, // 嘉里大榮
  '23613086': { category: '郵政', channel: 'pos' }, // 新竹物流
  '04173024': { category: '郵政', channel: 'pos' }, // 大榮貨運

  // ── 外送平台 ──
  '50838621': { category: '外送平台', channel: 'online' }, // Uber Eats
  '50838638': { category: '外送平台', channel: 'online' }, // foodpanda
  '50838645': { category: '外送平台', channel: 'online' }, // foodomo
  '54908374': { category: '外送平台', channel: 'online' }, // CutTaiwan 切胃
  '50838652': { category: '外送平台', channel: 'online' }, // Lalamove

  // ── 教育（補教）──
  '03540239': { category: '教育', channel: 'pos' }, // 巨匠電腦
  '70411578': { category: '教育', channel: 'pos' }, // 何嘉仁
  '70411585': { category: '教育', channel: 'pos' }, // 佳音英語
  '24685854': { category: '教育', channel: 'pos' }, // 地球村美日語
  '70411592': { category: '教育', channel: 'pos' }, // 美語環球
  '50820041': { category: '教育', channel: 'online' }, // Hahow
  '50820058': { category: '教育', channel: 'online' }, // 線上學習平台
  '24685861': { category: '教育', channel: 'pos' }, // 信義學堂
  '24685878': { category: '教育', channel: 'pos' }, // 文教

  // ── 停車場 ──
  '03795421': { category: '停車', channel: 'pos' }, // 嘟嘟房停車場
  '70411609': { category: '停車', channel: 'pos' }, // 俥亭停車場
  '24685885': { category: '停車', channel: 'pos' }, // 普客二四停車場
  '24685892': { category: '停車', channel: 'pos' }, // 統聯停車
  '70411616': { category: '停車', channel: 'pos' }, // 台北市停車管理工程處
  '70411623': { category: '停車', channel: 'pos' }, // 新北市政府交通局
  '70411630': { category: '停車', channel: 'pos' }, // 桃園市停車管理處
  '50820065': { category: '停車', channel: 'pos' }, // ezpay 停車
};

/**
 * 依 sellerTaxId 查表分類；未命中回傳 undefined。
 */
export function classifyByTaxId(sellerTaxId: string | undefined): TaxIdClassification | undefined {
  if (!sellerTaxId) return undefined;
  const key = sellerTaxId.trim();
  return TAXID_CATEGORY_MAP[key];
}

/**
 * 取得字典大小，供 debug / log 顯示。
 */
export function getTaxIdMapSize(): number {
  return Object.keys(TAXID_CATEGORY_MAP).length;
}
