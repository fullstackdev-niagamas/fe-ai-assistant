import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, ShieldAlert, MessageSquare, Settings, X } from 'lucide-react';
import { useSidebar } from '../context/SidebarContext';

const AdminSidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isSidebarOpen, setIsSidebarOpen } = useSidebar();

    const menuItems = [
        { label: 'Global Search', path: '/admin', icon: Search },
        { label: 'Conversations', path: '/admin/conversations', icon: MessageSquare },
        { label: 'Model Control', path: '/admin/model-config', icon: Settings },
        { label: 'Kill Switch', path: '/admin/kill-switch', icon: ShieldAlert }
    ];

    const handleNavigate = (path) => {
        navigate(path);
        setIsSidebarOpen(false);
    };

    return (
        <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
            <div className="sidebar-mobile-header">
                <h2>Admin Panel</h2>
                <button onClick={() => setIsSidebarOpen(false)} className="close-sidebar-btn">
                    <X size={20} />
                </button>
            </div>
            
            <div className="sidebar-section">
                <span className="sidebar-section-label">DASHBOARD</span>
                <div className="sidebar-menu">
                    {menuItems.map((item) => (
                        <div 
                            key={item.path}
                            className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
                            onClick={() => handleNavigate(item.path)}
                        >
                            <item.icon size={18} />
                            <span>{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="sidebar-section-divider" />

            <div className="sidebar-section mobile-only">
                <span className="sidebar-section-label">APPLICATION</span>
                <div className="sidebar-menu">
                    <div 
                        className="sidebar-item global-link"
                        onClick={() => handleNavigate('/chat')}
                    >
                        <MessageSquare size={18} />
                        <span>Go to AI Assistant</span>
                    </div>
                </div>
            </div>

                <style>{`
                    .admin-sidebar {
                        width: 250px;
                        background: #fff;
                        border-right: 1px solid rgba(0, 0, 0, 0.05);
                        height: calc(100vh - 60px);
                        position: sticky;
                        top: 60px;
                        padding: 2rem 1rem;
                        display: flex;
                        flex-direction: column;
                        flex-shrink: 0;
                        z-index: 1001;
                    }

                    .sidebar-mobile-header {
                        display: none;
                        align-items: center;
                        justify-content: space-between;
                        padding-bottom: 1.5rem;
                        border-bottom: 1px solid #f1f5f9;
                        margin-bottom: 1.5rem;
                    }

                    .sidebar-mobile-header h2 {
                        font-size: 1.125rem;
                        font-weight: 700;
                        color: #1e293b;
                        margin: 0;
                    }

                    .close-sidebar-btn {
                        background: #f1f5f9;
                        border: none;
                        padding: 0.4rem;
                        border-radius: 8px;
                        color: #64748b;
                        cursor: pointer;
                    }

                    .sidebar-section {
                        margin-bottom: 2rem;
                    }

                    .sidebar-section-label {
                        display: block;
                        padding: 0 1.25rem;
                        font-size: 0.6875rem;
                        font-weight: 800;
                        color: #94a3b8;
                        letter-spacing: 0.05em;
                        margin-bottom: 0.75rem;
                    }

                    .sidebar-section.mobile-only {
                        display: none;
                    }

                    .sidebar-section-divider {
                        display: none;
                        height: 1px;
                        background: #f1f5f9;
                        margin: 0.5rem 1.25rem 1.5rem;
                    }

                    .sidebar-menu {
                        display: flex;
                        flex-direction: column;
                        gap: 0.25rem;
                    }

                    .sidebar-item {
                        display: flex;
                        align-items: center;
                        gap: 0.75rem;
                        padding: 0.75rem 1.25rem;
                        border-radius: 10px;
                        color: #64748b;
                        font-size: 0.8125rem;
                        font-weight: 700;
                        cursor: pointer;
                        transition: all 0.2s;
                    }

                    .sidebar-item:hover {
                        background: #f8fafc;
                        color: #1e293b;
                        transform: translateX(4px);
                    }

                    .sidebar-item.active {
                        background: #f5f3ff;
                        color: #6366f1;
                    }

                    .global-link {
                        color: #4f46e5;
                        background: #f5f3ff;
                    }

                    .global-link:hover {
                        background: #ede9fe;
                    }

                    @media (max-width: 768px) {
                        .sidebar-section.mobile-only {
                            display: block;
                        }

                        .sidebar-section-divider {
                            display: block;
                        }
                        .admin-sidebar {
                            position: fixed;
                            left: -100%;
                            top: 60px;
                            bottom: 0;
                            width: 280px;
                            transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                            box-shadow: 10px 0 30px rgba(0,0,0,0.1);
                        }
                        .admin-sidebar.open {
                            left: 0;
                        }
                        .sidebar-mobile-header {
                            display: flex;
                        }
                    }
                `}</style>
            </aside>
    );
};

export default AdminSidebar;
