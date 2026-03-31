import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

const SSOHandler = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
      const fetchProfile = async () => {
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
              window.history.replaceState({}, document.title, "/ai-assistant/chat");
              window.location.reload();
            }
          } else {
            console.error("SSO failed: response not ok");
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error("SSO failed:", error);
          localStorage.removeItem('token');
        }
      };
      fetchProfile();
    }
  }, [navigate]);

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
