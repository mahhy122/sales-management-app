'use client';

import React, { useState } from 'react';
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
  Tag
} from 'lucide-react';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

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
          <span className={styles.logoText}>学祭カレーレジ</span>
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
    </>
  );
}
