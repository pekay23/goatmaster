import React, { useState } from 'react';

const SettingsFooter = () => {
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <footer style={{ 
      marginTop: '40px', 
      padding: '20px', 
      borderTop: '1px solid #eee', 
      textAlign: 'center', 
      color: '#666',
      fontSize: '0.9em',
      backgroundColor: '#f9f9f9'
    }}>
      
      {/* App Version Info */}
      <div style={{ marginBottom: '10px' }}>
        <strong>Goat Master App</strong> v1.0.0
      </div>

      {/* Support Links */}
      <div style={{ marginBottom: '15px' }}>
        <a href="mailto:support@goatmaster.com" style={{ color: '#007bff', textDecoration: 'none', margin: '0 10px' }}>
          📧 Contact Support
        </a>
        <span>|</span>
        <a href="#" style={{ color: '#007bff', textDecoration: 'none', margin: '0 10px' }}>
          ❓ Help Center
        </a>
      </div>

      {/* Compliance Links */}
      <div>
        <button 
          onClick={() => setShowPrivacy(!showPrivacy)} 
          style={{ background: 'none', border: 'none', color: '#555', textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit' }}
        >
          Privacy Policy
        </button>
        <span style={{ margin: '0 5px' }}>&bull;</span>
        <button 
          style={{ background: 'none', border: 'none', color: '#555', textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit' }}
        >
          Terms of Service
        </button>
      </div>

      {/* Toggleable Privacy Policy Text (Simple Modal-like view) */}
      {showPrivacy && (
        <div style={{ 
          marginTop: '15px', 
          padding: '15px', 
          backgroundColor: 'white', 
          border: '1px solid #ddd', 
          textAlign: 'left' 
        }}>
          <strong>Privacy Policy:</strong>
          <p>We respect your farm data. Your herd information is stored securely in our Neon database and is not shared with third parties.</p>
          <button onClick={() => setShowPrivacy(false)} style={{ color: 'red', cursor: 'pointer' }}>Close</button>
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '0.8em', color: '#999' }}>
        &copy; {new Date().getFullYear()} Goat Master Inc.
      </div>
    </footer>
  );
};

export default SettingsFooter;
