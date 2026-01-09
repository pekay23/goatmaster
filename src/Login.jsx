import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [creds, setCreds] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const res = await fetch('/.netlify/functions/login', {
      method: 'POST',
      body: JSON.stringify(creds)
    });

    if (res.ok) {
      const user = await res.json();
      onLogin(user); // Tell App.jsx we are in!
    } else {
      setError('❌ Invalid Username or Password');
    }
  };

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: '#f0f2f5',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ 
        padding: '30px', 
        backgroundColor: 'white', 
        borderRadius: '8px', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '350px',
        textAlign: 'center'
      }}>
        <h1 style={{ marginBottom: '20px' }}>🐐 Goat Master</h1>
        <h3 style={{ color: '#555', marginBottom: '20px' }}>Farm Login</h3>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="text" 
            placeholder="Username" 
            value={creds.username}
            onChange={(e) => setCreds({...creds, username: e.target.value})}
            style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={creds.password}
            onChange={(e) => setCreds({...creds, password: e.target.value})}
            style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          
          <button type="submit" style={{ 
            padding: '12px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            fontSize: '16px',
            cursor: 'pointer' 
          }}>
            Login
          </button>
        </form>

        {error && <p style={{ color: 'red', marginTop: '15px' }}>{error}</p>}
      </div>
    </div>
  );
};

export default Login;
