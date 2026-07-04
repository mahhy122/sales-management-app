'use client';

import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  PlusCircle, 
  Trash2, 
  AlertCircle,
  TrendingDown,
  Calendar,
  FileText
} from 'lucide-react';
import { getSourcing, addSourcingItem, deleteSourcingItem, SourcingItem } from '@/lib/supabase';
import SupabaseSetupBanner from '@/components/SupabaseSetupBanner';
import KeypadInput from '@/components/KeypadInput';
import styles from './sourcing.module.css';

export default function SourcingPage() {
  const [sourcingItems, setSourcingItems] = useState<SourcingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [cost, setCost] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Submit status states
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  // Common units
  const units = ['kg', '個', '本', '袋', 'パック', '箱', 'セット', '枚'];

  const loadSourcingData = async () => {
    try {
      setLoading(true);
      const data = await getSourcing();
      setSourcingItems(data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load sourcing data:', err);
      setError('仕入れ履歴の読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSourcingData();
  }, []);

  const handleAddSourcing = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(false);

    // Validation
    const cleanItemName = itemName.trim();
    const cleanQty = Number(quantity);
    const cleanCost = Number(cost);

    if (!cleanItemName) {
      setFormError('資材・食材名を入力してください。');
      return;
    }
    if (!quantity || isNaN(cleanQty) || cleanQty <= 0) {
      setFormError('数量を正しい半角数値（0より大きい値）で入力してください。');
      return;
    }
    if (!cost || isNaN(cleanCost) || cleanCost < 0) {
      setFormError('仕入れ金額を正しい半角数値で入力してください。');
      return;
    }
    if (!purchaseDate) {
      setFormError('仕入れ日を入力してください。');
      return;
    }

    try {
      setSubmitting(true);
      await addSourcingItem({
        item_name: cleanItemName,
        quantity: cleanQty,
        unit: unit,
        cost: cleanCost,
        purchase_date: purchaseDate,
        notes: notes.trim() || undefined
      });

      setFormSuccess(true);
      setItemName('');
      setQuantity('');
      setCost('');
      setNotes('');
      
      // Reload sourcing items list
      await loadSourcingData();
    } catch (err: any) {
      console.error('Failed to add sourcing item:', err);
      setFormError(err.message || '仕入れデータの登録に失敗しました。');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSourcing = async (id: string) => {
    if (!window.confirm('この仕入れデータを削除してもよろしいですか？（※ダッシュボードの純利益も更新されます）')) {
      return;
    }
    
    try {
      await deleteSourcingItem(id);
      await loadSourcingData();
    } catch (err: any) {
      alert('削除に失敗しました: ' + err.message);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(value);
  };

  // Calculate total expenses
  const totalExpenses = sourcingItems.reduce((sum, item) => sum + Number(item.cost), 0);

  return (
    <>
      {/* Title Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>仕入れ管理（経費登録）</h1>
          <p className={styles.subtitle}>カレーの食材や使い捨て容器、水などの仕入れ経費を登録・管理します。</p>
        </div>
      </div>

      <SupabaseSetupBanner />

      {/* Stats Widget */}
      <div className="card" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className={styles.costIconWrapper}>
            <TrendingDown size={20} className={styles.costColor} />
          </div>
          <div>
            <span className={styles.costLabel}>現在の仕入れ（経費）総額</span>
            <div className={styles.costValue}>{formatCurrency(totalExpenses)}</div>
          </div>
        </div>
        <span className={styles.costDesc}>登録済みの仕入れ経費の合算金額</span>
      </div>

      {loading && sourcingItems.length === 0 ? (
        <div className={styles.loadingArea}>
          <div className={styles.spinner}></div>
          <p>仕入れデータを読み込み中...</p>
        </div>
      ) : error ? (
        <div className={styles.errorArea}>
          <AlertCircle size={40} className="text-danger" />
          <h3>エラーが発生しました</h3>
          <p>{error}</p>
        </div>
      ) : (
        <div className="grid-cols-3">
          {/* Sourcing list (Spans 2 columns) */}
          <div className={styles.listCard}>
            <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <h3 className="card-title">
                <Truck size={18} className="text-muted" />
                <span>仕入れ履歴一覧 ({sourcingItems.length}件)</span>
              </h3>

              {sourcingItems.length === 0 ? (
                <div className={styles.emptyState}>
                  <Truck size={48} className="text-muted" style={{ marginBottom: '1rem' }} />
                  <p>仕入れデータが登録されていません。右のフォームから追加してください。</p>
                </div>
              ) : (
                <div className="table-container" style={{ border: 'none', boxShadow: 'none', margin: 0 }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ width: '110px' }}>仕入れ日</th>
                        <th>資材・食材名</th>
                        <th className="text-right">数量</th>
                        <th className="text-right" style={{ width: '130px' }}>金額</th>
                        <th>備考・購入先</th>
                        <th className="text-center" style={{ width: '70px' }}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sourcingItems.map((item) => (
                        <tr key={item.id}>
                          <td className="text-muted font-semibold">{item.purchase_date}</td>
                          <td>
                            <div className={styles.itemName}>{item.item_name}</div>
                          </td>
                          <td className="text-right font-semibold">
                            {item.quantity} <span className={styles.unitText}>{item.unit}</span>
                          </td>
                          <td className="text-right font-bold text-danger">
                            {formatCurrency(item.cost)}
                          </td>
                          <td className="text-muted" style={{ fontSize: '0.825rem' }}>
                            {item.notes || '—'}
                          </td>
                          <td className="text-center">
                            <button 
                              className={styles.deleteBtn}
                              onClick={() => handleDeleteSourcing(item.id)}
                              title="削除"
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
          </div>

          {/* Sourcing Input Form (Spans 1 column) */}
          <div className="card" style={{ height: 'fit-content' }}>
            <h3 className="card-title" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <PlusCircle size={18} className="text-primary" />
              <span>仕入れ経費を追加</span>
            </h3>

            {formSuccess && (
              <div className={styles.formSuccessAlert}>
                <span>仕入れ経費を登録しました。</span>
              </div>
            )}

            {formError && (
              <div className={styles.formErrorAlert}>
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddSourcing}>
              <div className="form-group">
                <label className="form-label">資材・食材名</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="例: カレー用牛肉 (5kg)"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                />
              </div>

              <div className="grid-cols-2" style={{ gap: '0.75rem', marginBottom: '0.25rem' }}>
                <div className="form-group">
                  <label className="form-label">数量</label>
                  <KeypadInput 
                    type="text" 
                    className="form-input"
                    placeholder="5"
                    value={quantity}
                    onChange={(val) => setQuantity(val)}
                    title="数量の入力"
                    suffix={unit}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">単位</label>
                  <select 
                    className="form-input form-select"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  >
                    {units.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">仕入れ総額 (円)</label>
                <KeypadInput 
                  type="text" 
                  className="form-input"
                  placeholder="例: 8500"
                  value={cost}
                  onChange={(val) => setCost(val)}
                  title="仕入れ総額の入力"
                  suffix="円"
                />
              </div>

              <div className="form-group">
                <label className="form-label">仕入れ日</label>
                <input 
                  type="date" 
                  className="form-input"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">備考・仕入れ先</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="例: 業務スーパー、肉のハナマサ"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '1rem' }}
                disabled={submitting}
              >
                <span>{submitting ? '追加中...' : '仕入れデータを登録'}</span>
              </button>
            </form>

            <div className={styles.masterInfoTip}>
              <FileText size={14} className="text-muted" style={{ marginRight: '0.25rem', flexShrink: 0 }} />
              <span>ここで入力された支出は、ダッシュボードの「仕入れ総額」および「純利益」の計算にマイナス経費として即座に反映されます。</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
