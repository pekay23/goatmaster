'use client';
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function Login({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [creds, setCreds] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccessMsg(''); setIsLoading(true);
    const endpoint = isRegistering ? '/api/auth/signup' : '/api/auth/login';
    const payload = isRegistering
      ? { username: creds.username, email: creds.username, password: creds.password }
      : { email: creds.username, password: creds.password };
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        const userData = data?.data || data;
        if (isRegistering) {
          setSuccessMsg('Account created! Logging you in…');
          setTimeout(() => onLogin(userData), 800);
        } else {
          onLogin(userData);
        }
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '13px 14px', border: '1.5px solid var(--border-color)',
    borderRadius: '12px', fontSize: '16px', background: 'var(--bg-app)',
    color: 'var(--text-main)', fontFamily: 'inherit', boxSizing: 'border-box',
    outline: 'none', transition: 'border-color 0.2s',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', backgroundColor: 'var(--bg-app)' }}>
      <div style={{ padding: '36px 32px', backgroundColor: 'var(--bg-card)', borderRadius: '24px', boxShadow: '0 8px 40px rgba(0,0,0,0.10)', border: '1px solid var(--border-color)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <img src="/icon-192.png" alt="Goat Master" style={{ width: 56, height: 56, borderRadius: 14, marginBottom: 8 }} />
        <h1 style={{ margin: '0 0 6px', fontSize: '26px', fontWeight: 800, color: 'var(--text-main)' }}>Goat Master</h1>
        <p style={{ margin: '0 0 28px', color: 'var(--text-sub)', fontSize: '15px' }}>
          {isRegistering ? 'Create your account' : 'Welcome back'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: 'var(--text-sub)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</label>
            <input type="text" placeholder="Enter email" value={creds.username}
              onChange={e => setCreds({ ...creds, username: e.target.value })}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#28a745'}
              onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
              required minLength={3}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: 'var(--text-sub)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} placeholder="Enter password" value={creds.password}
                onChange={e => setCreds({ ...creds, password: e.target.value })}
                style={{ ...inputStyle, paddingRight: '44px' }}
                onFocus={e => e.target.style.borderColor = '#28a745'}
                onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                required minLength={8}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sub)', padding: 4, display: 'flex' }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={isLoading} style={{ padding: '14px', marginTop: '4px', backgroundColor: isRegistering ? '#007bff' : '#28a745', color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: isLoading ? 0.7 : 1, transition: 'opacity 0.2s' }}>
            {isLoading ? 'Please wait…' : isRegistering ? 'Create Account' : 'Log In'}
          </button>
        </form>

        {error && <div style={{ marginTop: 16, padding: '10px 14px', background: '#fee2e2', borderRadius: 10, color: '#dc2626', fontSize: 14, fontWeight: 500 }}>⚠️ {error}</div>}
        {successMsg && <div style={{ marginTop: 16, padding: '10px 14px', background: '#e6f4ea', borderRadius: 10, color: '#28a745', fontSize: 14, fontWeight: 500 }}>✅ {successMsg}</div>}

        <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />
        <p style={{ color: 'var(--text-sub)', fontSize: 14, margin: '0 0 8px' }}>
          {isRegistering ? 'Already have an account?' : "Don't have an account?"}
        </p>
        <button onClick={() => { setIsRegistering(!isRegistering); setError(''); setSuccessMsg(''); }} style={{ background: 'none', border: 'none', color: '#007bff', fontWeight: 700, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>
          {isRegistering ? 'Log in here' : 'Create one now'}
        </button>
      </div>
    </div>
  );
}
