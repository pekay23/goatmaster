import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [creds, setCreds] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    const endpoint = isRegistering
      ? '/api/auth/signup'
      : '/api/auth/login';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(creds),
      });
      const data = await res.json();

      if (res.ok) {
        if (isRegistering) {
          setSuccessMsg('Account created! Please log in.');
          setIsRegistering(false);
          setCreds({ username: '', password: '' });
        } else {
          onLogin(data);
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

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      backgroundColor: 'var(--bg-app)',
      backgroundImage: 'radial-gradient(at 0% 0%, hsla(140,60%,92%,1) 0px, transparent 50%), radial-gradient(at 100% 0%, hsla(190,60%,94%,1) 0px, transparent 50%), radial-gradient(at 100% 100%, hsla(140,60%,96%,1) 0px, transparent 50%)',
    }}>
      <div style={{
        padding: '36px 32px',
        backgroundColor: 'var(--bg-card)',
        borderRadius: '24px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
        border: '1px solid var(--border-color)',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center',
      }}>
        {/* Logo */}
        <div style={{ marginBottom: '8px' }}>
          <img src="/logo.png" alt="Goat Master" style={{ width: 56, height: 56, borderRadius: 14 }} />
        </div>

        <h1 style={{ margin: '0 0 6px', fontSize: '26px', fontWeight: 800, color: 'var(--text-main)' }}>
          Goat Master
        </h1>
        <p style={{ margin: '0 0 28px', color: 'var(--text-sub)', fontSize: '15px' }}>
          {isRegistering ? 'Create your account' : 'Welcome back'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: 'var(--text-sub)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Username
            </label>
            <input
              type="text"
              placeholder="Enter username"
              value={creds.username}
              onChange={(e) => setCreds({ ...creds, username: e.target.value })}
              style={{
                width: '100%', padding: '13px 14px', border: '1.5px solid var(--border-color)',
                borderRadius: '12px', fontSize: '16px', background: 'var(--bg-app)',
                color: 'var(--text-main)', fontFamily: 'inherit', boxSizing: 'border-box',
                outline: 'none', transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#28a745'}
              onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: 'var(--text-sub)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Password
            </label>
            <input
              type="password"
              placeholder="Enter password"
              value={creds.password}
              onChange={(e) => setCreds({ ...creds, password: e.target.value })}
              style={{
                width: '100%', padding: '13px 14px', border: '1.5px solid var(--border-color)',
                borderRadius: '12px', fontSize: '16px', background: 'var(--bg-app)',
                color: 'var(--text-main)', fontFamily: 'inherit', boxSizing: 'border-box',
                outline: 'none', transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#28a745'}
              onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: '14px', marginTop: '4px',
              backgroundColor: isRegistering ? '#007bff' : '#28a745',
              color: 'white', border: 'none', borderRadius: '14px',
              fontSize: '16px', fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', opacity: isLoading ? 0.7 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {isLoading ? 'Please wait…' : isRegistering ? 'Create Account' : 'Log In'}
          </button>
        </form>

        {error && (
          <div style={{ marginTop: 16, padding: '10px 14px', background: '#fee2e2', borderRadius: 10, color: '#dc2626', fontSize: 14, fontWeight: 500 }}>
            ⚠️ {error}
          </div>
        )}

        {successMsg && (
          <div style={{ marginTop: 16, padding: '10px 14px', background: '#e6f4ea', borderRadius: 10, color: '#28a745', fontSize: 14, fontWeight: 500 }}>
            ✅ {successMsg}
          </div>
        )}

        <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />

        <p style={{ color: 'var(--text-sub)', fontSize: 14, margin: '0 0 8px' }}>
          {isRegistering ? 'Already have an account?' : "Don't have an account?"}
        </p>
        <button
          onClick={() => { setIsRegistering(!isRegistering); setError(''); setSuccessMsg(''); }}
          style={{ background: 'none', border: 'none', color: '#007bff', fontWeight: 700, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}
        >
          {isRegistering ? 'Log in here' : 'Create one now'}
        </button>
      </div>
    </div>
  );
};

export default Login;
