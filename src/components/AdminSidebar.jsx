import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, ShieldAlert } from 'lucide-react';

const AdminSidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { label: 'Global Search', path: '/', icon: Search },
        { label: 'Kill Switch', path: '/admin/kill-switch', icon: ShieldAlert }
    ];

    return (
        <aside className="admin-sidebar">
            <div className="sidebar-menu">
                {menuItems.map((item) => (
                    <div 
                        key={item.path}
                        className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
                        onClick={() => navigate(item.path)}
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </div>
                ))}
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
                }

                .sidebar-menu {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .sidebar-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.875rem 1.25rem;
                    border-radius: 12px;
                    color: #64748b;
                    font-size: 0.875rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .sidebar-item:hover {
                    background: #f1f5f9;
                    color: #1e293b;
                }

                .sidebar-item.active {
                    background: rgba(99, 102, 241, 0.08);
                    color: #6366f1;
                }
            `}</style>
        </aside>
    );
};

export default AdminSidebar;
