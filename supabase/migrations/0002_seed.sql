-- 0002_seed.sql
-- 示範用信用卡規則種子資料。本資料仅為示範，請以各發卡機構公告規則為準。

insert into card_rules (id, name, issuer, annual_fee, base_reward_rate, category_bonuses, channel_bonuses, notes)
values
  ('demo-cube', 'CUBE 卡 (示範)', '國泰世華', 0, 0.005,
    '[{"categories":["餐飲","超商量販"],"rate":0.03,"cap":{"period":"month","amount":1000}}]'::jsonb,
    '[{"channels":["online"],"rate":0.03,"cap":{"period":"month","amount":500}}]'::jsonb,
    '示範資料，以公告為準')
  on conflict (id) do nothing;

insert into card_rules (id, name, issuer, annual_fee, base_reward_rate, category_bonuses, channel_bonuses, notes)
values
  ('demo-richart', '富邦入門 (示範)', '台新', 0, 0.01,
    '[{"categories":["交通","網路購物"],"rate":0.025,"cap":{"period":"month","amount":800}}]'::jsonb,
    '[]'::jsonb,
    '示範資料，以公告為準')
  on conflict (id) do nothing;

insert into card_rules (id, name, issuer, annual_fee, base_reward_rate, category_bonuses, channel_bonuses, notes)
values
  ('demo-eva', 'EVA 聯名卡 (示範)', '台新', 800, 0.005,
    '[{"categories":["旅遊住宿"],"rate":0.02}]'::jsonb,
    '[{"channels":["foreign"],"rate":0.025}]'::jsonb,
    '示範資料，以公告為準')
  on conflict (id) do nothing;
