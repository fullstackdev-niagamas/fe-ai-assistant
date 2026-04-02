import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, Bot, LayoutDashboard, MessageSquare, Menu } from 'lucide-react';
import { useSidebar } from '../context/SidebarContext';

const Navbar = () => {
    const { toggleSidebar } = useSidebar();
    const navigate = useNavigate();
    const location = useLocation();
    const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        const hubUrl = import.meta.env.VITE_NLG_HUB_URL || 'http://localhost:5173/nlg-hub';
        window.location.href = `${hubUrl}/login`;
    };
    const user = (() => {
        try {
            return JSON.parse(localStorage.getItem('user') || '{}');
        } catch (e) {
            return {};
        }
    })();



    const formatRole = (role) => {
        const roles = {
            'staff': 'Staff',
            'manager': 'Manager',
            'superadmin': 'Super Admin'
        };
        return roles[role] || role;
    };

    const navItems = [
        { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
        { label: 'Chat', path: '/chat', icon: MessageSquare }
    ];

    // Filter nav items based on user role requirements
    const filteredNavItems = navItems.filter(item => {
        if (item.path === '/') {
            return user.role === 'superadmin';
        }
        return true;
    });

    return (
        <nav className="main-navbar">
            <div className="navbar-left">
                <button className="burger-menu-btn" onClick={toggleSidebar}>
                    <Menu size={24} />
                </button>
                <div className="navbar-logo" onClick={() => navigate(user.role === 'superadmin' ? '/admin' : '/chat')}>
                    <Bot className="logo-icon-simple" size={24} />
                    <span className="logo-text">AI Assistant</span>
                </div>
            </div>

            <div className="nav-links-centered">
                {filteredNavItems.map((item) => (
                    <div
                        key={item.path}
                        className={`nav-link ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
                        onClick={() => navigate(item.path)}
                    >
                        <item.icon size={18} />
                        <span>{item.label}</span>
                    </div>
                ))}
            </div>

            <div className="navbar-right">
                <div className="user-profile-wrapper">
                    <div className="user-profile-trigger" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                        <div className="user-info">
                            <span className="user-name">
                                {typeof (user.fullName || user.name || user.username) === 'string'
                                    ? (user.fullName || user.name || user.username)
                                    : 'User'}
                            </span>
                            <span className="user-role">{formatRole(user.role) || 'Super Admin'}</span>
                        </div>
                        <div className="user-avatar">
                            {user.picture && typeof user.picture === 'string' ? (
                                <img
                                    src={user.picture}
                                    alt={typeof (user.fullName || user.name) === 'string' ? (user.fullName || user.name) : 'User'}
                                    referrerPolicy="no-referrer"
                                />
                            ) : user.picture && typeof user.picture === 'object' && user.picture.url ? (
                                <img
                                    src={user.picture.url}
                                    alt={typeof (user.fullName || user.name) === 'string' ? (user.fullName || user.name) : 'User'}
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <div className="avatar-placeholder">
                                    <User size={18} />
                                </div>
                            )}
                        </div>
                    </div>

                    {isDropdownOpen && (
                        <div className="profile-dropdown shadow-xl">
                            <div className="dropdown-header">
                                <span className="user-name">
                                    {user.fullName || user.name || user.username}
                                </span>
                                <div className="email">{user.email}</div>
                            </div>
                            <div className="dropdown-divider" />
                            <button className="dropdown-item logout-btn" onClick={handleLogout}>
                                <LogOut size={16} color="#ef4444" />
                                <span style={{ color: '#ef4444', fontWeight: '600' }}>Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .main-navbar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 2rem;
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(12px);
                    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
                    position: sticky;
                    top: 0;
                    z-index: 1000;
                    height: 60px;
                }

                .navbar-left, .navbar-right {
                    flex: 0 0 240px;
                }

                .navbar-left {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .burger-menu-btn {
                    display: none;
                    background: none;
                    border: none;
                    color: #475569;
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 8px;
                    transition: background 0.1s;
                    align-items: center;
                    justify-content: center;
                }

                .burger-menu-btn:hover {
                    background: #f1f5f9;
                }

                .navbar-logo {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                }

                .logo-icon-simple { color: #6366f1; }
                .logo-text { font-weight: 700; font-size: 1.125rem; color: #1e293b; }

                .nav-links-centered {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 1.5rem;
                }

                .nav-link {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    border-radius: 10px;
                    color: #64748b;
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .nav-link:hover {
                    color: #1e293b;
                    background: #f1f5f9;
                }

                .nav-link.active {
                    color: #6366f1;
                    background: rgba(99, 102, 241, 0.08);
                }

                .navbar-right {
                    display: flex;
                    justify-content: flex-end;
                    align-items: center;
                }

                .user-profile-wrapper {
                    position: relative;
                }

                .user-profile-trigger {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    cursor: pointer;
                    padding: 0.25rem;
                    border-radius: 12px;
                    transition: all 0.1s;
                }

                .user-profile-trigger:hover {
                    background: rgba(0, 0, 0, 0.02);
                }

                .user-info {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    line-height: 1.3;
                }

                .user-name { font-size: 0.8125rem; font-weight: 600; color: #1e293b; }
                .user-role { font-size: 0.6875rem; font-weight: 500; color: #64748b; }

                .user-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    overflow: hidden;
                    border: 1px solid #e2e8f0;
                }

                .user-avatar img { width: 100%; height: 100%; object-fit: cover; }

                .avatar-placeholder {
                    width: 100%; height: 100%;
                    background: transparent;
                    display: flex; align-items: center; justify-content: center;
                    color: #94a3b8;
                }

                .profile-dropdown {
                    position: absolute;
                    top: calc(100% + 0.5rem);
                    right: 0;
                    background: #fff;
                    border-radius: 12px;
                    width: 200px;
                    padding: 0.4rem;
                    border: 1px solid rgba(0,0,0,0.06);
                    box-shadow: 0 12px 24px -6px rgba(0,0,0,0.08);
                    animation: slideDownUp 0.15s ease-out;
                }

                @keyframes slideDownUp {
                    from { transform: translateY(-8px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                .dropdown-header { padding: 0.6rem 0.8rem; }
                .dropdown-header .email { font-size: 0.6875rem; color: #94a3b8; word-break: break-all; }

                .dropdown-divider { height: 1px; background: #f1f5f9; margin: 0.4rem 0; }

                .dropdown-item {
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                    width: 100%;
                    padding: 0.6rem 0.8rem;
                    border: none;
                    background: none;
                    border-radius: 8px;
                    color: #475569;
                    cursor: pointer;
                    font-size: 0.8125rem;
                    transition: all 0.1s;
                    text-align: left;
                }

                .dropdown-item:hover { background: #f1f5f9; }

                @media (max-width: 768px) {
                    .main-navbar {
                        padding: 0 1rem;
                    }
                    .navbar-left {
                        flex: 1;
                        justify-content: flex-start;
                        gap: 0; /* Let burger handle its own padding */
                    }
                    .navbar-right {
                        flex: 1;
                        justify-content: flex-end;
                    }
                    .burger-menu-btn {
                        display: flex;
                    }
                    .navbar-logo {
                        position: absolute;
                        left: 50%;
                        transform: translateX(-50%);
                    }
                    .nav-links-centered {
                        display: none;
                    }
                    .user-info {
                        display: none;
                    }
                    .logo-text {
                        display: none;
                    }
                }
            `}</style>
        </nav>
    );
};

export default Navbar;
