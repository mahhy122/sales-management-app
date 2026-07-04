'use client';

import React, { useState, useEffect } from 'react';
import { Delete, Check, X, CornerDownLeft } from 'lucide-react';
import styles from './NumericKeypadModal.module.css';

interface NumericKeypadModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  initialValue: string;
  onConfirm: (value: string) => void;
  suffix?: string; // e.g. "円" or "枚"
}

export default function NumericKeypadModal({
  isOpen,
  onClose,
  title,
  initialValue,
  onConfirm,
  suffix = '円'
}: NumericKeypadModalProps) {
  const [value, setValue] = useState('');

  useEffect(() => {
    // Set initial value (strip non-numeric or default '0' for clean editing)
    if (initialValue === '0' || initialValue === '') {
      setValue('');
    } else {
      setValue(initialValue.toString());
    }
  }, [initialValue]);

  if (!isOpen) return null;

  const handleKeyPress = (num: string) => {
    setValue(prev => {
      // Limit to 9 digits to prevent overflow
      if (prev.length >= 9) return prev;
      return prev + num;
    });
  };

  const handleBackspace = () => {
    setValue(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setValue('');
  };

  const handleQuickAdd = (amount: number) => {
    setValue(prev => {
      const current = Number(prev) || 0;
      const next = current + amount;
      return next.toString();
    });
  };

  const handleConfirm = () => {
    // Return '0' if empty
    onConfirm(value === '' ? '0' : value);
  };

  const formatDisplay = (val: string) => {
    const num = Number(val) || 0;
    if (suffix === '円') {
      return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(num);
    }
    return `${num.toLocaleString()} ${suffix}`;
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="閉じる">
            <X size={20} />
          </button>
        </div>

        {/* Display screen */}
        <div className={styles.displayArea}>
          <div className={styles.displayValue}>
            {value === '' ? <span className={styles.placeholder}>{formatDisplay('0')}</span> : formatDisplay(value)}
            <span className={styles.cursor}>|</span>
          </div>
        </div>

        {/* Quick add keys (Only for Currency) */}
        {suffix === '円' && (
          <div className={styles.quickAddRow}>
            <button type="button" className={styles.quickBtn} onClick={() => handleQuickAdd(1000)}>
              +1,000円
            </button>
            <button type="button" className={styles.quickBtn} onClick={() => handleQuickAdd(5000)}>
              +5,000円
            </button>
            <button type="button" className={styles.quickBtn} onClick={() => handleQuickAdd(10000)}>
              +10,000円
            </button>
          </div>
        )}

        {/* Keypad Grid */}
        <div className={styles.keypadGrid}>
          {/* Numbers */}
          <button type="button" className={styles.keyBtn} onClick={() => handleKeyPress('7')}>7</button>
          <button type="button" className={styles.keyBtn} onClick={() => handleKeyPress('8')}>8</button>
          <button type="button" className={styles.keyBtn} onClick={() => handleKeyPress('9')}>9</button>

          <button type="button" className={styles.keyBtn} onClick={() => handleKeyPress('4')}>4</button>
          <button type="button" className={styles.keyBtn} onClick={() => handleKeyPress('5')}>5</button>
          <button type="button" className={styles.keyBtn} onClick={() => handleKeyPress('6')}>6</button>

          <button type="button" className={styles.keyBtn} onClick={() => handleKeyPress('1')}>1</button>
          <button type="button" className={styles.keyBtn} onClick={() => handleKeyPress('2')}>2</button>
          <button type="button" className={styles.keyBtn} onClick={() => handleKeyPress('3')}>3</button>

          <button type="button" className={styles.keyBtn} onClick={() => handleKeyPress('0')}>0</button>
          <button type="button" className={styles.keyBtn} onClick={() => handleKeyPress('00')}>00</button>
          <button type="button" className={`${styles.keyBtn} ${styles.clearKey}`} onClick={handleClear}>AC</button>
          
          <button type="button" className={`${styles.keyBtn} ${styles.backspaceKey}`} onClick={handleBackspace} aria-label="1文字削除">
            <Delete size={20} />
          </button>
          <button type="button" className={`${styles.keyBtn} ${styles.confirmKey}`} onClick={handleConfirm}>
            <Check size={20} style={{ marginRight: '0.25rem' }} />
            <span>決定</span>
          </button>
        </div>
      </div>
    </div>
  );
}
