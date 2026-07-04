import { createClient } from '@supabase/supabase-js';

// Types
export interface Product {
  id: string;
  name: string;
  price: number;
  created_at?: string;
}

export interface Order {
  id: string;
  total_amount: number;
  payment_received: number;
  change_given: number;
  created_at?: string;
  items?: OrderItem[]; // UIで表示しやすいように結合した情報
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
  created_at?: string;
}

export interface SourcingItem {
  id: string;
  item_name: string;
  quantity: number;
  unit: string;
  cost: number;
  purchase_date: string;
  notes?: string;
  created_at?: string;
}

export interface CashDrawerLog {
  id: string;
  log_type: '準備金設定' | '金銭回収' | '釣銭補充' | '両替' | 'その他';
  amount: number;
  description?: string;
  created_at?: string;
}

export interface CashCount {
  id: string;
  bill_10000: number;
  bill_5000: number;
  bill_1000: number;
  coin_500: number;
  coin_100: number;
  coin_50: number;
  coin_10: number;
  coin_5: number;
  coin_1: number;
  counted_total: number;
  expected_total: number;
  discrepancy: number;
  created_at?: string;
}

export interface SalesDashboardData {
  totalSales: number;
  totalCost: number;
  netProfit: number;
  margin: number;
  ordersCount: number;
  itemsSold: { [productName: string]: number };
  recentOrders: Order[];
  // Cash stats [NEW]
  expectedCash: number;
  lastDiscrepancy: number | null;
  hasCashDrawerSetup: boolean;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return supabaseUrl.trim() !== '' && supabaseAnonKey.trim() !== '';
};

const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ==========================================
// MOCK DATABASE LOGIC (LocalStorage Fallback)
// ==========================================

const MOCK_PRODUCTS_KEY = 'sales_app_pos_products';
const MOCK_SOURCING_KEY = 'sales_app_pos_sourcing';
const MOCK_ORDERS_KEY = 'sales_app_pos_orders';
const MOCK_ORDER_ITEMS_KEY = 'sales_app_pos_order_items';
const MOCK_CASH_LOGS_KEY = 'sales_app_pos_cash_logs';
const MOCK_CASH_COUNTS_KEY = 'sales_app_pos_cash_counts';

// 旧データの自動クリーンアップ用マイグレーション
if (typeof window !== 'undefined') {
  const storedProducts = localStorage.getItem(MOCK_PRODUCTS_KEY);
  if (storedProducts) {
    try {
      const list = JSON.parse(storedProducts);
      if (Array.isArray(list) && list.some((p: any) => p.name && (p.name.includes('（普通）') || p.name === 'カレー（普通）'))) {
        localStorage.removeItem(MOCK_PRODUCTS_KEY);
        localStorage.removeItem(MOCK_ORDERS_KEY);
        localStorage.removeItem(MOCK_ORDER_ITEMS_KEY);
        localStorage.removeItem(MOCK_CASH_LOGS_KEY);
        localStorage.removeItem(MOCK_CASH_COUNTS_KEY);
      }
    } catch (e) {
      console.error(e);
    }
  }
}

const initialProducts: Product[] = [
  { id: 'p1', name: 'カレー', price: 500 },
  { id: 'p2', name: '水', price: 100 },
  { id: 'p3', name: '炭酸水', price: 100 },
];

const initialSourcing: SourcingItem[] = [
  { id: 's1', item_name: '牛肉 (カレー用)', quantity: 5, unit: 'kg', cost: 8500, purchase_date: '2026-06-25', notes: '学祭前日仕入れ' },
  { id: 's2', item_name: '玉ねぎ・人参・ジャガイモ', quantity: 1, unit: 'セット', cost: 2500, purchase_date: '2026-06-25', notes: '近所のスーパー' },
  { id: 's3', item_name: '米 (コシヒカリ)', quantity: 15, unit: 'kg', cost: 5400, purchase_date: '2026-06-25', notes: 'コメ兵' },
  { id: 's4', item_name: 'カレールー', quantity: 6, unit: '箱', cost: 1800, purchase_date: '2026-06-25', notes: '中辛' },
  { id: 's5', item_name: 'ミネラルウォーター (500ml)', quantity: 72, unit: '本', cost: 3600, purchase_date: '2026-06-26', notes: '問屋仕入れ' },
  { id: 's6', item_name: '使い捨てカレー皿', quantity: 150, unit: '枚', cost: 2200, purchase_date: '2026-06-26', notes: '資材消耗品' },
  { id: 's7', item_name: 'プラスチックスプーン', quantity: 150, unit: '本', cost: 800, purchase_date: '2026-06-26', notes: '資材消耗品' },
];

// 初期注文データ (最初は空から開始)
const initialOrders: Order[] = [];

// 初期注文明細データ
const initialOrderItems: OrderItem[] = [];

// 初期レジ金入出金ログ (最初は未設定から開始)
const initialCashLogs: CashDrawerLog[] = [];

const getLocalStorage = <T>(key: string, initialData: T[]): T[] => {
  if (typeof window === 'undefined') return initialData;
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(initialData));
    return initialData;
  }
  return JSON.parse(data);
};

const setLocalStorage = <T>(key: string, data: T[]): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data));
  }
};

// ==========================================
// DATABASE API INTERFACE
// ==========================================

// 1. PRODUCTS (MENU) API
export const getProducts = async (): Promise<Product[]> => {
  if (supabase) {
    const { data, error } = await supabase.from('products').select('*').order('name');
    if (error) throw error;
    return data || [];
  } else {
    return getLocalStorage<Product>(MOCK_PRODUCTS_KEY, initialProducts);
  }
};

// 2. SOURCING (経費) API
export const getSourcing = async (): Promise<SourcingItem[]> => {
  if (supabase) {
    const { data, error } = await supabase.from('sourcing').select('*').order('purchase_date', { ascending: false });
    if (error) throw error;
    return data || [];
  } else {
    return getLocalStorage<SourcingItem>(MOCK_SOURCING_KEY, initialSourcing);
  }
};

export const addSourcingItem = async (item: Omit<SourcingItem, 'id'>): Promise<SourcingItem> => {
  if (supabase) {
    const { data, error } = await supabase.from('sourcing').insert([item]).select();
    if (error) throw error;
    return data[0];
  } else {
    const items = await getSourcing();
    const newItem: SourcingItem = {
      ...item,
      id: 's_' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    items.unshift(newItem);
    setLocalStorage(MOCK_SOURCING_KEY, items);
    return newItem;
  }
};

export const deleteSourcingItem = async (id: string): Promise<void> => {
  if (supabase) {
    const { error } = await supabase.from('sourcing').delete().eq('id', id);
    if (error) throw error;
  } else {
    const items = await getSourcing();
    const filtered = items.filter(i => i.id !== id);
    setLocalStorage(MOCK_SOURCING_KEY, filtered);
  }
};

// 3. CASH DRAWER LOGS (金銭・両替) API
export const getCashLogs = async (): Promise<CashDrawerLog[]> => {
  if (supabase) {
    const { data, error } = await supabase.from('cash_drawer_logs').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } else {
    return getLocalStorage<CashDrawerLog>(MOCK_CASH_LOGS_KEY, initialCashLogs);
  }
};

export const addCashLog = async (log: Omit<CashDrawerLog, 'id'>): Promise<CashDrawerLog> => {
  if (supabase) {
    const { data, error } = await supabase.from('cash_drawer_logs').insert([log]).select();
    if (error) throw error;
    return data[0];
  } else {
    const logs = await getCashLogs();
    const newLog: CashDrawerLog = {
      ...log,
      id: 'cl_' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    logs.unshift(newLog);
    setLocalStorage(MOCK_CASH_LOGS_KEY, logs);
    return newLog;
  }
};

// 4. CASH COUNTS (監査) API
export const getCashCounts = async (): Promise<CashCount[]> => {
  if (supabase) {
    const { data, error } = await supabase.from('cash_counts').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } else {
    return getLocalStorage<CashCount>(MOCK_CASH_COUNTS_KEY, []);
  }
};

export const addCashCount = async (
  count: Omit<CashCount, 'id' | 'counted_total' | 'expected_total' | 'discrepancy'>,
  expectedTotal: number
): Promise<CashCount> => {
  // 実測金額の計算
  const countedTotal = 
    count.bill_10000 * 10000 +
    count.bill_5000 * 5000 +
    count.bill_1000 * 1000 +
    count.coin_500 * 500 +
    count.coin_100 * 100 +
    count.coin_50 * 50 +
    count.coin_10 * 10 +
    count.coin_5 * 5 +
    count.coin_1 * 1;

  const discrepancy = countedTotal - expectedTotal;

  if (supabase) {
    const { data, error } = await supabase
      .from('cash_counts')
      .insert([{
        ...count,
        counted_total: countedTotal,
        expected_total: expectedTotal,
        discrepancy: discrepancy
      }])
      .select();
    if (error) throw error;
    return data[0];
  } else {
    const counts = await getCashCounts();
    const newCount: CashCount = {
      ...count,
      id: 'cc_' + Math.random().toString(36).substr(2, 9),
      counted_total: countedTotal,
      expected_total: expectedTotal,
      discrepancy: discrepancy,
      created_at: new Date().toISOString()
    };
    counts.unshift(newCount);
    setLocalStorage(MOCK_CASH_COUNTS_KEY, counts);
    return newCount;
  }
};

// 5. EXPECTED CASH IN REGISTER (理論レジ金残高の算出)
export const getExpectedCash = async (): Promise<number> => {
  let logs: any[] = [];
  let orders: any[] = [];

  if (supabase) {
    const [logsRes, ordersRes] = await Promise.all([
      supabase.from('cash_drawer_logs').select('amount'),
      supabase.from('orders').select('total_amount')
    ]);
    logs = logsRes.data || [];
    orders = ordersRes.data || [];
  } else {
    logs = getLocalStorage<CashDrawerLog>(MOCK_CASH_LOGS_KEY, initialCashLogs);
    orders = getLocalStorage<Order>(MOCK_ORDERS_KEY, initialOrders);
  }

  const logsSum = logs.reduce((sum, l) => sum + Number(l.amount), 0);
  const salesSum = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);

  return logsSum + salesSum;
};

// 6. ORDERS & ITEMS (売上) API
export const createOrder = async (
  orderData: Omit<Order, 'id'>, 
  itemsData: Array<{ product_id: string; product_name: string; quantity: number; price: number }>
): Promise<Order> => {
  if (supabase) {
    const { data: orderResult, error: orderError } = await supabase
      .from('orders')
      .insert([{
        total_amount: orderData.total_amount,
        payment_received: orderData.payment_received,
        change_given: orderData.change_given
      }])
      .select();

    if (orderError) throw orderError;
    const newOrder = orderResult[0];

    const orderItems = itemsData.map(item => ({
      order_id: newOrder.id,
      product_id: item.product_id || null,
      product_name: item.product_name,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) {
      await supabase.from('orders').delete().eq('id', newOrder.id);
      throw itemsError;
    }

    return newOrder;
  } else {
    const orders = getLocalStorage<Order>(MOCK_ORDERS_KEY, initialOrders);
    const orderItems = getLocalStorage<OrderItem>(MOCK_ORDER_ITEMS_KEY, initialOrderItems);

    const newOrderId = 'o_' + Math.random().toString(36).substr(2, 9);
    const newOrder: Order = {
      ...orderData,
      id: newOrderId,
      created_at: new Date().toISOString()
    };

    const newItems: OrderItem[] = itemsData.map(item => ({
      id: 'oi_' + Math.random().toString(36).substr(2, 9),
      order_id: newOrderId,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity,
      created_at: new Date().toISOString()
    }));

    orders.unshift(newOrder);
    setLocalStorage(MOCK_ORDERS_KEY, orders);

    orderItems.push(...newItems);
    setLocalStorage(MOCK_ORDER_ITEMS_KEY, orderItems);

    return {
      ...newOrder,
      items: newItems
    };
  }
};

export const deleteOrder = async (orderId: string): Promise<void> => {
  if (supabase) {
    const { error } = await supabase.from('orders').delete().eq('id', orderId);
    if (error) throw error;
  } else {
    const orders = getLocalStorage<Order>(MOCK_ORDERS_KEY, initialOrders);
    const orderItems = getLocalStorage<OrderItem>(MOCK_ORDER_ITEMS_KEY, initialOrderItems);

    const filteredOrders = orders.filter(o => o.id !== orderId);
    const filteredItems = orderItems.filter(oi => oi.order_id !== orderId);

    setLocalStorage(MOCK_ORDERS_KEY, filteredOrders);
    setLocalStorage(MOCK_ORDER_ITEMS_KEY, filteredItems);
  }
};

// 7. INTEGRATED DASHBOARD AGGREGATES
export const getSalesDashboard = async (): Promise<SalesDashboardData> => {
  let orders: Order[] = [];
  let orderItems: OrderItem[] = [];
  let sourcing: SourcingItem[] = [];
  let cashLogs: CashDrawerLog[] = [];
  let cashCounts: CashCount[] = [];

  if (supabase) {
    const [ordersRes, orderItemsRes, sourcingRes, cashLogsRes, cashCountsRes] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('order_items').select('*'),
      supabase.from('sourcing').select('*'),
      supabase.from('cash_drawer_logs').select('*'),
      supabase.from('cash_counts').select('*').order('created_at', { ascending: false }).limit(1)
    ]);

    if (ordersRes.error) throw ordersRes.error;
    if (orderItemsRes.error) throw orderItemsRes.error;
    if (sourcingRes.error) throw sourcingRes.error;
    if (cashLogsRes.error) throw cashLogsRes.error;
    if (cashCountsRes.error) throw cashCountsRes.error;

    orders = ordersRes.data || [];
    orderItems = orderItemsRes.data || [];
    sourcing = sourcingRes.data || [];
    cashLogs = cashLogsRes.data || [];
    cashCounts = cashCountsRes.data || [];
  } else {
    orders = getLocalStorage<Order>(MOCK_ORDERS_KEY, initialOrders);
    orderItems = getLocalStorage<OrderItem>(MOCK_ORDER_ITEMS_KEY, initialOrderItems);
    sourcing = getLocalStorage<SourcingItem>(MOCK_SOURCING_KEY, initialSourcing);
    cashLogs = getLocalStorage<CashDrawerLog>(MOCK_CASH_LOGS_KEY, initialCashLogs);
    cashCounts = getLocalStorage<CashCount>(MOCK_CASH_COUNTS_KEY, []);
  }

  // 1. 売上集計
  const totalSales = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);

  // 2. 仕入れ集計
  const totalCost = sourcing.reduce((sum, s) => sum + Number(s.cost), 0);

  // 3. 純利益 & 利益率
  const netProfit = totalSales - totalCost;
  const margin = totalSales > 0 ? Math.round((netProfit / totalSales) * 100) : 0;

  // 4. 商品ごとの販売数集計
  const itemsSold: { [productName: string]: number } = {};
  orderItems.forEach(item => {
    itemsSold[item.product_name] = (itemsSold[item.product_name] || 0) + item.quantity;
  });

  // 5. 直近の注文に明細を紐づける
  const recentOrders = orders.slice(0, 10).map(order => {
    const items = orderItems.filter(oi => oi.order_id === order.id);
    return {
      ...order,
      items
    };
  });

  // 6. レジ内理論金残高
  const logsSum = cashLogs.reduce((sum, l) => sum + Number(l.amount), 0);
  const expectedCash = logsSum + totalSales;

  // 7. 最新の過不足額
  const lastDiscrepancy = cashCounts.length > 0 ? Number(cashCounts[0].discrepancy) : null;

  // 8. 準備金設定が存在するかどうか
  const hasCashDrawerSetup = cashLogs.some(l => l.log_type === '準備金設定');

  return {
    totalSales,
    totalCost,
    netProfit,
    margin,
    ordersCount: orders.length,
    itemsSold,
    recentOrders,
    expectedCash,
    lastDiscrepancy,
    hasCashDrawerSetup
  };
};
