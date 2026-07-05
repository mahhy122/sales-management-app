'use client';

import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  PlusCircle, 
  TrendingUp, 
  TrendingDown,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { 
  getExpectedCash, 
  getCashLogs, 
  getCashCounts, 
  addCashLog, 
  addCashCount,
  CashDrawerLog, 
  CashCount 
} from '@/lib/supabase';
import SupabaseSetupBanner from '@/components/SupabaseSetupBanner';
import KeypadInput from '@/components/KeypadInput';
import styles from './cash.module.css';

export default function CashPage() {
  const [expectedCash, setExpectedCash] = useState(0);
  const [cashLogs, setCashLogs] = useState<CashDrawerLog[]>([]);
  const [cashCounts, setCashCounts] = useState<CashCount[]>([]);
  const [loading, setLoading] = useState(true);

  // Denomination counter states
  const [bill10000, setBill10000] = useState('0');
  const [bill5000, setBill5000] = useState('0');
  const [bill1000, setBill1000] = useState('0');
  const [coin500, setCoin500] = useState('0');
  const [coin100, setCoin100] = useState('0');
  const [coin50, setCoin50] = useState('0');
  const [coin10, setCoin10] = useState('0');
  const [coin5, setCoin5] = useState('0');
  const [coin1, setCoin1] = useState('0');

  // Drawer Log Form states
  const [logType, setLogType] = useState<CashDrawerLog['log_type']>('両替');
  const [logAmount, setLogAmount] = useState('');
  const [logDescription, setLogDescription] = useState('');

  // Submit statuses
  const [submittingLog, setSubmittingLog] = useState(false);
  const [submittingCount, setSubmittingCount] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);
  const [countSuccess, setCountSuccess] = useState(false);

  const loadCashData = async () => {
    try {
      setLoading(true);
      const [expectedTotal, logs, counts] = await Promise.all([
        getExpectedCash(),
        getCashLogs(),
        getCashCounts()
      ]);
      setExpectedCash(expectedTotal);
      setCashLogs(logs);
      setCashCounts(counts);
    } catch (err) {
      console.error('Failed to load cash data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCashData();
  }, []);

  // Calculate live counted sum
  const b10000 = Number(bill10000) || 0;
  const b5000 = Number(bill5000) || 0;
  const b1000 = Number(bill1000) || 0;
  const c500 = Number(coin500) || 0;
  const c100 = Number(coin100) || 0;
  const c50 = Number(coin50) || 0;
  const c10 = Number(coin10) || 0;
  const c5 = Number(coin5) || 0;
  const c1 = Number(coin1) || 0;

  const countedTotal = 
    b10000 * 10000 +
    b5000 * 5000 +
    b1000 * 1000 +
    c500 * 500 +
    c100 * 100 +
    c50 * 50 +
    c10 * 10 +
    c5 * 5 +
    c1 * 1;

  const discrepancy = countedTotal - expectedCash;

  // Add cash log handler
  const handleAddCashLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(false);

    const amountNum = Number(logAmount) || 0;

    // Validation
    if (logType !== '両替' && amountNum === 0) {
      setFormError('両替以外のログタイプでは、金額に0以外の数値を入力してください。');
      return;
    }
    if (!logDescription.trim()) {
      setFormError('取引の詳細（例: 釣銭100円玉の補充、1万円両替など）を入力してください。');
      return;
    }

    try {
      setSubmittingLog(true);
      await addCashLog({
        log_type: logType,
        amount: logType === '金銭回収' ? -Math.abs(amountNum) : amountNum,
        description: logDescription.trim()
      });

      setFormSuccess(true);
      setLogAmount('');
      setLogDescription('');
      
      // Reload expected cash and history
      await loadCashData();
    } catch (err: any) {
      setFormError(err.message || 'ログの追加に失敗しました。');
    } finally {
      setSubmittingLog(false);
    }
  };

  // Submit cash count audit handler
  const handleAddCashCount = async () => {
    try {
      setSubmittingCount(true);
      
      await addCashCount(
        {
          bill_10000: b10000,
          bill_5000: b5000,
          bill_1000: b1000,
          coin_500: c500,
          coin_100: c100,
          coin_50: c50,
          coin_10: c10,
          coin_5: c5,
          coin_1: c1
        },
        expectedCash
      );

      setCountSuccess(true);
      // Reset count forms to 0
      setBill10000('0');
      setBill5000('0');
      setBill1000('0');
      setCoin500('0');
      setCoin100('0');
      setCoin50('0');
      setCoin10('0');
      setCoin5('0');
      setCoin1('0');

      // Reload
      await loadCashData();
      
      // Clear success banner after 4 seconds
      setTimeout(() => setCountSuccess(false), 4000);
    } catch (err: any) {
      alert('監査データの保存に失敗しました: ' + err.message);
    } finally {
      setSubmittingCount(false);
    }
  };

  const handleResetCountForm = () => {
    setBill10000('0');
    setBill5000('0');
    setBill1000('0');
    setCoin500('0');
    setCoin100('0');
    setCoin50('0');
    setCoin10('0');
    setCoin5('0');
    setCoin1('0');
  };

  const handleResetExpectedCashWithCounts = async () => {
    if (countedTotal <= 0) {
      alert('準備金として設定する金額は0円より大きくしてください。紙幣や硬貨の枚数を入力してください。');
      return;
    }

    const confirm = window.confirm(
      `現在の数え上げ合計金額 ${formatCurrency(countedTotal)} を、新しい「釣銭準備金」として登録しますか？\n\n` +
      `【注意】この操作を行うと、ここから先の理論残高がこの金額から再スタートします。別日（営業開始時など）に釣銭準備金を更新したい場合に使用します。`
    );

    if (!confirm) return;

    try {
      setSubmittingLog(true);
      const details = [];
      if (b10000 > 0) details.push(`1万円札x${b10000}`);
      if (b5000 > 0) details.push(`5千円札x${b5000}`);
      if (b1000 > 0) details.push(`千円札x${b1000}`);
      if (c500 > 0) details.push(`500円玉x${c500}`);
      if (c100 > 0) details.push(`100円玉x${c100}`);
      if (c50 > 0) details.push(`50円玉x${c50}`);
      if (c10 > 0) details.push(`10円玉x${c10}`);
      if (c5 > 0) details.push(`5円玉x${c5}`);
      if (c1 > 0) details.push(`1円玉x${c1}`);
      const description = `釣銭準備金（手動更新：${details.length > 0 ? details.join(', ') : '直接入力'}）`;

      await addCashLog({
        log_type: '準備金設定',
        amount: countedTotal,
        description: description
      });

      setCountSuccess(true);
      handleResetCountForm();
      await loadCashData();
      setTimeout(() => setCountSuccess(false), 4000);
    } catch (err: any) {
      alert('準備金の更新に失敗しました: ' + err.message);
    } finally {
      setSubmittingLog(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(value);
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Title Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>レジ金管理・釣銭両替履歴</h1>
          <p className={styles.subtitle}>釣銭準備金、両替、金銭回収の履歴を記録し、金種別の数え上げ監査を行えます。</p>
        </div>
      </div>

      <SupabaseSetupBanner />

      {loading && cashLogs.length === 0 ? (
        <div className={styles.loadingArea}>
          <div className={styles.spinner}></div>
          <p>現金データを読み込み中...</p>
        </div>
      ) : (
        <>
          {/* Top Cards for Overview */}
          <div className="grid-cols-2">
            {/* Theoretical balance */}
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className={`${styles.statsIconWrapper} ${styles.blueBg}`}>
                <Coins size={22} className={styles.blueColor} />
              </div>
              <div>
                <span className={styles.statsLabel}>理論レジ内現金残高</span>
                <div className={styles.statsValue}>{formatCurrency(expectedCash)}</div>
                <p className={styles.statsDesc}>理論値＝（準備金 ＋ 売上 ＋ 補充 − 回収）</p>
              </div>
            </div>

            {/* Last audit discrepancy */}
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {cashCounts.length > 0 && cashCounts[0].discrepancy === 0 ? (
                <div className={`${styles.statsIconWrapper} ${styles.greenBg}`}>
                  <ShieldCheck size={22} className={styles.greenColor} />
                </div>
              ) : (
                <div className={`${styles.statsIconWrapper} ${cashCounts.length > 0 && Number(cashCounts[0].discrepancy) < 0 ? styles.redBg : styles.amberBg}`}>
                  <ShieldAlert size={22} className={cashCounts.length > 0 && Number(cashCounts[0].discrepancy) < 0 ? styles.redColor : styles.amberColor} />
                </div>
              )}
              <div>
                <span className={styles.statsLabel}>最新のレジ監査結果（過不足）</span>
                <div className={`${styles.statsValue} ${
                  cashCounts.length === 0 
                    ? '' 
                    : cashCounts[0].discrepancy === 0 
                      ? styles.profitPlus 
                      : styles.profitMinus
                }`}>
                  {cashCounts.length === 0 
                    ? '監査未実施' 
                    : cashCounts[0].discrepancy === 0 
                      ? '±0円 (一致)' 
                      : `${cashCounts[0].discrepancy > 0 ? '+' : ''}${formatCurrency(cashCounts[0].discrepancy)}`
                  }
                </div>
                <p className={styles.statsDesc}>
                  {cashCounts.length > 0 
                    ? `最終実施: ${formatDateTime(cashCounts[0].created_at)}` 
                    : 'レジ金数えは定期的に行ってください'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="grid-cols-3">
            {/* Left Column: Denomination counting (Spans 2 columns) */}
            <div className={styles.countingColumn}>
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="flex-between">
                  <h3 className="card-title" style={{ margin: 0 }}>
                    <Coins size={18} className="text-primary" />
                    <span>レジ金数え上げ監査 (金種カウンター)</span>
                  </h3>
                  <button className={styles.resetBtn} onClick={handleResetCountForm}>
                    <RotateCcw size={14} />
                    <span>リセット</span>
                  </button>
                </div>

                {countSuccess && (
                  <div className={styles.countSuccessAlert}>
                    <CheckCircle2 size={16} style={{ marginRight: '0.4rem', flexShrink: 0 }} />
                    <span>監査結果が正常にデータベースに記録されました。</span>
                  </div>
                )}

                {/* Input Grids */}
                <div className={styles.denominationGrid}>
                  {/* Bills */}
                  <div className={styles.denomSection}>
                    <h4 className={styles.denomSectionTitle}>💵 紙幣（お札）</h4>
                    
                    <div className={styles.denomRow}>
                      <span className={styles.denomLabel}>10,000 円札</span>
                      <KeypadInput 
                        type="text" 
                        className="form-input text-right" 
                        value={bill10000} 
                        onChange={(val) => setBill10000(val)} 
                        title="1万円札の枚数"
                        suffix="枚"
                      />
                      <span className={styles.denomMultiply}>x</span>
                      <span className={styles.denomSubtotal}>{formatCurrency(b10000 * 10000)}</span>
                    </div>

                    <div className={styles.denomRow}>
                      <span className={styles.denomLabel}>5,000 円札</span>
                      <KeypadInput 
                        type="text" 
                        className="form-input text-right" 
                        value={bill5000} 
                        onChange={(val) => setBill5000(val)} 
                        title="5千円札の枚数"
                        suffix="枚"
                      />
                      <span className={styles.denomMultiply}>x</span>
                      <span className={styles.denomSubtotal}>{formatCurrency(b5000 * 5000)}</span>
                    </div>

                    <div className={styles.denomRow}>
                      <span className={styles.denomLabel}>1,000 円札</span>
                      <KeypadInput 
                        type="text" 
                        className="form-input text-right" 
                        value={bill1000} 
                        onChange={(val) => setBill1000(val)} 
                        title="千円札の枚数"
                        suffix="枚"
                      />
                      <span className={styles.denomMultiply}>x</span>
                      <span className={styles.denomSubtotal}>{formatCurrency(b1000 * 1000)}</span>
                    </div>
                  </div>

                  {/* Coins */}
                  <div className={styles.denomSection}>
                    <h4 className={styles.denomSectionTitle}>🪙 硬貨（小銭）</h4>
                    
                    <div className={styles.denomRow}>
                      <span className={styles.denomLabel}>500 円玉</span>
                      <KeypadInput 
                        type="text" 
                        className="form-input text-right" 
                        value={coin500} 
                        onChange={(val) => setCoin500(val)} 
                        title="500円玉の枚数"
                        suffix="枚"
                      />
                      <span className={styles.denomMultiply}>x</span>
                      <span className={styles.denomSubtotal}>{formatCurrency(c500 * 500)}</span>
                    </div>

                    <div className={styles.denomRow}>
                      <span className={styles.denomLabel}>100 円玉</span>
                      <KeypadInput 
                        type="text" 
                        className="form-input text-right" 
                        value={coin100} 
                        onChange={(val) => setCoin100(val)} 
                        title="100円玉の枚数"
                        suffix="枚"
                      />
                      <span className={styles.denomMultiply}>x</span>
                      <span className={styles.denomSubtotal}>{formatCurrency(c100 * 100)}</span>
                    </div>

                    <div className={styles.denomRow}>
                      <span className={styles.denomLabel}>50 円玉</span>
                      <KeypadInput 
                        type="text" 
                        className="form-input text-right" 
                        value={coin50} 
                        onChange={(val) => setCoin50(val)} 
                        title="50円玉の枚数"
                        suffix="枚"
                      />
                      <span className={styles.denomMultiply}>x</span>
                      <span className={styles.denomSubtotal}>{formatCurrency(c50 * 50)}</span>
                    </div>

                    <div className={styles.denomRow}>
                      <span className={styles.denomLabel}>10 円玉</span>
                      <KeypadInput 
                        type="text" 
                        className="form-input text-right" 
                        value={coin10} 
                        onChange={(val) => setCoin10(val)} 
                        title="10円玉の枚数"
                        suffix="枚"
                      />
                      <span className={styles.denomMultiply}>x</span>
                      <span className={styles.denomSubtotal}>{formatCurrency(c10 * 10)}</span>
                    </div>

                    <div className={styles.denomRow}>
                      <span className={styles.denomLabel}>5 円玉</span>
                      <KeypadInput 
                        type="text" 
                        className="form-input text-right" 
                        value={coin5} 
                        onChange={(val) => setCoin5(val)} 
                        title="5円玉の枚数"
                        suffix="枚"
                      />
                      <span className={styles.denomMultiply}>x</span>
                      <span className={styles.denomSubtotal}>{formatCurrency(c5 * 5)}</span>
                    </div>

                    <div className={styles.denomRow}>
                      <span className={styles.denomLabel}>1 円玉</span>
                      <KeypadInput 
                        type="text" 
                        className="form-input text-right" 
                        value={coin1} 
                        onChange={(val) => setCoin1(val)} 
                        title="1円玉の枚数"
                        suffix="枚"
                      />
                      <span className={styles.denomMultiply}>x</span>
                      <span className={styles.denomSubtotal}>{formatCurrency(c1 * 1)}</span>
                    </div>
                  </div>
                </div>

                {/* Audit Comparison Panel */}
                <div className={styles.auditPanel}>
                  <div className={styles.auditRow}>
                    <span>数えた合計金額:</span>
                    <span className={styles.auditValueCounted}>{formatCurrency(countedTotal)}</span>
                  </div>
                  <div className={styles.auditRow}>
                    <span>レジ期待金額 (理論値):</span>
                    <span className={styles.auditValueExpected}>{formatCurrency(expectedCash)}</span>
                  </div>
                  
                  {/* Discrepancy indicator */}
                  <div className={`${styles.discrepancyBox} ${
                    discrepancy === 0 
                      ? styles.discrepancyMatch 
                      : discrepancy < 0 
                        ? styles.discrepancyDeficit 
                        : styles.discrepancySurplus
                  }`}>
                    <span className={styles.discrepancyLabel}>過不足:</span>
                    <span className={styles.discrepancyValue}>
                      {discrepancy === 0 
                        ? '¥0 (一致しています)' 
                        : `${discrepancy > 0 ? '+' : ''}${formatCurrency(discrepancy)} ${discrepancy > 0 ? '（超過）' : '（不足）'}`
                      }
                    </span>
                  </div>

                  <button 
                    className="btn btn-primary"
                    disabled={submittingCount || countedTotal === 0}
                    onClick={handleAddCashCount}
                    style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', marginTop: '0.5rem' }}
                  >
                    <span>{submittingCount ? '保存中...' : 'レジ監査（数え結果）を確定保存する'}</span>
                  </button>

                  <button 
                    className="btn btn-secondary"
                    disabled={submittingLog || countedTotal === 0}
                    onClick={handleResetExpectedCashWithCounts}
                    style={{ 
                      width: '100%', 
                      padding: '0.85rem', 
                      fontSize: '1rem', 
                      marginTop: '0.5rem',
                      backgroundColor: 'var(--primary-light)',
                      color: 'var(--primary)',
                      borderColor: 'var(--primary-border)'
                    }}
                  >
                    <span>{submittingLog ? '更新中...' : 'この金額を新しい釣銭準備金として登録 (更新)'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Log cash logs (Spans 1 column) */}
            <div className="card" style={{ height: 'fit-content' }}>
              <h3 className="card-title" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                <PlusCircle size={18} className="text-primary" />
                <span>両替・補充・回収の登録</span>
              </h3>

              {formSuccess && (
                <div className={styles.formSuccessAlert}>
                  <span>レジ金ログを正常に記録しました。</span>
                </div>
              )}

              {formError && (
                <div className={styles.formErrorAlert}>
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleAddCashLog}>
                <div className="form-group">
                  <label className="form-label">金銭操作タイプ</label>
                  <select 
                    className="form-input form-select"
                    value={logType}
                    onChange={(e) => setLogType(e.target.value as CashDrawerLog['log_type'])}
                  >
                    <option value="両替">両替（レジ総額の増減なし）</option>
                    <option value="釣銭補充">釣銭補充（小銭などの入金）</option>
                    <option value="金銭回収">金銭回収（売上の回収・出金）</option>
                    <option value="準備金設定">準備金設定（リセット・初期設定）</option>
                    <option value="その他">その他</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {logType === '両替' 
                      ? '取引金額（※両替の場合は総額差分ゼロのため、通常は入力不要です）' 
                      : logType === '金銭回収'
                        ? '回収金額（円・マイナス値不要、自動でマイナスになります）'
                        : '補充・設定金額（円）'
                    }
                  </label>
                  <div className={styles.inputWithUnit}>
                    <KeypadInput 
                      type="text" 
                      className="form-input"
                      placeholder={logType === '両替' ? '0' : '5000'}
                      value={logAmount}
                      onChange={(val) => setLogAmount(val)}
                      disabled={logType === '両替'}
                      title="操作金額の入力"
                      suffix="円"
                    />
                    <span className={styles.unitRight}>円</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">操作の詳細（内訳・理由）</label>
                  <textarea 
                    className="form-input"
                    placeholder={
                      logType === '両替' 
                        ? '例: 1万円札を1000円札10枚へ両替した' 
                        : logType === '金銭回収'
                          ? '例: 千円札30枚を金庫へ回収した'
                          : '例: 釣銭用の100円玉5000円分を補充した'
                    }
                    value={logDescription}
                    onChange={(e) => setLogDescription(e.target.value)}
                    rows={3}
                    style={{ resize: 'none' }}
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '1rem' }}
                  disabled={submittingLog}
                >
                  <span>{submittingLog ? '登録中...' : 'レジ金操作ログを登録'}</span>
                </button>
              </form>

              <div className={styles.masterInfoTip}>
                <HelpCircle size={14} className="text-muted" style={{ marginRight: '0.25rem', flexShrink: 0 }} />
                <span>「両替」はレジ総額に増減を及ぼしません。「補充」はプラス、「回収」はマイナスの経常値としてレジ内理論現金残高に即座に反映されます。</span>
              </div>
            </div>
          </div>

          {/* Bottom logs timeline */}
          <div className="card">
            <h3 className="card-title">
              <Clock size={18} className="text-muted" />
              <span>金銭操作・監査履歴ログ（最近の記録）</span>
            </h3>

            {cashLogs.length === 0 && cashCounts.length === 0 ? (
              <div className={styles.emptyState}>
                <p>記録された金銭イベントはありません。</p>
              </div>
            ) : (
              <div className={styles.timelineContainer}>
                {/* We combine logs and counts to show a combined historical list */}
                {(() => {
                  const combined = [
                    ...cashLogs.map(l => ({ ...l, type: 'log' as const, date: new Date(l.created_at || '') })),
                    ...cashCounts.map(c => ({ ...c, type: 'count' as const, date: new Date(c.created_at || '') }))
                  ].sort((a, b) => b.date.getTime() - a.date.getTime());

                  return (
                    <div className={styles.timeline}>
                      {combined.map((item, index) => {
                        const isCount = item.type === 'count';
                        
                        if (isCount) {
                          const cItem = item as unknown as CashCount;
                          const isMatch = cItem.discrepancy === 0;
                          return (
                            <div key={cItem.id || index} className={styles.timelineItem}>
                              <div className={`${styles.timelineBadge} ${isMatch ? styles.badgeSuccess : styles.badgeWarning}`}>
                                監査
                              </div>
                              <div className={styles.timelineContent}>
                                <div className={styles.timelineTime}>{formatDateTime(cItem.created_at)}</div>
                                <div className={styles.timelineTitle}>
                                  レジ金監査（数え上げ実績: {formatCurrency(cItem.counted_total)}）
                                </div>
                                <div className={styles.timelineDesc}>
                                  理論上の期待額: {formatCurrency(cItem.expected_total)} | 
                                  過不足: <span className={isMatch ? styles.profitPlus : styles.profitMinus}>
                                    {isMatch ? '±0円' : `${cItem.discrepancy > 0 ? '+' : ''}${formatCurrency(cItem.discrepancy)}`}
                                  </span>
                                </div>
                                <div className={styles.denomCountsDetails}>
                                  金種内訳: 
                                  {cItem.bill_10000 > 0 && ` 1万円x${cItem.bill_10000}`}
                                  {cItem.bill_5000 > 0 && ` 5千円x${cItem.bill_5000}`}
                                  {cItem.bill_1000 > 0 && ` 千円x${cItem.bill_1000}`}
                                  {cItem.coin_500 > 0 && ` 500円x${cItem.coin_500}`}
                                  {cItem.coin_100 > 0 && ` 100円x${cItem.coin_100}`}
                                  {cItem.coin_50 > 0 && ` 50円x${cItem.coin_50}`}
                                  {cItem.coin_10 > 0 && ` 10円x${cItem.coin_10}`}
                                  {cItem.coin_5 > 0 && ` 5円x${cItem.coin_5}`}
                                  {cItem.coin_1 > 0 && ` 1円x${cItem.coin_1}`}
                                </div>
                              </div>
                            </div>
                          );
                        } else {
                          const lItem = item as unknown as CashDrawerLog;
                          const amountVal = lItem.log_type === '金銭回収' ? -Math.abs(Number(lItem.amount)) : Number(lItem.amount);
                          const isNegative = amountVal < 0;
                          return (
                            <div key={lItem.id || index} className={styles.timelineItem}>
                              <div className={`${styles.timelineBadge} ${
                                lItem.log_type === '準備金設定' 
                                  ? styles.badgeBlue 
                                  : lItem.log_type === '金銭回収' 
                                    ? styles.badgeRed 
                                    : lItem.log_type === '釣銭補充' 
                                      ? styles.badgeGreen 
                                      : styles.badgeSecondary
                              }`}>
                                {lItem.log_type}
                              </div>
                              <div className={styles.timelineContent}>
                                <div className={styles.timelineTime}>{formatDateTime(lItem.created_at)}</div>
                                <div className={styles.timelineTitle}>
                                  {lItem.log_type === '両替' ? (
                                    <span>レジ金両替記録 (総額変化なし)</span>
                                  ) : (
                                    <span>
                                      金額操作: {isNegative ? '出金' : '入金'} {formatCurrency(Math.abs(amountVal))}
                                    </span>
                                  )}
                                </div>
                                <div className={styles.timelineDesc} style={{ fontWeight: 500, color: 'var(--foreground)' }}>
                                  {lItem.description}
                                </div>
                              </div>
                            </div>
                          );
                        }
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
