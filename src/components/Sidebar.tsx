'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Calculator, 
  Truck,
  Coins,
  Menu, 
  X, 
  TrendingUp,
  LogOut,
  History,
  Tag,
  Plus,
  CalendarRange
} from 'lucide-react';
import { getEvents, createEvent, getFilterEventId, Event } from '@/lib/supabase';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [submittingEvent, setSubmittingEvent] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const list = await getEvents();
        setEvents(list);
        const selId = await getFilterEventId();
        if (selId) {
          setSelectedEventId(selId);
        } else if (list.length > 0) {
          setSelectedEventId(list[0].id);
        }
      } catch (e: any) {
        console.error('Failed to load events in Sidebar:', e);
        setLoadError(e.message || '読込エラー');
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, []);

  const handleEventChange = (eventId: string) => {
    if (!eventId) return;
    localStorage.setItem('selected_event_id', eventId);
    window.location.reload();
  };

  const handleCreateEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameClean = newEventName.trim();
    if (!nameClean) {
      alert('イベント名を入力してください。');
      return;
    }
    
    try {
      setSubmittingEvent(true);
      const created = await createEvent(nameClean);
      localStorage.setItem('selected_event_id', created.id);
      setIsModalOpen(false);
      setNewEventName('');
      window.location.reload();
    } catch (err: any) {
      alert('イベントの追加に失敗しました: ' + err.message);
    } finally {
      setSubmittingEvent(false);
    }
  };

  const menuItems = [
    { name: 'ダッシュボード', path: '/', icon: LayoutDashboard },
    { name: 'レジ会計', path: '/register', icon: Calculator },
    { name: '注文履歴', path: '/orders', icon: History },
    { name: 'メニュー管理', path: '/products', icon: Tag },
    { name: '仕入れ管理', path: '/sourcing', icon: Truck },
    { name: 'レジ金管理', path: '/cash', icon: Coins },
  ];

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Mobile Header Menu Toggle Button */}
      <div className={styles.mobileHeader}>
        <div className={styles.logo}>
          <TrendingUp className={styles.logoIcon} />
          <span>学祭レジ&利益管理</span>
        </div>
        <button className={styles.toggleBtn} onClick={toggleSidebar} aria-label="Toggle Menu">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Backdrop for Mobile */}
      {isOpen && <div className={styles.backdrop} onClick={toggleSidebar} />}

      {/* Sidebar Container */}
      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.header}>
          <TrendingUp className={styles.logoIcon} />
          <span className={styles.logoText}>学祭レジ&利益管理</span>
        </div>

        {/* Event Switcher Selector */}
        <div className={styles.eventSwitcherSection}>
          <div className={styles.eventSwitcherLabel}>
            <CalendarRange size={14} className={styles.eventIcon} />
            <span>対象イベント</span>
          </div>
          <div className={styles.eventSelectorWrapper}>
            <select
              className={styles.eventSelect}
              value={selectedEventId || (events.length > 0 ? events[0].id : '')}
              onChange={(e) => handleEventChange(e.target.value)}
            >
              {loadError ? (
                <option value="">エラー: {loadError}</option>
              ) : loading ? (
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
            <button 
              type="button" 
              className={styles.addEventBtn} 
              onClick={() => { setIsOpen(false); setIsModalOpen(true); }}
              title="新しいイベントを開始"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        <nav className={styles.nav}>
          <div className={styles.sectionTitle}>メインメニュー</div>
          <ul className={styles.navList}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <li key={item.path}>
                  <Link 
                    href={item.path} 
                    className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon size={20} className={styles.icon} />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={styles.authControl}>
          <button 
            className={styles.logoutBtn}
            onClick={() => {
              if (window.confirm('アクセスロック（ログアウト）してよろしいですか？')) {
                localStorage.removeItem('sales_app_auth');
                window.location.reload();
              }
            }}
          >
            <LogOut size={16} className={styles.logoutIcon} />
            <span>アクセスロック (ログアウト)</span>
          </button>
        </div>

        <div className={styles.footer}>
          <div className={styles.version}>POS Terminal v2.1</div>
          <div className={styles.copyright}>© 2026 School Festival POS</div>
        </div>
      </aside>

      {/* New Event Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>新しい学祭・イベントを開始</h3>
              <button className={styles.modalCloseBtn} onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateEventSubmit}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>イベント名 (学祭名)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="例: 学園祭2027、エコフェス秋の陣" 
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  disabled={submittingEvent}
                  autoFocus
                />
                <p className="text-muted" style={{ fontSize: '0.725rem', marginTop: '0.35rem' }}>
                  ※新しいイベントを作成すると、自動的にそのイベントが稼働開始状態になります。
                  これ以降に記録される売上・経費はすべて新しいイベントに登録され、古いデータと混ざることはありません。
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={submittingEvent}
                >
                  キャンセル
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={submittingEvent}
                >
                  <span>{submittingEvent ? '作成中...' : '新イベントを開始'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
