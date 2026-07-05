'use client';

import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Trash2, 
  Calendar, 
  Filter, 
  TrendingUp, 
  ShoppingBag, 
  AlertCircle,
  Clock
} from 'lucide-react';
import { getOrders, deleteOrder, Order, OrderItem } from '@/lib/supabase';
import SupabaseSetupBanner from '@/components/SupabaseSetupBanner';
import styles from './orders.module.css';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'custom'>('all');
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);

  // Load orders data
  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await getOrders();
      setOrders(data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load orders:', err);
      setError('注文履歴の読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Handle Order Deletion (Void)
  const handleDeleteOrder = async (orderId: string, amount: number) => {
    const isConfirmed = window.confirm(
      `合計金額 ${formatCurrency(amount)} の注文を削除（取消）してもよろしいですか？\n` +
      `【警告】この操作を行うと、売上データおよびレジ内現金、利益データから即座に差し引かれます。取り消したデータは復元できません。`
    );

    if (!isConfirmed) return;

    try {
      await deleteOrder(orderId);
      // Reload lists
      await loadOrders();
    } catch (err: any) {
      alert('注文の削除に失敗しました: ' + err.message);
    }
  };

  // Helper formatting functions
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(val);
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('ja-JP', { 
      year: 'numeric', 
      month: 'numeric', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const getShortId = (id: string) => {
    return id.substring(0, 8).toUpperCase();
  };

  // 1. FILTERING LOGIC
  const filteredOrders = orders.filter(order => {
    // A. Search query filter (Order ID parts)
    const matchesSearch = searchQuery.trim() === '' || 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getShortId(order.id).includes(searchQuery.toUpperCase());

    // B. Product filter
    const matchesProduct = selectedProduct === 'all' || 
      (order.items && order.items.some(item => item.product_name === selectedProduct));

    // C. Date filter
    let matchesDate = true;
    const orderDateLocal = new Date(order.created_at || '').toISOString().split('T')[0];
    const todayLocal = new Date().toISOString().split('T')[0];

    if (dateFilter === 'today') {
      matchesDate = orderDateLocal === todayLocal;
    } else if (dateFilter === 'custom') {
      matchesDate = orderDateLocal === customDate;
    }

    return matchesSearch && matchesProduct && matchesDate;
  });

  // 2. TALLY CALCULATIONS (From filtered orders)
  const totalSalesAmount = filteredOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  
  // Tally items sold in current filtered view
  const itemsTally: { [productName: string]: number } = {};
  filteredOrders.forEach(order => {
    if (order.items) {
      order.items.forEach(item => {
        itemsTally[item.product_name] = (itemsTally[item.product_name] || 0) + item.quantity;
      });
    }
  });

  return (
    <>
      {/* Title Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>注文履歴・売上データ管理</h1>
          <p className={styles.subtitle}>すべての販売履歴の確認、日付・商品別の検索、および注文の取り消しを行えます。</p>
        </div>
      </div>

      <SupabaseSetupBanner />

      {loading && orders.length === 0 ? (
        <div className={styles.loadingArea}>
          <div className={styles.spinner}></div>
          <p>注文履歴を読み込み中...</p>
        </div>
      ) : error ? (
        <div className={styles.errorArea}>
          <AlertCircle size={40} className="text-danger" />
          <h3>エラーが発生しました</h3>
          <p>{error}</p>
        </div>
      ) : (
        <>
          {/* Top Aggregates Card */}
          <div className="grid-cols-3" style={{ marginBottom: '1.25rem' }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className={`${styles.iconCircle} ${styles.blueBg}`}>
                <History size={20} className={styles.blueColor} />
              </div>
              <div>
                <span className={styles.label}>取引件数</span>
                <div className={styles.value}>{filteredOrders.length} 件</div>
                <p className={styles.desc}>条件に一致した注文数</p>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className={`${styles.iconCircle} ${styles.greenBg}`}>
                <TrendingUp size={20} className={styles.greenColor} />
              </div>
              <div>
                <span className={styles.label}>売上合計額</span>
                <div className={styles.value}>{formatCurrency(totalSalesAmount)}</div>
                <p className={styles.desc}>条件に一致した売上の合計金額</p>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className={`${styles.iconCircle} ${styles.purpleBg}`}>
                <ShoppingBag size={20} className={styles.purpleColor} />
              </div>
              <div style={{ flexGrow: 1 }}>
                <span className={styles.label}>商品別販売数</span>
                <div className={styles.tallyList}>
                  {Object.keys(itemsTally).length === 0 ? (
                    <span className={styles.tallyItemEmpty}>なし</span>
                  ) : (
                    Object.entries(itemsTally).map(([name, qty]) => (
                      <div key={name} className={styles.tallyItem}>
                        <span className={styles.tallyName}>{name}</span>
                        <span className={styles.tallyValue}>{qty} 個</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Filter Toolbar Card */}
          <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
            <div className={styles.filterToolbar}>
              {/* Search Box */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>注文ID検索</label>
                <div className={styles.searchWrapper}>
                  <Search size={16} className={styles.searchIcon} />
                  <input 
                    type="text" 
                    className="form-input" 
                    style={{ paddingLeft: '2.25rem', fontSize: '0.875rem', height: '38px' }}
                    placeholder="注文IDを入力（例: EBBAB36）" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Product Filter */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>商品名で絞り込み</label>
                <select 
                  className="form-input form-select"
                  style={{ height: '38px', fontSize: '0.875rem' }}
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                >
                  <option value="all">すべての商品</option>
                  <option value="カレー">カレー</option>
                  <option value="水">水</option>
                  <option value="炭酸水">炭酸水</option>
                </select>
              </div>

              {/* Date Filter */}
              <div className={styles.filterGroup} style={{ flexGrow: 1.5 }}>
                <label className={styles.filterLabel}>期間で絞り込み</label>
                <div className={styles.dateFilterRow}>
                  <select 
                    className="form-input form-select"
                    style={{ height: '38px', fontSize: '0.875rem', width: '130px' }}
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value as any)}
                  >
                    <option value="all">全期間</option>
                    <option value="today">今日</option>
                    <option value="custom">指定日</option>
                  </select>

                  {dateFilter === 'custom' && (
                    <div className={styles.customDateWrapper}>
                      <Calendar size={14} className={styles.calendarIcon} />
                      <input 
                        type="date" 
                        className="form-input"
                        style={{ height: '38px', fontSize: '0.875rem', paddingLeft: '2rem' }}
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main List Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {filteredOrders.length === 0 ? (
              <div className={styles.emptyState}>
                <Clock size={48} className="text-muted" style={{ marginBottom: '1rem' }} />
                <h3>条件に一致する注文が見つかりませんでした</h3>
                <p>フィルター条件を変更するか、キーワードをクリアしてください。</p>
              </div>
            ) : (
              <div className="table-container" style={{ border: 'none', boxShadow: 'none', margin: 0 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: '110px' }}>注文ID</th>
                      <th style={{ width: '180px' }}>会計日時</th>
                      <th>購入明細・数量</th>
                      <th className="text-right" style={{ width: '140px' }}>お預かり</th>
                      <th className="text-right" style={{ width: '140px' }}>お釣り</th>
                      <th className="text-right" style={{ width: '140px' }}>合計金額</th>
                      <th className="text-center" style={{ width: '80px' }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="font-semibold text-muted" title={order.id}>
                          #{getShortId(order.id)}
                        </td>
                        <td className="text-muted" style={{ fontSize: '0.85rem' }}>
                          {formatDateTime(order.created_at)}
                        </td>
                        <td>
                          <div className={styles.itemNamesList}>
                            {order.items && order.items.map((item, i) => (
                              <span key={item.id || i} className={styles.itemBadge}>
                                {item.product_name} <strong className="text-foreground">x{item.quantity}</strong>
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="text-right text-muted font-semibold">
                          {formatCurrency(order.payment_received)}
                        </td>
                        <td className="text-right text-muted font-semibold">
                          {order.change_given === 0 ? '現得 (お釣りなし)' : formatCurrency(order.change_given)}
                        </td>
                        <td className="text-right font-extrabold text-primary" style={{ fontSize: '1.05rem' }}>
                          {formatCurrency(order.total_amount)}
                        </td>
                        <td className="text-center">
                          <button 
                            className={styles.deleteBtn}
                            onClick={() => handleDeleteOrder(order.id, order.total_amount)}
                            title="この注文を取り消す"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
