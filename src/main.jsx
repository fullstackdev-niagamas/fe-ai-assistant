import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

const SSOHandler = ({ children }) => {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const tokenInUrl = urlParams.get('token');
  const [isVerifying, setIsVerifying] = React.useState(!!tokenInUrl);

  useEffect(() => {
    const token = urlParams.get('token');

    if (token) {
      const fetchProfile = async () => {
        setIsVerifying(true);
        try {
          localStorage.setItem('token', token);
          const nlgHubApiUrl = import.meta.env.VITE_NLG_HUB_API_URL || 'http://localhost:5000';
          const response = await fetch(`${nlgHubApiUrl}/api/hub/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data && data.user) {
              localStorage.setItem('user', JSON.stringify(data.user));
              
              // Sync user with our backend
              const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
              try {
                await fetch(`${apiBaseUrl}/api/ai-assistant/auth/sync-hub-user`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ user: data.user })
                });
              } catch (syncError) {
                console.error("Failed to sync user with backend:", syncError);
                // We still proceed even if sync fails locally, 
                // but usually this means the DB won't have the user yet.
              }

              // Clear token from URL and reload fully to ensure state is clean
              window.history.replaceState({}, document.title, window.location.pathname);
              window.location.reload();
              return; // Avoid setting isVerifying to false as we're reloading
            }
          } else {
            console.error("SSO failed: response not ok");
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error("SSO failed:", error);
          localStorage.removeItem('token');
        }
        setIsVerifying(false);
      };
      fetchProfile();
    }
  }, [navigate]);

  if (isVerifying) {
    return (
      <div style={{ 
        display: 'flex', 
        height: '100vh', 
        width: '100vw', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '20px',
        background: '#f8fafc',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div className="sso-loader"></div>
        <p style={{ color: '#64748b', fontWeight: '500' }}>Menghubungkan dengan Hub...</p>
        <style>{`
          .sso-loader {
            width: 40px;
            height: 40px;
            border: 3px solid #e2e8f0;
            border-top: 3px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return children;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/ai-assistant">
      <SSOHandler>
        <App />
      </SSOHandler>
    </BrowserRouter>
  </React.StrictMode>,
)
