'use client';

import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  PlusCircle, 
  Trash2, 
  AlertCircle,
  TrendingDown,
  Calendar,
  FileText,
  Zap,
  ShieldCheck,
  Package,
  Layers,
  Filter
} from 'lucide-react';
import { getSourcing, addSourcingItem, deleteSourcingItem, SourcingItem } from '@/lib/supabase';
import SupabaseSetupBanner from '@/components/SupabaseSetupBanner';
import KeypadInput from '@/components/KeypadInput';
import styles from './sourcing.module.css';

const EXPENSE_CATEGORIES = [
  { id: '食材・資材', name: '食材・資材', shortName: '食材・資材', icon: '🍲', placeholder: '例: カレー用牛肉 (5kg)、米 (15kg)', badgeClass: styles.categoryBadgeFood },
  { id: '光熱費', name: '光熱費 (電気・ガス・水道代等)', shortName: '光熱費', icon: '⚡', placeholder: '例: プロパンガス代、電気使用料', badgeClass: styles.categoryBadgeUtility },
  { id: '衛生管理費', name: '衛生管理費 (消毒液・手袋等)', shortName: '衛生管理費', icon: '🧼', placeholder: '例: アルコール消毒液、調理手袋、検便費用', badgeClass: styles.categoryBadgeHygiene },
  { id: '設備・備品', name: '設備・備品 (テント・工具等)', shortName: '設備・備品', icon: '🎪', placeholder: '例: 卓上コンロ、ポスター印刷、看板資材', badgeClass: styles.categoryBadgeEquipment },
  { id: 'その他経費', name: 'その他経費 (雑費・交通費等)', shortName: 'その他経費', icon: '📋', placeholder: '例: 会場使用料、搬入ガソリン代、パーキング代', badgeClass: styles.categoryBadgeOther },
];

export default function SourcingPage() {
  const [sourcingItems, setSourcingItems] = useState<SourcingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [category, setCategory] = useState('食材・資材');
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [cost, setCost] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Filter state
  const [filterCategory, setFilterCategory] = useState('all');

  // Submit status states
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  // Common units
  const units = ['kg', '個', '本', '袋', 'パック', '箱', 'セット', '枚', '式', '件'];

  const loadSourcingData = async () => {
    try {
      setLoading(true);
      const data = await getSourcing();
      setSourcingItems(data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load sourcing data:', err);
      setError('仕入れ・経費履歴の読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSourcingData();
  }, []);

  const handleCategorySelect = (catId: string) => {
    setCategory(catId);
    if (catId !== '食材・資材') {
      if (!quantity) setQuantity('1');
      if (unit === 'kg' || unit === '本' || unit === '個') setUnit('式');
    } else {
      if (unit === '式' || unit === '件') setUnit('kg');
    }
  };

  const handleAddSourcing = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(false);

    // Validation
    const cleanItemName = itemName.trim();
    const cleanQty = Number(quantity);
    const cleanCost = Number(cost);

    if (!cleanItemName) {
      setFormError('項目・資材名を入力してください。');
      return;
    }
    if (!quantity || isNaN(cleanQty) || cleanQty <= 0) {
      setFormError('数量を正しい半角数値（0より大きい値）で入力してください。');
      return;
    }
    if (!cost || isNaN(cleanCost) || cleanCost < 0) {
      setFormError('金額を正しい半角数値で入力してください。');
      return;
    }
    if (!purchaseDate) {
      setFormError('発生・支払日を入力してください。');
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
        notes: notes.trim() || undefined,
        category: category
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
      setFormError(err.message || '経費データの登録に失敗しました。');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSourcing = async (id: string) => {
    if (!window.confirm('この経費データを削除してもよろしいですか？（※ダッシュボードの純利益も更新されます）')) {
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

  // Calculate total expenses & category breakdowns
  const totalExpenses = sourcingItems.reduce((sum, item) => sum + Number(item.cost), 0);
  const foodTotal = sourcingItems.filter(i => (i.category || '食材・資材') === '食材・資材').reduce((s, i) => s + Number(i.cost), 0);
  const utilityTotal = sourcingItems.filter(i => i.category === '光熱費').reduce((s, i) => s + Number(i.cost), 0);
  const hygieneTotal = sourcingItems.filter(i => i.category === '衛生管理費').reduce((s, i) => s + Number(i.cost), 0);
  const equipmentTotal = sourcingItems.filter(i => i.category === '設備・備品').reduce((s, i) => s + Number(i.cost), 0);
  const otherTotal = sourcingItems.filter(i => i.category === 'その他経費').reduce((s, i) => s + Number(i.cost), 0);

  // Filtered items list
  const filteredItems = sourcingItems.filter(item => {
    if (filterCategory === 'all') return true;
    const cat = item.category || '食材・資材';
    return cat === filterCategory;
  });

  const currentCategoryConfig = EXPENSE_CATEGORIES.find(c => c.id === category) || EXPENSE_CATEGORIES[0];

  const getCategoryBadge = (itemCat?: string) => {
    const catName = itemCat || '食材・資材';
    const found = EXPENSE_CATEGORIES.find(c => c.id === catName);
    return (
      <span className={`${styles.categoryBadge} ${found?.badgeClass || styles.categoryBadgeFood}`}>
        <span>{found?.icon || '📦'}</span>
        <span>{catName}</span>
      </span>
    );
  };

  return (
    <>
      {/* Title Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>仕入れ・経費管理</h1>
          <p className={styles.subtitle}>食材・資材仕入れのほか、電気・ガス代、衛生管理費、備品・その他雑費を一括管理します。</p>
        </div>
      </div>

      <SupabaseSetupBanner />

      {/* Stats Summary Widget & Category Breakdown */}
      <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className={styles.costIconWrapper}>
              <TrendingDown size={20} className={styles.costColor} />
            </div>
            <div>
              <span className={styles.costLabel}>全経費・仕入れ総額</span>
              <div className={styles.costValue}>{formatCurrency(totalExpenses)}</div>
            </div>
          </div>
          <span className={styles.costDesc}>すべての経費（食材・光熱費・衛生費・その他）の合算額</span>
        </div>

        {/* Category breakdown mini cards */}
        <div className={styles.categoryBreakdownRow}>
          <div className={styles.breakdownMiniCard}>
            <span className={styles.breakdownMiniTitle}>🍲 食材・資材</span>
            <span className={styles.breakdownMiniAmount}>{formatCurrency(foodTotal)}</span>
          </div>
          <div className={styles.breakdownMiniCard}>
            <span className={styles.breakdownMiniTitle}>⚡ 光熱費</span>
            <span className={styles.breakdownMiniAmount}>{formatCurrency(utilityTotal)}</span>
          </div>
          <div className={styles.breakdownMiniCard}>
            <span className={styles.breakdownMiniTitle}>🧼 衛生管理費</span>
            <span className={styles.breakdownMiniAmount}>{formatCurrency(hygieneTotal)}</span>
          </div>
          <div className={styles.breakdownMiniCard}>
            <span className={styles.breakdownMiniTitle}>🎪 設備・備品</span>
            <span className={styles.breakdownMiniAmount}>{formatCurrency(equipmentTotal)}</span>
          </div>
          <div className={styles.breakdownMiniCard}>
            <span className={styles.breakdownMiniTitle}>📋 その他経費</span>
            <span className={styles.breakdownMiniAmount}>{formatCurrency(otherTotal)}</span>
          </div>
        </div>
      </div>

      {loading && sourcingItems.length === 0 ? (
        <div className={styles.loadingArea}>
          <div className={styles.spinner}></div>
          <p>仕入れ・経費データを読み込み中...</p>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 className="card-title" style={{ margin: 0 }}>
                  <Truck size={18} className="text-muted" />
                  <span>経費・仕入れ明細一覧 ({filteredItems.length}件)</span>
                </h3>
              </div>

              {/* Category Filter Tabs */}
              <div className={styles.filterBar}>
                <button
                  type="button"
                  className={`${styles.filterTab} ${filterCategory === 'all' ? styles.filterTabActive : ''}`}
                  onClick={() => setFilterCategory('all')}
                >
                  <Filter size={14} />
                  <span>すべて ({sourcingItems.length})</span>
                </button>
                {EXPENSE_CATEGORIES.map(cat => {
                  const count = sourcingItems.filter(i => (i.category || '食材・資材') === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className={`${styles.filterTab} ${filterCategory === cat.id ? styles.filterTabActive : ''}`}
                      onClick={() => setFilterCategory(cat.id)}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.shortName} ({count})</span>
                    </button>
                  );
                })}
              </div>

              {filteredItems.length === 0 ? (
                <div className={styles.emptyState}>
                  <Truck size={48} className="text-muted" style={{ marginBottom: '1rem' }} />
                  <p>
                    {filterCategory === 'all' 
                      ? '経費データが登録されていません。右のフォームから追加してください。' 
                      : `「${filterCategory}」の経費データはありません。`}
                  </p>
                </div>
              ) : (
                <div className="table-container" style={{ border: 'none', boxShadow: 'none', margin: 0 }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ width: '105px' }}>発生日</th>
                        <th style={{ width: '115px' }}>区分</th>
                        <th>項目・内容</th>
                        <th className="text-right">数量</th>
                        <th className="text-right" style={{ width: '120px' }}>金額</th>
                        <th>備考・メモ</th>
                        <th className="text-center" style={{ width: '60px' }}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item) => (
                        <tr key={item.id}>
                          <td className="text-muted font-semibold">{item.purchase_date}</td>
                          <td>{getCategoryBadge(item.category)}</td>
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
            <h3 className="card-title" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <PlusCircle size={18} className="text-primary" />
              <span>経費を追加</span>
            </h3>

            {formSuccess && (
              <div className={styles.formSuccessAlert}>
                <span>経費データを登録しました。</span>
              </div>
            )}

            {formError && (
              <div className={styles.formErrorAlert}>
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddSourcing}>
              {/* Category Select Radio Pills */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>経費区分</label>
                <div className={styles.categoryRadioGrid}>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`${styles.categoryRadioBtn} ${category === cat.id ? styles.categoryRadioActive : ''}`}
                      onClick={() => handleCategorySelect(cat.id)}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.shortName}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">項目・資材名</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder={currentCategoryConfig.placeholder}
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
                    placeholder="1"
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
                <label className="form-label">支出金額 (円)</label>
                <KeypadInput 
                  type="text" 
                  className="form-input"
                  placeholder="例: 4500"
                  value={cost}
                  onChange={(val) => setCost(val)}
                  title="金額の入力"
                  suffix="円"
                />
              </div>

              <div className="form-group">
                <label className="form-label">発生・支払日</label>
                <input 
                  type="date" 
                  className="form-input"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">備考・支払先</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="例: ガス会社、業務スーパー、保健所"
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
                <span>{submitting ? '追加中...' : '経費データを登録'}</span>
              </button>
            </form>

            <div className={styles.masterInfoTip}>
              <FileText size={14} className="text-muted" style={{ marginRight: '0.25rem', flexShrink: 0 }} />
              <span>ここで入力された支出は、ダッシュボードの「仕入れ・経費総額」および「純利益」の計算にマイナス経費として反映されます。</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
