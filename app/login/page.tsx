'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    const res = await signIn('credentials', { password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError('Incorrect password');
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f7f8fa',
    }}>
      <div style={{
        background: '#fff',
        padding: 40,
        borderRadius: 10,
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        width: 360,
      }}>
        <h1 style={{
          margin: 0,
          marginBottom: 6,
          fontSize: 22,
          fontWeight: 600,
          color: '#030712',
        }}>Ledger</h1>
        <p style={{ margin: 0, marginBottom: 24, fontSize: 13, color: '#6b7280' }}>
          Personal financial operations
        </p>
        <label style={{
          display: 'block',
          fontSize: 11,
          fontWeight: 500,
          color: '#6b7280',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: 6,
        }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          autoFocus
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: 14,
            border: '1px solid #d1d5db',
            borderRadius: 6,
            marginBottom: 16,
            boxSizing: 'border-box',
          }}
        />
        {error && (
          <div style={{
            color: '#dc2626',
            fontSize: 13,
            marginBottom: 12,
          }}>{error}</div>
        )}
        <button
          onClick={handleSubmit}
          disabled={loading || !password}
          style={{
            width: '100%',
            padding: '10px 16px',
            background: '#0f4c75',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500,
            cursor: loading ? 'wait' : 'pointer',
            opacity: !password ? 0.5 : 1,
          }}
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </div>
    </div>
  );
}
