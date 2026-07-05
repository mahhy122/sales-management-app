'use client';

import React, { useState, useEffect } from 'react';
import { 
  Tag, 
  PlusCircle, 
  Trash2, 
  Edit3, 
  AlertCircle,
  X,
  Check
} from 'lucide-react';
import { getProducts, addProduct, updateProduct, deleteProduct, Product } from '@/lib/supabase';
import SupabaseSetupBanner from '@/components/SupabaseSetupBanner';
import KeypadInput from '@/components/KeypadInput';
import styles from './products.module.css';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  // Submit status states
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  const loadProductsData = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load products:', err);
      setError('商品メニューの読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProductsData();
  }, []);

  // Handle Add/Edit Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(false);

    const cleanName = name.trim();
    const cleanPrice = Number(price);

    if (!cleanName) {
      setFormError('商品名を入力してください。');
      return;
    }
    if (!price || isNaN(cleanPrice) || cleanPrice <= 0) {
      setFormError('価格を正しく入力してください（0円より大きい価格を設定してください）。');
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        // Edit Mode
        await updateProduct(editingId, cleanName, cleanPrice);
        setFormSuccess(true);
        // Clear edit state
        setEditingId(null);
      } else {
        // Add Mode
        await addProduct(cleanName, cleanPrice);
        setFormSuccess(true);
      }

      setName('');
      setPrice('');
      await loadProductsData();
    } catch (err: any) {
      console.error('Failed to save product:', err);
      setFormError(err.message || '商品の保存に失敗しました。');
    } finally {
      setSubmitting(false);
    }
  };

  // Trigger Edit Mode
  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setName(product.name);
    setPrice(product.price.toString());
    setFormError(null);
    setFormSuccess(false);
  };

  // Cancel Edit Mode
  const cancelEdit = () => {
    setEditingId(null);
    setName('');
    setPrice('');
    setFormError(null);
    setFormSuccess(false);
  };

  // Handle Product Deletion
  const handleDeleteProduct = async (product: Product) => {
    const isConfirmed = window.confirm(
      `商品「${product.name}」をメニューから削除してもよろしいですか？\n` +
      `【注意】この操作を行っても、過去の注文履歴に記録されている売上データは壊れません（商品IDのみ消去されます）。`
    );

    if (!isConfirmed) return;

    try {
      await deleteProduct(product.id);
      await loadProductsData();
      if (editingId === product.id) {
        cancelEdit();
      }
    } catch (err: any) {
      alert('商品の削除に失敗しました: ' + err.message);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <>
      {/* Title Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>商品メニュー管理（マスタ設定）</h1>
          <p className={styles.subtitle}>レジ画面で販売する商品の追加、価格変更、メニューからの削除を行えます。</p>
        </div>
      </div>

      <SupabaseSetupBanner />

      {loading && products.length === 0 ? (
        <div className={styles.loadingArea}>
          <div className={styles.spinner}></div>
          <p>メニューデータを読み込み中...</p>
        </div>
      ) : error ? (
        <div className={styles.errorArea}>
          <AlertCircle size={40} className="text-danger" />
          <h3>エラーが発生しました</h3>
          <p>{error}</p>
        </div>
      ) : (
        <div className="grid-cols-3">
          {/* Menu Items List (Spans 2 columns) */}
          <div className={styles.listCard}>
            <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <h3 className="card-title">
                <Tag size={18} className="text-muted" />
                <span>販売中のメニュー一覧 ({products.length}品目)</span>
              </h3>

              {products.length === 0 ? (
                <div className={styles.emptyState}>
                  <Tag size={48} className="text-muted" style={{ marginBottom: '1rem' }} />
                  <p>登録されている商品がありません。右のフォームから追加してください。</p>
                </div>
              ) : (
                <div className="table-container" style={{ border: 'none', boxShadow: 'none', margin: 0 }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>商品名</th>
                        <th className="text-right" style={{ width: '150px' }}>価格</th>
                        <th className="text-center" style={{ width: '130px' }}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id} className={editingId === product.id ? styles.editingRow : ''}>
                          <td>
                            <div className={styles.productName}>{product.name}</div>
                          </td>
                          <td className="text-right font-extrabold text-primary" style={{ fontSize: '1rem' }}>
                            {formatCurrency(product.price)}
                          </td>
                          <td className="text-center">
                            <div className={styles.actionCell}>
                              <button 
                                className={styles.editBtn}
                                onClick={() => startEdit(product)}
                                title="編集"
                                disabled={submitting}
                              >
                                <Edit3 size={16} />
                              </button>
                              <button 
                                className={styles.deleteBtn}
                                onClick={() => handleDeleteProduct(product)}
                                title="削除"
                                disabled={submitting}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
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
              {editingId ? (
                <>
                  <Edit3 size={18} className="text-primary" />
                  <span>メニュー項目を編集</span>
                </>
              ) : (
                <>
                  <PlusCircle size={18} className="text-primary" />
                  <span>商品を新規追加</span>
                </>
              )}
            </h3>

            {formSuccess && (
              <div className={styles.formSuccessAlert}>
                <Check size={16} style={{ marginRight: '0.4rem', flexShrink: 0 }} />
                <span>商品を正常に保存しました。</span>
              </div>
            )}

            {formError && (
              <div className={styles.formErrorAlert}>
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">商品名</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="例: カレー（大盛り）、トッピングチーズ"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={submitting}
                  autoFocus={!!editingId}
                />
              </div>

              <div className="form-group">
                <label className="form-label">単価・価格（円）</label>
                <div className={styles.inputWithUnit}>
                  <KeypadInput 
                    type="text" 
                    className="form-input"
                    placeholder="500"
                    value={price}
                    onChange={(val) => setPrice(val)}
                    disabled={submitting}
                    title="価格の入力"
                    suffix="円"
                  />
                  <span className={styles.unitRight}>円</span>
                </div>
              </div>

              <div className={styles.formActions}>
                {editingId && (
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ flex: 1 }}
                    onClick={cancelEdit}
                    disabled={submitting}
                  >
                    キャンセル
                  </button>
                )}
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ flex: 2 }}
                  disabled={submitting}
                >
                  <span>{submitting ? '保存中...' : editingId ? '変更を保存' : '商品を登録'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
