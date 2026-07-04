-- 学祭向けカレー・水販売レジ＆仕入れ利益・レジ金管理システム データベース スキーマ定義
-- このSQLをSupabaseの「SQL Editor」で実行することで、必要なテーブルが作成されます。

-- 1. 商品マスタテーブル
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    price NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 注文親テーブル
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total_amount NUMERIC NOT NULL,
    payment_received NUMERIC NOT NULL,
    change_given NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 注文明細テーブル
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price NUMERIC NOT NULL,
    subtotal NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. 仕入れ（経費）管理テーブル
CREATE TABLE IF NOT EXISTS public.sourcing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_name TEXT NOT NULL,
    quantity NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    cost NUMERIC NOT NULL,
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. レジ金入出金・両替ログテーブル
CREATE TABLE IF NOT EXISTS public.cash_drawer_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    log_type TEXT NOT NULL CHECK (log_type IN ('準備金設定', '金銭回収', '釣銭補充', '両替', 'その他')),
    amount NUMERIC NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. レジ金数え上げ監査履歴テーブル
CREATE TABLE IF NOT EXISTS public.cash_counts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_10000 INTEGER NOT NULL DEFAULT 0,
    bill_5000 INTEGER NOT NULL DEFAULT 0,
    bill_1000 INTEGER NOT NULL DEFAULT 0,
    coin_500 INTEGER NOT NULL DEFAULT 0,
    coin_100 INTEGER NOT NULL DEFAULT 0,
    coin_50 INTEGER NOT NULL DEFAULT 0,
    coin_10 INTEGER NOT NULL DEFAULT 0,
    coin_5 INTEGER NOT NULL DEFAULT 0,
    coin_1 INTEGER NOT NULL DEFAULT 0,
    counted_total NUMERIC NOT NULL,
    expected_total NUMERIC NOT NULL,
    discrepancy NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 初期データの登録

-- 旧マスタデータのクリーンアップ
DELETE FROM public.products WHERE name IN ('カレー（普通）', 'カレー（大盛）', 'トッピング（チーズ）', '水（ペットボトル）');

-- 商品マスタ
INSERT INTO public.products (name, price) VALUES
('カレー', 500),
('水', 100),
('炭酸水', 100)
ON CONFLICT (name) DO UPDATE SET price = EXCLUDED.price;

-- 仕入れ（経費）の初期データ (前日仕入れ分を想定)
INSERT INTO public.sourcing (item_name, quantity, unit, cost, purchase_date, notes) VALUES
('牛肉 (カレー用)', 5, 'kg', 8500, '2026-06-25', '学祭前日仕入れ'),
('玉ねぎ・人参・ジャガイモ', 1, 'セット', 2500, '2026-06-25', '近所のスーパー'),
('米 (コシヒカリ)', 15, 'kg', 5400, '2026-06-25', 'コメ兵'),
('カレールー', 6, '箱', 1800, '2026-06-25', '中辛'),
('ミネラルウォーター (500ml)', 72, '本', 3600, '2026-06-26', '問屋仕入れ'),
('使い捨てカレー皿', 150, '枚', 2200, '2026-06-26', '資材消耗品'),
('プラスチックスプーン', 150, '本', 800, '2026-06-26', '資材消耗品')
ON CONFLICT DO NOTHING;

-- レジ釣銭準備金の初期設定 (朝一番に釣銭用に30,000円を用意したと想定)
INSERT INTO public.cash_drawer_logs (log_type, amount, description, created_at) VALUES
('準備金設定', 30000, '釣銭準備金（千円札x20, 500円x10, 100円x40, 50円x16, 10円x20）', now() - interval '4 hours')
ON CONFLICT DO NOTHING;

-- テスト用の売上履歴の初期データ
DO $$
DECLARE
    order1_id UUID;
    order2_id UUID;
    prod_curry UUID;
    prod_water UUID;
BEGIN
    SELECT id INTO prod_curry FROM public.products WHERE name = 'カレー';
    SELECT id INTO prod_water FROM public.products WHERE name = '水';

    -- 注文1: カレー x1, 水 x1 (計 600円)
    INSERT INTO public.orders (total_amount, payment_received, change_given, created_at)
    VALUES (600, 1000, 400, now() - interval '2 hours') RETURNING id INTO order1_id;

    INSERT INTO public.order_items (order_id, product_id, product_name, quantity, price, subtotal, created_at)
    VALUES 
    (order1_id, prod_curry, 'カレー', 1, 500, 500, now() - interval '2 hours'),
    (order1_id, prod_water, '水', 1, 100, 100, now() - interval '2 hours');

    -- 注文2: カレー x2, 水 x1 (計 1100円)
    INSERT INTO public.orders (total_amount, payment_received, change_given, created_at)
    VALUES (1100, 2000, 900, now() - interval '30 minutes') RETURNING id INTO order2_id;

    INSERT INTO public.order_items (order_id, product_id, product_name, quantity, price, subtotal, created_at)
    VALUES 
    (order2_id, prod_curry, 'カレー', 2, 500, 1000, now() - interval '30 minutes'),
    (order2_id, prod_water, '水', 1, 100, 100, now() - interval '30 minutes');
END $$;

-- RLS (Row Level Security) の有効化 (パブリック読み書き許可)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sourcing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_drawer_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_counts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public write for products" ON public.products FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read for orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow public write for orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read for order_items" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Allow public write for order_items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read for sourcing" ON public.sourcing FOR SELECT USING (true);
CREATE POLICY "Allow public write for sourcing" ON public.sourcing FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read for cash_drawer_logs" ON public.cash_drawer_logs FOR SELECT USING (true);
CREATE POLICY "Allow public write for cash_drawer_logs" ON public.cash_drawer_logs FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read for cash_counts" ON public.cash_counts FOR SELECT USING (true);
CREATE POLICY "Allow public write for cash_counts" ON public.cash_counts FOR ALL USING (true) WITH CHECK (true);
