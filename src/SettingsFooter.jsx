import React from 'react';

const SettingsFooter = () => {
  return (
    <footer style={{ 
      marginTop: '40px', 
      padding: '20px', 
      borderTop: '1px solid var(--border-color)', 
      textAlign: 'center', 
      color: 'var(--text-sub)',
      fontSize: '0.9em',
      backgroundColor: 'var(--bg-card)'
    }}>
      
      {/* App Version Info */}
      <div style={{ marginBottom: '10px' }}>
        <strong>Goat Master</strong> v1.0.0
      </div>

      {/* Support Links */}
      <div style={{ marginBottom: '15px' }}>
        <a href="mailto:samuel.hughes.23@outlook.com" style={{ color: 'var(--primary)', textDecoration: 'none', margin: '0 10px' }}>
          📧 Contact Support
        </a>
      </div>

      {/* Compliance Links */}
      <div>
        {/* Link directly to the file in the public folder */}
        <a 
          href="/privacy.md" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ color: 'var(--text-sub)', textDecoration: 'underline', margin: '0 5px' }}
        >
          Privacy Policy
        </a>
        
        <span style={{ margin: '0 5px' }}>&bull;</span>
        
        <a 
          href="#" 
          style={{ color: 'var(--text-sub)', textDecoration: 'underline', margin: '0 5px' }}
          onClick={(e) => { e.preventDefault(); alert("Terms of Service coming soon!"); }}
        >
          Terms of Service
        </a>
      </div>

      <div style={{ marginTop: '20px', fontSize: '0.8em', color: '#999' }}>
        &copy; {new Date().getFullYear()} Goat Master Inc.
      </div>
    </footer>
  );
};

export default SettingsFooter;
