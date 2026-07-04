'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  Clock, 
  Trash2, 
  Utensils, 
  AlertCircle,
  TrendingDown as LossIcon,
  ArrowRight
} from 'lucide-react';
import { getSalesDashboard, deleteOrder, SalesDashboardData } from '@/lib/supabase';
import SupabaseSetupBanner from '@/components/SupabaseSetupBanner';
import CashDrawerSetupWizard from '@/components/CashDrawerSetupWizard';
import styles from './page.module.css';

export default function DashboardPage() {
  const [data, setData] = useState<SalesDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const dashboardData = await getSalesDashboard();
      setData(dashboardData);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError('ダッシュボードデータの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('この注文を取り消しますか？取引金額が売上からマイナスされます。')) {
      return;
    }

    try {
      setDeletingId(orderId);
      await deleteOrder(orderId);
      await loadDashboardData();
    } catch (err: any) {
      alert('注文の取り消しに失敗しました: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(value);
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '不明';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

  // 1. Early Return for Loading State
  if (loading && !data) {
    return (
      <>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>学祭出店 財務・利益管理ダッシュボード</h1>
            <p className={styles.subtitle}>売上（レジ会計）と経費（仕入れ）から、純利益と利益率をリアルタイムに自動計算します。</p>
          </div>
          <Link href="/register" className="btn btn-primary">
            <Calculator size={18} />
            <span>レジ会計を開く</span>
          </Link>
        </div>
        <SupabaseSetupBanner />
        <div className={styles.loadingArea}>
          <div className={styles.spinner}></div>
          <p>利益集計データを計算中...</p>
        </div>
      </>
    );
  }

  // 2. Early Return for Error State
  if (error) {
    return (
      <>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>学祭出店 財務・利益管理ダッシュボード</h1>
            <p className={styles.subtitle}>売上（レジ会計）と経費（仕入れ）から、純利益と利益率をリアルタイムに自動計算します。</p>
          </div>
          <Link href="/register" className="btn btn-primary">
            <Calculator size={18} />
            <span>レジ会計を開く</span>
          </Link>
        </div>
        <SupabaseSetupBanner />
        <div className={styles.errorArea}>
          <AlertCircle size={40} className="text-danger" />
          <h3>データ集計エラー</h3>
          <p>{error}</p>
        </div>
      </>
    );
  }

  if (!data) return null;

  // 3. Main Dashboard View
  return (
    <>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>学祭出店 財務・利益管理ダッシュボード</h1>
          <p className={styles.subtitle}>売上（レジ会計）と経費（仕入れ）から、純利益と利益率をリアルタイムに自動計算します。</p>
        </div>
        <Link href="/register" className="btn btn-primary">
          <Calculator size={18} />
          <span>レジ会計を開く</span>
        </Link>
      </div>

      <SupabaseSetupBanner />

      {/* Cash Drawer Status Alert Bar */}
      <div className={styles.cashDrawerAlert}>
        <div className={styles.cashDrawerAlertMain}>
          <span>レジ内現金理論値: <strong>{formatCurrency(data.expectedCash)}</strong></span>
          <span className={styles.cashDivider}>|</span>
          <span>
            最新のレジ監査結果: <strong className={
              data.lastDiscrepancy === null 
                ? '' 
                : data.lastDiscrepancy === 0 
                  ? styles.profitPlus 
                  : styles.profitMinus
            }>
              {data.lastDiscrepancy === null 
                ? '未監査（要レジ金数え）' 
                : data.lastDiscrepancy === 0 
                  ? '一致 (±0円)' 
                  : `${data.lastDiscrepancy > 0 ? '+' : ''}${formatCurrency(data.lastDiscrepancy)}過不足`
              }
            </strong>
          </span>
        </div>
        <Link href="/cash" className={styles.cashAuditLink}>
          <span>金銭管理・監査</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Dashboard 4 KPI Grid */}
      <div className={styles.statsGrid}>
        {/* 1. Total Revenue */}
        <div className="card">
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>総売上高 (収入)</span>
            <div className={`${styles.iconWrapper} ${styles.primaryBg}`}>
              <TrendingUp size={20} className={styles.primaryColor} />
            </div>
          </div>
          <div className={styles.statValue}>{formatCurrency(data.totalSales)}</div>
          <div className={styles.statFooter}>
            <span>総注文数: </span>
            <span className={styles.footerHighlight}>{data.ordersCount} 件</span>
          </div>
        </div>

        {/* 2. Total Sourcing cost */}
        <div className="card">
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>仕入れ総額 (経費支出)</span>
            <div className={`${styles.iconWrapper} ${styles.dangerBg}`}>
              <TrendingDown size={20} className={styles.dangerColor} />
            </div>
          </div>
          <div className={styles.statValue}>{formatCurrency(data.totalCost)}</div>
          <div className={styles.statFooter}>
            <span>材料・資材の経費合計</span>
          </div>
        </div>

        {/* 3. Net Profit */}
        <div className="card">
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>純利益 (手元に残る金)</span>
            <div className={`${styles.iconWrapper} ${data.netProfit >= 0 ? styles.successBg : styles.dangerBg}`}>
              {data.netProfit >= 0 ? (
                <DollarSign size={20} className={styles.successColor} />
              ) : (
                <LossIcon size={20} className={styles.dangerColor} />
              )}
            </div>
          </div>
          <div className={`${styles.statValue} ${data.netProfit >= 0 ? styles.profitPlus : styles.profitMinus}`}>
            {formatCurrency(data.netProfit)}
          </div>
          <div className={styles.statFooter}>
            <span className={data.netProfit >= 0 ? styles.profitPlus : styles.profitMinus}>
              {data.netProfit >= 0 ? '黒字営業中 🎉' : '赤字（回収中） ⚠️'}
            </span>
          </div>
        </div>

        {/* 4. Profit Margin */}
        <div className="card">
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>利益率</span>
            <div className={`${styles.iconWrapper} ${styles.warningBg}`}>
              <Percent size={20} className={styles.warningColor} />
            </div>
          </div>
          <div className={styles.statValue}>{data.margin} %</div>
          <div className={styles.statFooter}>
            <span>売上に対する純利益の割合</span>
          </div>
        </div>
      </div>

      <div className="grid-cols-3">
        {/* Recent Orders list (Spans 2 columns) */}
        <div className={`${styles.recentCard} card`}>
          <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>
            <Clock size={18} className="text-muted" />
            <span>直近の会計履歴</span>
          </h3>

          {data.recentOrders.length === 0 ? (
            <div className={styles.emptyState}>
              <p>本日の会計取引はありません。</p>
              <Link href="/register" className="btn btn-secondary" style={{ marginTop: '0.75rem' }}>
                最初のレジ会計を入力
                  </Link>
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none', boxShadow: 'none', margin: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>時間</th>
                    <th>注文内容</th>
                    <th className="text-right" style={{ width: '110px' }}>合計金額</th>
                    <th className="text-right" style={{ width: '110px' }}>お預かり</th>
                    <th className="text-right" style={{ width: '100px' }}>お釣り</th>
                    <th className="text-center" style={{ width: '70px' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="text-muted font-semibold">{formatTime(order.created_at)}</td>
                      <td className={styles.orderItemsCell}>
                        {order.items?.map(item => (
                          <span key={item.id} className={styles.orderItemBadge}>
                            {item.product_name} x {item.quantity}
                          </span>
                        ))}
                      </td>
                      <td className="text-right font-bold">{formatCurrency(order.total_amount)}</td>
                      <td className="text-right text-muted">{formatCurrency(order.payment_received)}</td>
                      <td className="text-right text-muted">
                        {order.change_given === 0 ? '現得' : formatCurrency(order.change_given)}
                      </td>
                      <td className="text-center">
                        <button 
                          className={styles.deleteBtn}
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={deletingId === order.id}
                          title="会計を取り消す"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quantity sold by menu item (Spans 1 column) */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 className="card-title">
            <Utensils size={18} className="text-muted" />
            <span>メニュー別 販売数量</span>
          </h3>

          {Object.keys(data.itemsSold).length === 0 ? (
            <div className={styles.emptyState} style={{ padding: '4rem 1rem' }}>
              <p>まだ商品が販売されていません。</p>
            </div>
          ) : (
            <div className={styles.categoryList}>
              {Object.entries(data.itemsSold)
                .sort((a, b) => b[1] - a[1])
                .map(([productName, quantity], index) => {
                  const totalQty = Object.values(data.itemsSold).reduce((sum, val) => sum + val, 0);
                  const percentage = Math.round((quantity / totalQty) * 100) || 0;
                  
                  return (
                    <div key={productName} className={styles.categoryItem}>
                      <div className={styles.categoryMeta}>
                        <span className={styles.categoryRank}>#{index + 1}</span>
                        <span className={styles.categoryName}>{productName}</span>
                        <span className={styles.categoryValue}>{quantity} 杯/個/本</span>
                      </div>
                      <div className={styles.progressBarBg}>
                        <div 
                          className={styles.progressBarFill} 
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: index === 0 ? 'var(--primary)' : index === 1 ? 'var(--success)' : '#f59e0b'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          <div className={styles.liveDashboardTip}>
            <p>※ レジで会計が完了すると、販売数と純利益が即座に同期されます。誤注文は「取消」ボタンで相殺可能です。</p>
          </div>
        </div>
      </div>
    </>
  );
}
