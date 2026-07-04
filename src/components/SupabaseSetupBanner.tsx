'use client';

import React, { useState, useEffect } from 'react';
import { Database, Copy, Check, Info, ShieldAlert } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';
import styles from './SupabaseSetupBanner.module.css';

export default function SupabaseSetupBanner() {
  const [configured, setConfigured] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setConfigured(isSupabaseConfigured());
  }, []);

  const envTemplate = `NEXT_PUBLIC_SUPABASE_URL=あなたのSUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=あなたのSUPABASE_ANON_KEY`;

  const handleCopy = () => {
    navigator.clipboard.writeText(envTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`${styles.banner} ${configured ? styles.live : styles.mock}`}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <div className={`${styles.iconCircle} ${configured ? styles.liveIcon : styles.mockIcon}`}>
            <Database size={18} />
          </div>
          <div>
            <h4 className={styles.title}>
              {configured ? 'Supabase データベース連携中' : 'ローカル開発モードで動作中（モック環境）'}
            </h4>
            <p className={styles.description}>
              {configured 
                ? '実機の Supabase クラウドデータベースと接続されており、リアルタイム同期が有効です。' 
                : '環境変数が未設定のため、ブラウザの localStorage にデータを保存しています。データを永続化するには設定を行ってください。'}
            </p>
          </div>
        </div>
        <span className={`${styles.badge} ${configured ? styles.badgeLive : styles.badgeMock}`}>
          {configured ? 'LIVE' : 'MOCK'}
        </span>
      </div>

      {!configured && (
        <div className={styles.setupInstructions}>
          <div className={styles.infoBox}>
            <Info size={16} className={styles.infoIcon} />
            <span>連携手順: ルートディレクトリに <code>.env.local</code> ファイルを作成し、以下を記述してください。</span>
          </div>
          <div className={styles.codeContainer}>
            <pre className={styles.codeBlock}>
              {envTemplate}
            </pre>
            <button className={styles.copyBtn} onClick={handleCopy} title="テンプレートをコピー">
              {copied ? <Check size={16} className={styles.copiedIcon} /> : <Copy size={16} />}
              <span>{copied ? 'コピーしました！' : 'テンプレートコピー'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
