import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false); // Toggle state
  const [creds, setCreds] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // DECIDE: Are we Logging in or Signing up?
    const endpoint = isRegistering ? '/.netlify/functions/signup' : '/.netlify/functions/login';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(creds)
      });

      const data = await res.json();

      if (res.ok) {
        if (isRegistering) {
          // Registration Success
          setSuccessMsg("Account created! Please log in.");
          setIsRegistering(false); // Switch back to login mode
          setCreds({ username: '', password: '' }); // Clear form
        } else {
          // Login Success
          onLogin(data);
        }
      } else {
        // Error (Wrong password or Username taken)
        setError(data.error || "Authentication failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
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
        borderRadius: '12px', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        width: '100%',
        maxWidth: '350px',
        textAlign: 'center'
      }}>
        <h1 style={{ marginBottom: '10px', fontSize: '28px' }}>🐐 Goat Master</h1>
        <h3 style={{ color: '#555', marginBottom: '25px', fontWeight: 'normal' }}>
          {isRegistering ? "Create Account" : "Welcome Back"}
        </h3>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="text" 
            placeholder="Username" 
            value={creds.username}
            onChange={(e) => setCreds({...creds, username: e.target.value})}
            style={{ padding: '14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px' }}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={creds.password}
            onChange={(e) => setCreds({...creds, password: e.target.value})}
            style={{ padding: '14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px' }}
            required
          />
          
          <button type="submit" style={{ 
            padding: '14px', 
            backgroundColor: isRegistering ? '#007bff' : '#28a745', // Blue for Sign Up, Green for Login
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginTop: '10px'
          }}>
            {isRegistering ? "Sign Up" : "Log In"}
          </button>
        </form>

        {/* Error / Success Messages */}
        {error && <p style={{ color: '#dc3545', marginTop: '15px', fontWeight: '500' }}>⚠️ {error}</p>}
        {successMsg && <p style={{ color: '#28a745', marginTop: '15px', fontWeight: '500' }}>✅ {successMsg}</p>}

        <hr style={{ margin: '25px 0', border: 'none', borderTop: '1px solid #eee' }} />

        {/* Toggle Button */}
        <p style={{ color: '#666', fontSize: '14px' }}>
          {isRegistering ? "Already have an account?" : "Don't have an account?"}
        </p>
        <button 
          onClick={() => { setIsRegistering(!isRegistering); setError(''); setSuccessMsg(''); }} 
          style={{ background: 'none', border: 'none', color: '#007bff', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
        >
          {isRegistering ? "Log In here" : "Create one now"}
        </button>

      </div>
    </div>
  );
};

export default Login;
