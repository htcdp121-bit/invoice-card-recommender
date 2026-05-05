-- 0001_init.sql
-- 建立信用卡規則表、任務表與仰貴名詞字典表。
-- 本專案務另外使用 service role key 進行寫入，前端不直接存取本資料表。

create extension if not exists pgcrypto;

create table if not exists card_rules (
  id text primary key,
  name text not null,
  issuer text not null,
  annual_fee integer not null default 0,
  fee_waiver_rule text,
  base_reward_rate numeric not null default 0,
  category_bonuses jsonb not null default '[]'::jsonb,
  channel_bonuses jsonb not null default '[]'::jsonb,
  notes text,
  updated_at timestamptz not null default now()
);

create table if not exists jobs (
  id uuid primary key,
  status text not null check (status in ('pending','running','done','error')),
  params jsonb not null,
  result jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobs_created_at_idx on jobs (created_at desc);

create table if not exists taxid_dict (
  hash text primary key,
  category text not null,
  channel text,
  notes text
);

create index if not exists taxid_dict_category_idx on taxid_dict (category);
