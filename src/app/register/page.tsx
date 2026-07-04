'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  ShoppingBag, 
  Trash2, 
  Check, 
  Coins, 
  RotateCcw,
  Plus,
  Minus
} from 'lucide-react';
import { getProducts, createOrder, getSalesDashboard, Product } from '@/lib/supabase';
import SupabaseSetupBanner from '@/components/SupabaseSetupBanner';
import CashDrawerSetupWizard from '@/components/CashDrawerSetupWizard';
import KeypadInput from '@/components/KeypadInput';
import styles from './register.module.css';

interface CartItem {
  product: Product;
  quantity: number;
}

export default function RegisterPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasCashDrawerSetup, setHasCashDrawerSetup] = useState<boolean | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentReceived, setPaymentReceived] = useState('');
  
  // Checkout process states
  const [submitting, setSubmitting] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [lastChange, setLastChange] = useState<number | null>(null);
  const [lastTotal, setLastTotal] = useState<number | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, dashboardData] = await Promise.all([
        getProducts(),
        getSalesDashboard()
      ]);
      setProducts(productsData);
      setHasCashDrawerSetup(dashboardData.hasCashDrawerSetup);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Cart operations
  const addToCart = (product: Product) => {
    setCheckoutSuccess(false); // Reset success banner on new activity
    setCart(prevCart => {
      const existing = prevCart.find(item => item.product.id === product.id);
      if (existing) {
        return prevCart.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return { ...item, quantity: Math.max(1, newQty) };
        }
        return item;
      });
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setPaymentReceived('');
    setCheckoutSuccess(false);
  };

  // Calculations
  const totalAmount = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const cashReceivedNum = Number(paymentReceived) || 0;
  const changeDue = cashReceivedNum - totalAmount;
  const isPaymentSufficient = cashReceivedNum >= totalAmount;

  // Quick cash handlers
  const handleQuickCash = (amount: number) => {
    setPaymentReceived(prev => {
      const current = Number(prev) || 0;
      return (current + amount).toString();
    });
  };

  const handleExactAmount = () => {
    setPaymentReceived(totalAmount.toString());
  };

  // Submit order
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!isPaymentSufficient) {
      alert('預かり金額が不足しています。');
      return;
    }

    try {
      setSubmitting(true);
      
      const orderItemsData = cart.map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        price: item.product.price
      }));

      await createOrder(
        {
          total_amount: totalAmount,
          payment_received: cashReceivedNum,
          change_given: changeDue
        },
        orderItemsData
      );

      // Record last checkout info for visual confirmation screen
      setLastChange(changeDue);
      setLastTotal(totalAmount);
      setCheckoutSuccess(true);
      
      // Clear cart
      setCart([]);
      setPaymentReceived('');
    } catch (err: any) {
      console.error('Checkout failed:', err);
      alert('会計登録に失敗しました: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(value);
  };

  if (loading) {
    return (
      <div className={styles.loadingArea}>
        <div className={styles.spinner}></div>
        <p>データを読み込み中...</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>レジ会計（POS入力）</h1>
          <p className={styles.subtitle}>注文アイテムをタップして入力し、お釣りの計算と会計確定を行います。</p>
        </div>
      </div>

      <SupabaseSetupBanner />

      {/* Success Checkout Splash Panel (Shows big change screen) */}
      {checkoutSuccess && lastChange !== null && lastTotal !== null && (
        <div className={styles.successPanel}>
          <div className={styles.successIconCircle}>
            <Check size={32} />
          </div>
          <div>
            <h2 className={styles.successTitle}>会計登録が完了しました！</h2>
            <div className={styles.changeDisplayArea}>
              <div className={styles.changeLabel}>お釣り</div>
              <div className={styles.changeBigAmount}>
                {lastChange === 0 ? 'お釣りなし (現得)' : formatCurrency(lastChange)}
              </div>
            </div>
            <p className={styles.successDetail}>
              合計金額: {formatCurrency(lastTotal)} | お預かり: {formatCurrency(lastTotal + lastChange)}
            </p>
          </div>
          <button className="btn btn-secondary" onClick={() => setCheckoutSuccess(false)}>
            次の会計へ
          </button>
        </div>
      )}

      {loading ? (
        <div className={styles.loadingArea}>
          <div className={styles.spinner}></div>
          <p>メニューをロード中...</p>
        </div>
      ) : (
        <div className="grid-cols-3">
          {/* Menu selection area (Spans 2 columns) */}
          <div className={styles.menuColumn}>
            <div className="card" style={{ height: '100%' }}>
              <h3 className="card-title" style={{ marginBottom: '1.5rem' }}>
                <ShoppingBag size={18} className="text-primary" />
                <span>メニューをタップしてカートに追加</span>
              </h3>

              <div className={styles.menuGrid}>
                {products.map((product) => (
                  <button 
                    key={product.id} 
                    className={styles.menuItemCard}
                    onClick={() => addToCart(product)}
                  >
                    <span className={styles.menuItemName}>{product.name}</span>
                    <span className={styles.menuItemPrice}>{formatCurrency(product.price)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cart and cashier checkout (Spans 1 column) */}
          <div className={styles.cashierColumn}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: 'fit-content' }}>
              <div className="flex-between" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                <h3 className="card-title" style={{ margin: 0 }}>
                  <Calculator size={18} className="text-muted" />
                  <span>会計カート</span>
                </h3>
                {cart.length > 0 && (
                  <button className={styles.clearBtn} onClick={clearCart} title="カートを空にする">
                    <RotateCcw size={14} />
                    <span>クリア</span>
                  </button>
                )}
              </div>

              {/* Cart List */}
              {cart.length === 0 ? (
                <div className={styles.emptyCart}>
                  <Calculator size={36} className="text-muted" style={{ marginBottom: '0.5rem' }} />
                  <p>カートは空です。</p>
                  <p className={styles.emptyCartSub}>左側のメニューをタップして注文を入力してください。</p>
                </div>
              ) : (
                <div className={styles.cartList}>
                  {cart.map((item) => (
                    <div key={item.product.id} className={styles.cartItem}>
                      <div className={styles.cartItemMain}>
                        <span className={styles.cartItemName}>{item.product.name}</span>
                        <span className={styles.cartItemSubtotal}>
                          {formatCurrency(item.product.price * item.quantity)}
                        </span>
                      </div>
                      <div className={styles.cartItemActions}>
                        <div className={styles.qtyControl}>
                          <button 
                            className={styles.qtyBtn} 
                            onClick={() => updateQuantity(item.product.id, -1)}
                          >
                            <Minus size={12} />
                          </button>
                          <span className={styles.qtyValue}>{item.quantity}</span>
                          <button 
                            className={styles.qtyBtn} 
                            onClick={() => addToCart(item.product)}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <button 
                          className={styles.itemDeleteBtn}
                          onClick={() => removeFromCart(item.product.id)}
                          title="削除"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sum calculations */}
              {cart.length > 0 && (
                <div className={styles.summaryBlock}>
                  <div className={styles.summaryRowBig}>
                    <span>合計金額:</span>
                    <span className={styles.summaryTotal}>{formatCurrency(totalAmount)}</span>
                  </div>

                  {/* Cash received input */}
                  <div className="form-group" style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>お預かり金額 (円)</label>
                    <KeypadInput 
                      type="text" 
                      className="form-input" 
                      style={{ fontSize: '1.25rem', fontWeight: 'bold', padding: '0.6rem 1rem' }}
                      placeholder="預かり金額を入力"
                      value={paymentReceived}
                      onChange={(val) => setPaymentReceived(val)}
                      title="お預かり金額の入力"
                      suffix="円"
                    />
                  </div>

                  {/* Quick Cash Buttons */}
                  <div className={styles.quickCashGrid}>
                    <button className={styles.quickCashBtn} onClick={handleExactAmount}>
                      現得
                    </button>
                    <button className={styles.quickCashBtn} onClick={() => handleQuickCash(1000)}>
                      +1000円
                    </button>
                    <button className={styles.quickCashBtn} onClick={() => handleQuickCash(2000)}>
                      +2000円
                    </button>
                    <button className={styles.quickCashBtn} onClick={() => handleQuickCash(5000)}>
                      +5000円
                    </button>
                    <button 
                      className={styles.quickCashClear} 
                      onClick={() => setPaymentReceived('')} 
                      title="リセット"
                    >
                      リセット
                    </button>
                  </div>

                  {/* Change calculation display */}
                  {paymentReceived !== '' && (
                    <div className={`${styles.changeDueBox} ${isPaymentSufficient ? styles.sufficient : styles.insufficient}`}>
                      <span className={styles.changeLabelText}>
                        {isPaymentSufficient ? 'お釣り:' : '不足額:'}
                      </span>
                      <span className={styles.changeAmountText}>
                        {formatCurrency(Math.abs(changeDue))}
                      </span>
                    </div>
                  )}

                  {/* Submit checkout */}
                  <button 
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', marginTop: '0.75rem', borderRadius: 'var(--radius)' }}
                    disabled={submitting || !isPaymentSufficient}
                    onClick={handleCheckout}
                  >
                    <Coins size={20} />
                    <span>{submitting ? '登録中...' : '会計を確定する'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
