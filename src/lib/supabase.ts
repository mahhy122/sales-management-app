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
  event_id?: string;
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
  event_id?: string;
}

export interface CashDrawerLog {
  id: string;
  log_type: '準備金設定' | '金銭回収' | '釣銭補充' | '両替' | 'その他';
  amount: number;
  description?: string;
  created_at?: string;
  event_id?: string;
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
  event_id?: string;
}

export interface Event {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
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
  // Chart Data [NEW]
  salesTrend: Array<{ time: string; amount: number }>;
  hourlySales: Array<{ hour: string; amount: number; count: number }>;
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
const MOCK_EVENTS_KEY = 'sales_app_pos_events';

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

const initialEvents: Event[] = [
  { id: 'e_ecofest2026', name: 'エコフェス2026', is_active: true, created_at: new Date('2026-06-25T09:00:00Z').toISOString() }
];

const initialSourcing: SourcingItem[] = [
  { id: 's1', item_name: '牛肉 (カレー用)', quantity: 5, unit: 'kg', cost: 8500, purchase_date: '2026-06-25', notes: '学祭前日仕入れ', event_id: 'e_ecofest2026' },
  { id: 's2', item_name: '玉ねぎ・人参・ジャガイモ', quantity: 1, unit: 'セット', cost: 2500, purchase_date: '2026-06-25', notes: '近所のスーパー', event_id: 'e_ecofest2026' },
  { id: 's3', item_name: '米 (コシヒカリ)', quantity: 15, unit: 'kg', cost: 5400, purchase_date: '2026-06-25', notes: 'コメ兵', event_id: 'e_ecofest2026' },
  { id: 's4', item_name: 'カレールー', quantity: 6, unit: '箱', cost: 1800, purchase_date: '2026-06-25', notes: '中辛', event_id: 'e_ecofest2026' },
  { id: 's5', item_name: 'ミネラルウォーター (500ml)', quantity: 72, unit: '本', cost: 3600, purchase_date: '2026-06-26', notes: '問屋仕入れ', event_id: 'e_ecofest2026' },
  { id: 's6', item_name: '使い捨てカレー皿', quantity: 150, unit: '枚', cost: 2200, purchase_date: '2026-06-26', notes: '資材消耗品', event_id: 'e_ecofest2026' },
  { id: 's7', item_name: 'プラスチックスプーン', quantity: 150, unit: '本', cost: 800, purchase_date: '2026-06-26', notes: '資材消耗品', event_id: 'e_ecofest2026' },
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

const getSelectedEventIdSync = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('selected_event_id');
  }
  return null;
};

export const getFilterEventId = async (): Promise<string | null> => {
  const syncId = getSelectedEventIdSync();
  if (syncId) return syncId;

  const active = await getActiveEvent();
  if (active) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selected_event_id', active.id);
    }
    return active.id;
  }
  return null;
};

export const getEvents = async (): Promise<Event[]> => {
  if (supabase) {
    const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    
    // Self-healing: If no events exist in Supabase, automatically create the default event
    if (!data || data.length === 0) {
      try {
        const defaultEvent = await createEvent('エコフェス2026');
        return [defaultEvent];
      } catch (err) {
        console.error('Failed to auto-seed default event in Supabase:', err);
      }
    }
    return data || [];
  } else {
    return getLocalStorage<Event>(MOCK_EVENTS_KEY, initialEvents);
  }
};

export const getActiveEvent = async (): Promise<Event | null> => {
  if (supabase) {
    const { data, error } = await supabase.from('events').select('*').eq('is_active', true).limit(1);
    if (error) throw error;
    
    if (!data || data.length === 0) {
      const allEvents = await getEvents();
      return allEvents.length > 0 ? allEvents.find(e => e.is_active) || allEvents[0] : null;
    }
    return data[0];
  } else {
    const events = getLocalStorage<Event>(MOCK_EVENTS_KEY, initialEvents);
    const active = events.find(e => e.is_active);
    return active || null;
  }
};

export const createEvent = async (name: string): Promise<Event> => {
  if (supabase) {
    await supabase.from('events').update({ is_active: false }).eq('is_active', true);
    const { data, error } = await supabase.from('events').insert([{ name, is_active: true }]).select();
    if (error) throw error;
    return data[0];
  } else {
    const events = getLocalStorage<Event>(MOCK_EVENTS_KEY, initialEvents);
    const updatedEvents = events.map(e => ({ ...e, is_active: false }));
    const newEvent: Event = {
      id: 'e_' + Math.random().toString(36).substr(2, 9),
      name,
      is_active: true,
      created_at: new Date().toISOString()
    };
    updatedEvents.push(newEvent);
    setLocalStorage(MOCK_EVENTS_KEY, updatedEvents);
    return newEvent;
  }
};

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

export const addProduct = async (name: string, price: number): Promise<Product> => {
  if (supabase) {
    const { data, error } = await supabase
      .from('products')
      .insert([{ name, price }])
      .select();
    if (error) throw error;
    return data[0];
  } else {
    const products = getLocalStorage<Product>(MOCK_PRODUCTS_KEY, initialProducts);
    const newProduct: Product = {
      id: 'p_' + Math.random().toString(36).substr(2, 9),
      name,
      price,
      created_at: new Date().toISOString()
    };
    products.push(newProduct);
    setLocalStorage(MOCK_PRODUCTS_KEY, products);
    return newProduct;
  }
};

export const updateProduct = async (id: string, name: string, price: number): Promise<Product> => {
  if (supabase) {
    const { data, error } = await supabase
      .from('products')
      .update({ name, price })
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  } else {
    const products = getLocalStorage<Product>(MOCK_PRODUCTS_KEY, initialProducts);
    const updated = products.map(p => p.id === id ? { ...p, name, price } : p);
    setLocalStorage(MOCK_PRODUCTS_KEY, updated);
    return updated.find(p => p.id === id)!;
  }
};

export const deleteProduct = async (id: string): Promise<void> => {
  if (supabase) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  } else {
    const products = getLocalStorage<Product>(MOCK_PRODUCTS_KEY, initialProducts);
    const filtered = products.filter(p => p.id !== id);
    setLocalStorage(MOCK_PRODUCTS_KEY, filtered);
  }
};

// 2. SOURCING (経費) API
export const getSourcing = async (): Promise<SourcingItem[]> => {
  const eventId = await getFilterEventId();
  if (supabase) {
    let query = supabase.from('sourcing').select('*').order('purchase_date', { ascending: false });
    if (eventId) {
      query = query.eq('event_id', eventId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } else {
    const items = getLocalStorage<SourcingItem>(MOCK_SOURCING_KEY, initialSourcing);
    return eventId ? items.filter(i => i.event_id === eventId) : items;
  }
};

export const addSourcingItem = async (item: Omit<SourcingItem, 'id'>): Promise<SourcingItem> => {
  const eventId = await getFilterEventId();
  if (supabase) {
    const { data, error } = await supabase
      .from('sourcing')
      .insert([{ ...item, event_id: eventId }])
      .select();
    if (error) throw error;
    return data[0];
  } else {
    const items = getLocalStorage<SourcingItem>(MOCK_SOURCING_KEY, initialSourcing);
    const newItem: SourcingItem = {
      ...item,
      id: 's_' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      event_id: eventId || undefined
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
    const items = getLocalStorage<SourcingItem>(MOCK_SOURCING_KEY, initialSourcing);
    const filtered = items.filter(i => i.id !== id);
    setLocalStorage(MOCK_SOURCING_KEY, filtered);
  }
};

// 3. CASH DRAWER LOGS (金銭・両替) API
export const getCashLogs = async (): Promise<CashDrawerLog[]> => {
  const eventId = await getFilterEventId();
  if (supabase) {
    let query = supabase.from('cash_drawer_logs').select('*').order('created_at', { ascending: false });
    if (eventId) {
      query = query.eq('event_id', eventId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } else {
    const logs = getLocalStorage<CashDrawerLog>(MOCK_CASH_LOGS_KEY, initialCashLogs);
    return eventId ? logs.filter(l => l.event_id === eventId) : logs;
  }
};

export const addCashLog = async (log: Omit<CashDrawerLog, 'id'>): Promise<CashDrawerLog> => {
  const eventId = await getFilterEventId();
  if (supabase) {
    const { data, error } = await supabase
      .from('cash_drawer_logs')
      .insert([{ ...log, event_id: eventId }])
      .select();
    if (error) throw error;
    return data[0];
  } else {
    const logs = getLocalStorage<CashDrawerLog>(MOCK_CASH_LOGS_KEY, initialCashLogs);
    const newLog: CashDrawerLog = {
      ...log,
      id: 'cl_' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      event_id: eventId || undefined
    };
    logs.unshift(newLog);
    setLocalStorage(MOCK_CASH_LOGS_KEY, logs);
    return newLog;
  }
};

// 4. CASH COUNTS (監査) API
export const getCashCounts = async (): Promise<CashCount[]> => {
  const eventId = await getFilterEventId();
  if (supabase) {
    let query = supabase.from('cash_counts').select('*').order('created_at', { ascending: false });
    if (eventId) {
      query = query.eq('event_id', eventId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } else {
    const counts = getLocalStorage<CashCount>(MOCK_CASH_COUNTS_KEY, []);
    return eventId ? counts.filter(c => c.event_id === eventId) : counts;
  }
};

export const addCashCount = async (
  count: Omit<CashCount, 'id' | 'counted_total' | 'expected_total' | 'discrepancy'>,
  expectedTotal: number
): Promise<CashCount> => {
  const eventId = await getFilterEventId();
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
        discrepancy: discrepancy,
        event_id: eventId
      }])
      .select();
    if (error) throw error;
    return data[0];
  } else {
    const counts = getLocalStorage<CashCount>(MOCK_CASH_COUNTS_KEY, []);
    const newCount: CashCount = {
      ...count,
      id: 'cc_' + Math.random().toString(36).substr(2, 9),
      counted_total: countedTotal,
      expected_total: expectedTotal,
      discrepancy: discrepancy,
      created_at: new Date().toISOString(),
      event_id: eventId || undefined
    };
    counts.unshift(newCount);
    setLocalStorage(MOCK_CASH_COUNTS_KEY, counts);
    return newCount;
  }
};

// 5. EXPECTED CASH IN REGISTER (理論レジ金残高の算出)
export const getExpectedCash = async (): Promise<number> => {
  const dashboard = await getSalesDashboard();
  return dashboard.expectedCash;
};

// 6. ORDERS & ITEMS (売上) API
export const createOrder = async (
  orderData: Omit<Order, 'id'>, 
  itemsData: Array<{ product_id: string; product_name: string; quantity: number; price: number }>
): Promise<Order> => {
  const eventId = await getFilterEventId();
  if (supabase) {
    const { data: orderResult, error: orderError } = await supabase
      .from('orders')
      .insert([{
        total_amount: orderData.total_amount,
        payment_received: orderData.payment_received,
        change_given: orderData.change_given,
        event_id: eventId
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
      created_at: new Date().toISOString(),
      event_id: eventId || undefined
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

export const getOrders = async (): Promise<Order[]> => {
  const eventId = await getFilterEventId();
  let orders: Order[] = [];
  let orderItems: OrderItem[] = [];

  if (supabase) {
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (eventId) {
      query = query.eq('event_id', eventId);
    }
    const [ordersRes, orderItemsRes] = await Promise.all([
      query,
      supabase.from('order_items').select('*')
    ]);

    if (ordersRes.error) throw ordersRes.error;
    if (orderItemsRes.error) throw orderItemsRes.error;

    orders = ordersRes.data || [];
    orderItems = orderItemsRes.data || [];
  } else {
    orders = getLocalStorage<Order>(MOCK_ORDERS_KEY, initialOrders);
    orderItems = getLocalStorage<OrderItem>(MOCK_ORDER_ITEMS_KEY, initialOrderItems);

    if (eventId) {
      orders = orders.filter(o => o.event_id === eventId);
    }
  }

  return orders.map(order => {
    const items = orderItems.filter(oi => oi.order_id === order.id);
    return {
      ...order,
      items
    };
  });
};

// 7. INTEGRATED DASHBOARD AGGREGATES
export const getSalesDashboard = async (): Promise<SalesDashboardData> => {
  const eventId = await getFilterEventId();
  let orders: Order[] = [];
  let orderItems: OrderItem[] = [];
  let sourcing: SourcingItem[] = [];
  let cashLogs: CashDrawerLog[] = [];
  let cashCounts: CashCount[] = [];

  if (supabase) {
    let ordersQuery = supabase.from('orders').select('*').order('created_at', { ascending: false });
    let sourcingQuery = supabase.from('sourcing').select('*');
    let cashLogsQuery = supabase.from('cash_drawer_logs').select('*');
    let cashCountsQuery = supabase.from('cash_counts').select('*').order('created_at', { ascending: false });

    if (eventId) {
      ordersQuery = ordersQuery.eq('event_id', eventId);
      sourcingQuery = sourcingQuery.eq('event_id', eventId);
      cashLogsQuery = cashLogsQuery.eq('event_id', eventId);
      cashCountsQuery = cashCountsQuery.eq('event_id', eventId);
    }

    const [ordersRes, orderItemsRes, sourcingRes, cashLogsRes, cashCountsRes] = await Promise.all([
      ordersQuery,
      supabase.from('order_items').select('*'),
      sourcingQuery,
      cashLogsQuery,
      cashCountsQuery.limit(1)
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

    if (eventId) {
      orders = orders.filter(o => o.event_id === eventId);
      sourcing = sourcing.filter(s => s.event_id === eventId);
      cashLogs = cashLogs.filter(l => l.event_id === eventId);
      cashCounts = cashCounts.filter(c => c.event_id === eventId);
    }
  }

  // 1. 売上集計
  const totalSales = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);

  // 2. 仕入れ集計
  const totalCost = sourcing.reduce((sum, s) => sum + Number(s.cost), 0);

  // 3. 純利益 & 利益率
  const netProfit = totalSales - totalCost;
  const margin = totalSales > 0 ? Math.round((netProfit / totalSales) * 100) : 0;

  // 4. 商品ごとの販売数集計 (選択中イベントの注文明細のみカウント)
  const itemsSold: { [productName: string]: number } = {};
  const activeOrderIds = new Set(orders.map(o => o.id));
  const activeOrderItems = orderItems.filter(item => activeOrderIds.has(item.order_id));
  
  activeOrderItems.forEach(item => {
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

  // 6. レジ内理論金残高 (Baseline setup reset + subsequent logs & sales)
  const chronologicalLogs = [...cashLogs].sort(
    (a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime()
  );

  const lastSetupIndex = chronologicalLogs.map(l => l.log_type).lastIndexOf('準備金設定');
  
  let expectedCash = 0;
  
  if (lastSetupIndex !== -1) {
    const baselineAmount = Number(chronologicalLogs[lastSetupIndex].amount);
    const setupTime = new Date(chronologicalLogs[lastSetupIndex].created_at || '').getTime();
    
    // Sum active logs after the last setup
    const activeLogs = chronologicalLogs.slice(lastSetupIndex + 1);
    const activeLogsSum = activeLogs.reduce((sum, l) => {
      const amt = l.log_type === '金銭回収' ? -Math.abs(Number(l.amount)) : Number(l.amount);
      return sum + amt;
    }, 0);
    
    // Sum sales after setup time
    const activeSales = orders.filter(o => new Date(o.created_at || '').getTime() > setupTime);
    const activeSalesSum = activeSales.reduce((sum, o) => sum + Number(o.total_amount), 0);
    
    expectedCash = baselineAmount + activeLogsSum + activeSalesSum;
  } else {
    // If no setup found, sum all logs and sales
    const activeLogsSum = cashLogs.reduce((sum, l) => {
      const amt = l.log_type === '金銭回収' ? -Math.abs(Number(l.amount)) : Number(l.amount);
      return sum + amt;
    }, 0);
    expectedCash = activeLogsSum + totalSales;
  }

  // 7. 最新の過不足額
  const lastDiscrepancy = cashCounts.length > 0 ? Number(cashCounts[0].discrepancy) : null;

  // 8. 準備金設定が存在するかどうか
  const hasCashDrawerSetup = cashLogs.some(l => l.log_type === '準備金設定');

  // 9. 売上推移 (Sales Trend)
  const chronologicalOrders = [...orders].sort(
    (a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime()
  );

  let runningSum = 0;
  const salesTrend = chronologicalOrders.map(order => {
    runningSum += Number(order.total_amount);
    const date = new Date(order.created_at || '');
    const timeStr = date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    return {
      time: timeStr,
      amount: runningSum
    };
  });

  // If empty, add a default 0 point
  if (salesTrend.length === 0) {
    salesTrend.push({ time: '09:00', amount: 0 });
  } else {
    // Add a starting point at morning (30 mins before first sale)
    const firstOrderTime = new Date(chronologicalOrders[0].created_at || '').getTime();
    const startTimeStr = new Date(firstOrderTime - 1800000).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    salesTrend.unshift({ time: startTimeStr, amount: 0 });
  }

  // 10. 時間帯別の売上 (Hourly Sales)
  const hourlyMap: { [hour: number]: { amount: number; count: number } } = {};
  
  // Define standard hours for school festival (9:00 to 17:00)
  const startHour = 9;
  const endHour = 17;
  for (let h = startHour; h <= endHour; h++) {
    hourlyMap[h] = { amount: 0, count: 0 };
  }

  // Populate from actual orders
  orders.forEach(order => {
    const date = new Date(order.created_at || '');
    const hour = date.getHours();
    if (hour >= 0 && hour <= 23) {
      if (!hourlyMap[hour]) {
        hourlyMap[hour] = { amount: 0, count: 0 };
      }
      hourlyMap[hour].amount += Number(order.total_amount);
      hourlyMap[hour].count += 1;
    }
  });

  // Convert map to sorted array
  const hourlySales = Object.entries(hourlyMap)
    .map(([h, data]) => ({
      hour: `${h}:00`,
      amount: data.amount,
      count: data.count
    }))
    .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

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
    hasCashDrawerSetup,
    salesTrend,
    hourlySales
  };
};
