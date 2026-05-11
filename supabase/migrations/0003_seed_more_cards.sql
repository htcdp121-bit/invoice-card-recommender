-- 0003_seed_more_cards.sql
-- 補強示範卡片，使本地保底邏輯在各類別/通路下都能挑出至少 1 張合理卡。
-- 內容仍為示範資料，未代表任一發卡機構正式公告。

insert into card_rules (id, name, issuer, annual_fee, base_reward_rate, category_bonuses, channel_bonuses, notes) values
  ('demo-dining',
   '美食回饋卡 (示範)', '示範銀行', 0, 0.01,
   '[{"categories":["dining","餐飲"],"rate":0.05,"cap":{"period":"month","amount":1500}}]'::jsonb,
   '[]'::jsonb,
   '示範資料，以公告為準')
  on conflict (id) do nothing;

insert into card_rules (id, name, issuer, annual_fee, base_reward_rate, category_bonuses, channel_bonuses, notes) values
  ('demo-supermarket',
   '量販超市卡 (示範)', '示範銀行', 0, 0.01,
   '[{"categories":["supermarket","超商量販","grocery"],"rate":0.05,"cap":{"period":"month","amount":1500}}]'::jsonb,
   '[]'::jsonb,
   '示範資料，以公告為準')
  on conflict (id) do nothing;

insert into card_rules (id, name, issuer, annual_fee, base_reward_rate, category_bonuses, channel_bonuses, notes) values
  ('demo-fuel',
   '加油通勤卡 (示範)', '示範銀行', 0, 0.01,
   '[{"categories":["fuel","加油","transport","交通"],"rate":0.04,"cap":{"period":"month","amount":1000}}]'::jsonb,
   '[]'::jsonb,
   '示範資料，以公告為準')
  on conflict (id) do nothing;

insert into card_rules (id, name, issuer, annual_fee, base_reward_rate, category_bonuses, channel_bonuses, notes) values
  ('demo-online',
   '電商回饋卡 (示範)', '示範銀行', 0, 0.012,
   '[{"categories":["online","網路購物"],"rate":0.05,"cap":{"period":"month","amount":2000}}]'::jsonb,
   '[{"channels":["online"],"rate":0.03,"cap":{"period":"month","amount":1000}}]'::jsonb,
   '示範資料，以公告為準')
  on conflict (id) do nothing;

insert into card_rules (id, name, issuer, annual_fee, base_reward_rate, category_bonuses, channel_bonuses, notes) values
  ('demo-travel',
   '旅遊外幣卡 (示範)', '示範銀行', 1200, 0.01,
   '[{"categories":["travel","旅遊住宿"],"rate":0.03}]'::jsonb,
   '[{"channels":["foreign"],"rate":0.035}]'::jsonb,
   '示範資料，以公告為準')
  on conflict (id) do nothing;

insert into card_rules (id, name, issuer, annual_fee, base_reward_rate, category_bonuses, channel_bonuses, notes) values
  ('demo-allround',
   '全方位卡 (示範)', '示範銀行', 0, 0.015,
   '[]'::jsonb,
   '[]'::jsonb,
   '示範資料，無類別加碼但基礎回饋率較高')
  on conflict (id) do nothing;

insert into card_rules (id, name, issuer, annual_fee, base_reward_rate, category_bonuses, channel_bonuses, notes) values
  ('demo-platinum',
   '白金尊榮卡 (示範)', '示範銀行', 3000, 0.02,
   '[{"categories":["travel","旅遊住宿","dining","餐飲"],"rate":0.04}]'::jsonb,
   '[{"channels":["foreign"],"rate":0.04}]'::jsonb,
   '示範資料；高年費但全類別 2% 起跳')
  on conflict (id) do nothing;
