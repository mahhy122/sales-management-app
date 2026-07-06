'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, AlertCircle, CalendarRange } from 'lucide-react';
import { getEvents, getFilterEventId, Event } from '@/lib/supabase';
import styles from './AuthGuard.module.css';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Get the configured password from environment variables or fallback to default
  const EXPECTED_PASSWORD = process.env.NEXT_PUBLIC_APP_PASSWORD || 'curry2026';

  useEffect(() => {
    // Check if the user is already authenticated
    const storedAuth = localStorage.getItem('sales_app_auth');
    if (storedAuth === EXPECTED_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
      // Clean up in case there was an old/invalid password stored
      if (storedAuth) {
        localStorage.removeItem('sales_app_auth');
      }
    }
  }, [EXPECTED_PASSWORD]);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoadingEvents(true);
        const list = await getEvents();
        setEvents(list);
        const selId = await getFilterEventId();
        if (selId) {
          setSelectedEventId(selId);
        } else if (list.length > 0) {
          setSelectedEventId(list[0].id);
        }
      } catch (e) {
        console.error('Failed to load events in AuthGuard:', e);
      } finally {
        setLoadingEvents(false);
      }
    };
    loadEvents();
  }, []);

  const handleEventChange = (eventId: string) => {
    if (!eventId) return;
    localStorage.setItem('selected_event_id', eventId);
    setSelectedEventId(eventId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (passwordInput === EXPECTED_PASSWORD) {
      localStorage.setItem('sales_app_auth', EXPECTED_PASSWORD);
      setIsAuthenticated(true);
    } else {
      setErrorMsg('アクセスパスワードが正しくありません。');
    }
  };

  // Prevent showing the wrong UI while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>セキュリティ認証を確認中...</p>
      </div>
    );
  }

  // Render the gatekeeper login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className={styles.gatekeeperOverlay}>
        <div className={styles.gatekeeperCard}>
          <div className={styles.lockIconCircle}>
            <Lock size={26} className={styles.lockIcon} />
          </div>
          
          <h2 className={styles.cardTitle}>学祭レジ&利益管理</h2>

          {/* Target Event Selector on Login Screen */}
          <div className={styles.loginEventSection}>
            <div className={styles.loginEventLabel}>
              <CalendarRange size={14} className={styles.loginEventIcon} />
              <span>接続先イベント</span>
            </div>
            <select
              className={styles.loginEventSelect}
              value={selectedEventId || (events.length > 0 ? events[0].id : '')}
              onChange={(e) => handleEventChange(e.target.value)}
            >
              {loadingEvents ? (
                <option value="">読込中...</option>
              ) : events.length === 0 ? (
                <option value="">イベントデータがありません</option>
              ) : (
                events.map(ev => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name} {ev.is_active ? '(現在稼働中)' : ''}
                  </option>
                ))
              )}
            </select>
          </div>
          
          <p className={styles.cardSubtitle}>
            このアプリケーションは保護されています。<br />
            閲覧・操作するにはアクセスコードを入力してください。
          </p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <input
                type={showPassword ? 'text' : 'password'}
                className={styles.passwordInput}
                placeholder="アクセスパスワード"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                className={styles.toggleVisibilityBtn}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {errorMsg && (
              <div className={styles.errorAlert}>
                <AlertCircle size={16} className={styles.errorIcon} />
                <span>{errorMsg}</span>
              </div>
            )}

            <button type="submit" className={styles.submitBtn}>
              認証してロック解除
            </button>
          </form>

          <div className={styles.cardFooter}>
            <span>※ パスワードは関係者間でのみ共有してください。</span>
          </div>
        </div>
      </div>
    );
  }

  // Render the protected content if authenticated
  return <>{children}</>;
}
