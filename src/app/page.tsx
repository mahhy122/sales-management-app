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
  ArrowRight,
  BarChart3,
  LineChart
} from 'lucide-react';
import { getSalesDashboard, deleteOrder, SalesDashboardData } from '@/lib/supabase';
import SupabaseSetupBanner from '@/components/SupabaseSetupBanner';
import CashDrawerSetupWizard from '@/components/CashDrawerSetupWizard';
import styles from './page.module.css';

export default function DashboardPage() {
  const [data, setData] = useState<SalesDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; time: string; amount: number } | null>(null);
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

  // Calculate coordinates for Cumulative Sales Trend
  const maxTrendAmount = Math.max(...data.salesTrend.map(t => t.amount), 0);
  const trendMax = maxTrendAmount > 0 ? maxTrendAmount : 1000;

  const svgWidth = 500;
  const svgHeight = 200;
  const paddingX = 40;
  const paddingY = 25;
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;

  const trendPoints = data.salesTrend.map((pt, idx) => {
    const x = paddingX + (data.salesTrend.length > 1 ? (idx / (data.salesTrend.length - 1)) * chartWidth : chartWidth / 2);
    const y = svgHeight - paddingY - (pt.amount / trendMax) * chartHeight;
    return { x, y, time: pt.time, amount: pt.amount };
  });

  const lineD = trendPoints.length > 0 ? `M ${trendPoints[0].x} ${trendPoints[0].y} ` + trendPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') : '';
  const areaD = trendPoints.length > 0 ? `${lineD} L ${trendPoints[trendPoints.length - 1].x} ${svgHeight - paddingY} L ${trendPoints[0].x} ${svgHeight - paddingY} Z` : '';

  // Calculate max value for Hourly Sales Bar Chart
  const maxHourlyAmount = Math.max(...data.hourlySales.map(h => h.amount), 0);
  const hourlyMax = maxHourlyAmount > 0 ? maxHourlyAmount : 1000;

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

      {/* Sales Analytics Graphs */}
      <div className="grid-cols-2" style={{ marginBottom: '1.5rem', gap: '1.5rem' }}>
        {/* Chart 1: Cumulative Sales Trend */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>
              <LineChart size={18} className="text-primary" />
              <span>売上累積推移 (時間経過)</span>
            </h3>
            <span className={styles.desc}>売上累計</span>
          </div>

          <div className={styles.chartBody}>
            <div className={styles.chartWrapperRelative}>
              <svg className={styles.chartSvg} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y-axis helper grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                  const yVal = svgHeight - paddingY - ratio * chartHeight;
                  const labelVal = ratio * trendMax;
                  return (
                    <g key={i}>
                      <line 
                        x1={paddingX} 
                        y1={yVal} 
                        x2={svgWidth - paddingX} 
                        y2={yVal} 
                        stroke="#e2e8f0" 
                        strokeWidth="1" 
                        strokeDasharray="4 4" 
                      />
                      <text 
                        x={paddingX - 8} 
                        y={yVal + 3} 
                        textAnchor="end" 
                        fontSize="9" 
                        fill="#94a3b8" 
                        fontWeight="600"
                      >
                        {formatCurrency(labelVal).replace('円', '')}
                      </text>
                    </g>
                  );
                })}

                {/* Filled Area */}
                {areaD && (
                  <path d={areaD} fill="url(#trendGradient)" />
                )}

                {/* Path Line */}
                {lineD && (
                  <path 
                    d={lineD} 
                    fill="none" 
                    stroke="var(--primary)" 
                    strokeWidth="3" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                )}

                {/* Interactive Dots */}
                {trendPoints.map((pt, idx) => (
                  <circle
                    key={idx}
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredPoint?.time === pt.time ? '7' : '4.5'}
                    fill={hoveredPoint?.time === pt.time ? 'var(--primary)' : 'white'}
                    stroke="var(--primary)"
                    strokeWidth={hoveredPoint?.time === pt.time ? '3' : '2.5'}
                    style={{ cursor: 'pointer', transition: 'all 0.1s ease' }}
                    onMouseEnter={(e) => {
                      setHoveredPoint({
                        x: (pt.x / svgWidth) * 100, // percentage position
                        y: (pt.y / svgHeight) * 100,
                        time: pt.time,
                        amount: pt.amount
                      });
                    }}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                ))}

                {/* X-axis labels */}
                {trendPoints.length > 0 && [0, Math.floor(trendPoints.length / 2), trendPoints.length - 1].map((idx) => {
                  const pt = trendPoints[idx];
                  if (!pt) return null;
                  return (
                    <text
                      key={idx}
                      x={pt.x}
                      y={svgHeight - 6}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#94a3b8"
                      fontWeight="600"
                    >
                      {pt.time}
                    </text>
                  );
                })}
              </svg>

              {/* Line Chart Hover Tooltip */}
              {hoveredPoint && (
                <div 
                  className={styles.chartTooltip}
                  style={{ 
                    left: `${hoveredPoint.x}%`, 
                    top: `${hoveredPoint.y}%` 
                  }}
                >
                  <span className={styles.tooltipTitle}>{hoveredPoint.time} 時点</span>
                  <span className={styles.tooltipValue}>{formatCurrency(hoveredPoint.amount)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chart 2: Hourly Sales Bar Chart */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>
              <BarChart3 size={18} className="text-primary" />
              <span>時間帯別の売上高 (時間毎)</span>
            </h3>
            <span className={styles.desc}>売上ピーク</span>
          </div>

          <div className={styles.chartBody}>
            <div className={styles.barGrid}>
              {data.hourlySales.map((item, idx) => {
                const heightPercent = hourlyMax > 0 ? (item.amount / hourlyMax) * 100 : 0;
                return (
                  <div key={idx} className={styles.barCol}>
                    <div className={styles.barWrapper}>
                      <div 
                        className={styles.bar} 
                        style={{ height: `${Math.max(2, heightPercent)}%` }}
                      >
                        {/* Pure CSS Tooltip popup inside the bar */}
                        <div className={styles.barTooltip}>
                          <strong style={{ color: '#38bdf8' }}>{formatCurrency(item.amount)}</strong>
                          <span style={{ color: '#94a3b8', fontSize: '0.65rem' }}>{item.count} 件の会計</span>
                        </div>
                      </div>
                    </div>
                    <span className={styles.barLabel}>{item.hour}</span>
                  </div>
                );
              })}
            </div>
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
