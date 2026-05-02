'use client';
import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Scanner Error Boundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-panel" style={{ padding: 40, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle size={32} color="#dc2626" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Scanner Component Crash</h3>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--text-sub)' }}>
              {this.state.error?.message || 'An unexpected error occurred in the AI processing engine.'}
            </p>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary" 
            style={{ marginTop: 8, padding: '10px 20px' }}
          >
            <RefreshCw size={16} /> Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
