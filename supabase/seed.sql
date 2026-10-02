-- Seed IconLab with the current default catalog.
-- Run after supabase/schema.sql.

insert into public.products (id, payload, active, sort_order) values
('rm-home', '{"id":"rm-home","name":"Real Madrid Home 25/26","team":"Real Madrid","price":4500,"oldPrice":5500,"stock":25,"customizable":true,"badge":"Best Seller","colors":[{"name":"White","hex":"#f2f2f0"},{"name":"Black","hex":"#15151a"},{"name":"Gold Edition","hex":"#d4af37"}],"sizes":["S","M","L","XL","XXL"],"description":"قميص الريال الأساسي قابل للتخصيص بالاسم والرقم.","pattern":"stripes"}'::jsonb,true,10),
('dz-home', '{"id":"dz-home","name":"Algeria Home 2026","team":"Les Fennecs","price":4200,"oldPrice":null,"stock":40,"customizable":true,"badge":"New","colors":[{"name":"White","hex":"#f2f2f0"},{"name":"Green","hex":"#0a6640"}],"sizes":["S","M","L","XL","XXL"],"description":"قميص الجزائر الأساسي قابل للتخصيص بالاسم والرقم.","pattern":"plain"}'::jsonb,true,20),
('psg-away', '{"id":"psg-away","name":"PSG Away 25/26","team":"Paris Saint-Germain","price":4800,"oldPrice":null,"stock":18,"customizable":true,"badge":null,"colors":[{"name":"Navy","hex":"#1b2a4a"},{"name":"Red","hex":"#b01e28"}],"sizes":["S","M","L","XL"],"description":"قميص باريس سان جيرمان الخارجي قابل للتخصيص بالكامل.","pattern":"plain"}'::jsonb,true,30),
('barca-home', '{"id":"barca-home","name":"Barcelona Home 25/26","team":"FC Barcelona","price":4600,"oldPrice":5200,"stock":0,"customizable":true,"badge":"Sold Out","colors":[{"name":"Blue/Red","hex":"#a50044"},{"name":"Classic","hex":"#004d98"}],"sizes":["M","L","XL"],"description":"قميص برشلونة بخطوط البلوغرانا مع إمكانية التخصيص.","pattern":"blaugrana"}'::jsonb,true,40),
('mc-third', '{"id":"mc-third","name":"Man City Third 25/26","team":"Manchester City","price":4400,"oldPrice":null,"stock":22,"customizable":true,"badge":null,"colors":[{"name":"Sky","hex":"#6cabdd"},{"name":"Black","hex":"#15151a"}],"sizes":["S","M","L","XL","XXL"],"description":"قميص مانشستر سيتي الثالث قابل للتخصيص.","pattern":"plain"}'::jsonb,true,50),
('retro-90', '{"id":"retro-90","name":"Retro Classics 90s","team":"IconLab Retro","price":3900,"oldPrice":null,"stock":30,"customizable":false,"badge":"Limited","colors":[{"name":"Red","hex":"#b01e28"},{"name":"White","hex":"#f2f2f0"}],"sizes":["S","M","L","XL"],"description":"إصدار ريترو كلاسيكي مستوحى من التسعينات.","pattern":"retro"}'::jsonb,true,60)
on conflict (id) do update set
  payload = excluded.payload,
  active = excluded.active,
  sort_order = excluded.sort_order,
  updated_at = now();
