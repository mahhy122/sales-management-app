'use client';

import React, { useState } from 'react';
import { Coins, ShieldAlert, ArrowRight, ClipboardCheck } from 'lucide-react';
import { addCashLog } from '@/lib/supabase';
import styles from './CashDrawerSetupWizard.module.css';

interface CashDrawerSetupWizardProps {
  onSetupComplete: () => void;
}

export default function CashDrawerSetupWizard({ onSetupComplete }: CashDrawerSetupWizardProps) {
  const [mode, setMode] = useState<'simple' | 'denom'>('simple');
  const [simpleAmount, setSimpleAmount] = useState('30000');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Denominations for detailed counting
  const [bill10000, setBill10000] = useState('0');
  const [bill5000, setBill5000] = useState('0');
  const [bill1000, setBill1000] = useState('20'); // Default templates (often 20 thousand yen bills)
  const [coin500, setCoin500] = useState('10');
  const [coin100, setCoin100] = useState('40');
  const [coin50, setCoin50] = useState('10');
  const [coin10, setCoin10] = useState('50');
  const [coin5, setCoin5] = useState('0');
  const [coin1, setCoin1] = useState('0');

  const b10000 = Number(bill10000) || 0;
  const b5000 = Number(bill5000) || 0;
  const b1000 = Number(bill1000) || 0;
  const c500 = Number(coin500) || 0;
  const c100 = Number(coin100) || 0;
  const c50 = Number(coin50) || 0;
  const c10 = Number(coin10) || 0;
  const c5 = Number(coin5) || 0;
  const c1 = Number(coin1) || 0;

  const denomTotal = 
    b10000 * 10000 +
    b5000 * 5000 +
    b1000 * 1000 +
    c500 * 500 +
    c100 * 100 +
    c50 * 50 +
    c10 * 10 +
    c5 * 5 +
    c1 * 1;

  const totalAmount = mode === 'simple' ? Number(simpleAmount) || 0 : denomTotal;

  const handleStartBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (totalAmount <= 0) {
      setErrorMsg('準備金は0円より大きい値を入力してください。お釣りを必要としない場合でも、レジ金の基準設定が必要です。');
      return;
    }

    try {
      setSubmitting(false);
      
      let description = '朝の釣銭準備金（簡単入力）';
      if (mode === 'denom') {
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
        description = `釣銭準備金（${details.join(', ')}）`;
      }

      await addCashLog({
        log_type: '準備金設定',
        amount: totalAmount,
        description: description
      });

      onSetupComplete();
    } catch (err: any) {
      setErrorMsg('準備金の設定に失敗しました: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className={styles.wizardOverlay}>
      <div className={styles.wizardCard}>
        <div className={styles.iconCircle}>
          <Coins size={28} className={styles.icon} />
        </div>

        <h2 className={styles.title}>本日の営業開始手続き</h2>
        <p className={styles.subtitle}>
          お会計（お釣り計算）と売上集計を開始する前に、<br />
          金庫からレジへ投入した<strong>最初の釣銭準備金</strong>を設定してください。
        </p>

        {/* Tab Selection */}
        <div className={styles.tabContainer}>
          <button 
            type="button"
            className={`${styles.tabBtn} ${mode === 'simple' ? styles.activeTab : ''}`}
            onClick={() => setMode('simple')}
          >
            合計金額を入力
          </button>
          <button 
            type="button"
            className={`${styles.tabBtn} ${mode === 'denom' ? styles.activeTab : ''}`}
            onClick={() => setMode('denom')}
          >
            お札・小銭を数えて入力
          </button>
        </div>

        <form onSubmit={handleStartBusiness} className={styles.form}>
          {mode === 'simple' ? (
            /* Simple Mode Input */
            <div className={styles.simpleInputSection}>
              <label className={styles.inputLabel}>準備金の合計金額</label>
              <div className={styles.inputWrapper}>
                <input 
                  type="number"
                  className={styles.amountInput}
                  value={simpleAmount}
                  onChange={(e) => setSimpleAmount(e.target.value)}
                  min="0"
                  step="10"
                  placeholder="30000"
                  autoFocus
                />
                <span className={styles.currencySymbol}>円</span>
              </div>
              <p className={styles.inputDesc}>例: 千円札や硬貨の総額が30,000円の場合はそのまま登録します。</p>
            </div>
          ) : (
            /* Detailed Denomination Counting Mode */
            <div className={styles.denomCountingSection}>
              <p className={styles.sectionHeaderDesc}>お札と小銭の枚数をそれぞれ入力してください。合計を自動計算します。</p>
              
              <div className={styles.denomGrid}>
                {/* Bills */}
                <div className={styles.denomColumn}>
                  <div className={styles.denomRow}>
                    <span className={styles.denomLabel}>10,000円札</span>
                    <input 
                      type="number" 
                      className={styles.denomInput} 
                      value={bill10000} 
                      onChange={(e) => setBill10000(e.target.value)} 
                      min="0"
                    />
                  </div>
                  <div className={styles.denomRow}>
                    <span className={styles.denomLabel}>5,000円札</span>
                    <input 
                      type="number" 
                      className={styles.denomInput} 
                      value={bill5000} 
                      onChange={(e) => setBill5000(e.target.value)} 
                      min="0"
                    />
                  </div>
                  <div className={styles.denomRow}>
                    <span className={styles.denomLabel}>1,000円札</span>
                    <input 
                      type="number" 
                      className={styles.denomInput} 
                      value={bill1000} 
                      onChange={(e) => setBill1000(e.target.value)} 
                      min="0"
                    />
                  </div>
                  <div className={styles.denomRow}>
                    <span className={styles.denomLabel}>500円玉</span>
                    <input 
                      type="number" 
                      className={styles.denomInput} 
                      value={coin500} 
                      onChange={(e) => setCoin500(e.target.value)} 
                      min="0"
                    />
                  </div>
                </div>

                {/* Coins */}
                <div className={styles.denomColumn}>
                  <div className={styles.denomRow}>
                    <span className={styles.denomLabel}>100円玉</span>
                    <input 
                      type="number" 
                      className={styles.denomInput} 
                      value={coin100} 
                      onChange={(e) => setCoin100(e.target.value)} 
                      min="0"
                    />
                  </div>
                  <div className={styles.denomRow}>
                    <span className={styles.denomLabel}>50円玉</span>
                    <input 
                      type="number" 
                      className={styles.denomInput} 
                      value={coin50} 
                      onChange={(e) => setCoin50(e.target.value)} 
                      min="0"
                    />
                  </div>
                  <div className={styles.denomRow}>
                    <span className={styles.denomLabel}>10円玉</span>
                    <input 
                      type="number" 
                      className={styles.denomInput} 
                      value={coin10} 
                      onChange={(e) => setCoin10(e.target.value)} 
                      min="0"
                    />
                  </div>
                  <div className={styles.denomRow}>
                    <span className={styles.denomLabel}>5円玉 / 1円玉</span>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <input 
                        type="number" 
                        className={styles.denomInputHalf} 
                        value={coin5} 
                        onChange={(e) => setCoin5(e.target.value)} 
                        min="0"
                        title="5円玉"
                      />
                      <input 
                        type="number" 
                        className={styles.denomInputHalf} 
                        value={coin1} 
                        onChange={(e) => setCoin1(e.target.value)} 
                        min="0"
                        title="1円玉"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error display */}
          {errorMsg && (
            <div className={styles.errorBox}>
              <ShieldAlert size={16} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Grand total display */}
          <div className={styles.totalSummary}>
            <span className={styles.totalLabel}>準備金設定額:</span>
            <span className={styles.totalValue}>{formatCurrency(totalAmount)}</span>
          </div>

          <button 
            type="submit" 
            className={styles.submitBtn}
            disabled={submitting}
          >
            <span>{submitting ? '設定を送信中...' : '本日の営業を開始する (準備金を確定)'}</span>
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
