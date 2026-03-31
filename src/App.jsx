import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ChatPage from './pages/ChatPage'
import DashboardPage from './pages/DashboardPage'
import KillSwitchPage from './pages/KillSwitchPage'
import AdminConvoPage from './pages/AdminConvoPage'
import ModelControlPage from './pages/ModelControlPage'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'

const RootRoute = () => {
  return <Navigate to="/chat" />;
};

const Layout = ({ children }) => {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <div className="container">
          {children}
        </div>
      </main>

      <style>{`
        :root {
          --bg-light: #f8fafc;
          --text-main: #1e293b;
          --text-muted: #64748b;
        }

        body {
          margin: 0;
          background-color: var(--bg-light);
          color: var(--text-main);
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        .app-layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: stretch;
          justify-content: flex-start;
        }

        .container {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .simple-welcome {
          text-align: center;
          animation: fadeIn 1s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .simple-welcome h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
          letter-spacing: -0.025em;
        }
      `}</style>
    </div>
  )
}

function App() {
  useEffect(() => {
    // Set default local admin user if it doesn't exist
    if (!localStorage.getItem('user')) {
      localStorage.setItem('user', JSON.stringify({
        id: 'local-admin',
        name: 'Local Admin',
        email: 'admin@workspace.local',
        role: 'super_admin'
      }));
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Layout>
                <RootRoute />
              </Layout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/chat" 
          element={
            <ProtectedRoute>
              <Layout>
                <ChatPage />
              </Layout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin/kill-switch" 
          element={
            <ProtectedRoute>
              <Layout>
                <KillSwitchPage />
               </Layout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin/conversations" 
          element={
            <ProtectedRoute>
              <Layout>
                <AdminConvoPage />
               </Layout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin/model-config" 
          element={
            <ProtectedRoute>
              <Layout>
                <ModelControlPage />
               </Layout>
            </ProtectedRoute>
          } 
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App
