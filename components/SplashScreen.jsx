'use client';

export default function SplashScreen() {
  return (
    <div className="splash-screen">
      <div className="splash-content">
        <div className="splash-logo-container">
          <img src="/splashscreen.png" alt="Goat Master" className="splash-logo" />
          <div className="splash-shimmer"></div>
        </div>
        <h1 className="splash-brand">Goat Master</h1>
        <div className="splash-loader">
          <div className="splash-loader-bar"></div>
        </div>
        <p className="splash-tagline">Intelligent Herd Management</p>
      </div>
    </div>
  );
}