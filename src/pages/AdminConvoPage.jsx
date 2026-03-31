import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MessageSquare, Bot, User, Loader2, Search, X, ShieldCheck } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import './AdminConvoPage.css';

const AdminConvoPage = () => {
    const [conversations, setConversations] = useState([]);
    const [selectedConvo, setSelectedConvo] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sidebarLoading, setSidebarLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    const messagesEndRef = useRef(null);
    
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const token = localStorage.getItem('token');

    const api = axios.create({
        baseURL: API_BASE_URL,
        headers: { Authorization: `Bearer ${token}` }
    });

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchConversations = async () => {
        try {
            setSidebarLoading(true);
            const response = await api.get('/api/ai-assistant/admin/conversations');
            setConversations(response.data);
        } catch (err) {
            console.error('Error fetching admin conversations:', err);
        } finally {
            setSidebarLoading(false);
        }
    };

    const fetchMessages = async (convoId) => {
        try {
            setLoading(true);
            const response = await api.get(`/api/ai-assistant/admin/conversations/${convoId}/messages`);
            setMessages(response.data);
        } catch (err) {
            console.error('Error fetching admin messages:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectConvo = (convo) => {
        setSelectedConvo(convo);
        fetchMessages(convo.id);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { 
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const formatMarkdown = (text) => {
        if (!text) return '';
        const bold = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return bold.split('\n').map((line, i) => (
            <span key={i} dangerouslySetInnerHTML={{ __html: line + (i < bold.split('\n').length - 1 ? '<br/>' : '') }} />
        ));
    };

    const filteredConvos = conversations.filter(c => 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.user_email && typeof c.user_email === 'string' && c.user_email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.user_name && typeof c.user_name === 'string' && c.user_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="admin-page-layout">
            <AdminSidebar />
            
            <div className="admin-convo-container">
                <div className="admin-convo-sidebar">
                    <div className="sidebar-header">
                        <h2>All Conversations</h2>
                        <div className="admin-search">
                            <Search size={16} />
                            <input 
                                type="text" 
                                placeholder="Search by title, user, or email..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <div className="admin-sidebar-list">
                        {sidebarLoading ? (
                            <div className="loader-center"><Loader2 className="spin" /></div>
                        ) : filteredConvos.length === 0 ? (
                            <div className="empty-state">No conversations found</div>
                        ) : (
                            filteredConvos.map(convo => (
                                <div 
                                    key={convo.id} 
                                    className={`admin-convo-item ${selectedConvo?.id === convo.id ? 'active' : ''}`}
                                    onClick={() => handleSelectConvo(convo)}
                                >
                                    <div className="convo-user-info">
                                        <div className="user-avatar-mini">
                                            {convo.user_picture && typeof convo.user_picture === 'string' ? (
                                                <img src={convo.user_picture} alt="" referrerPolicy="no-referrer" />
                                            ) : (typeof convo.user_name === 'string' ? convo.user_name[0] : 'U')}
                                        </div>
                                        <div className="user-text">
                                            <span className="user-name">{convo.user_name}</span>
                                            <span className="user-email">{convo.user_email}</span>
                                        </div>
                                    </div>
                                    <div className="convo-summary">
                                        <span className="convo-title">{convo.title}</span>
                                        <span className="convo-date">{formatDate(convo.created_at)}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="admin-convo-main">
                    {selectedConvo ? (
                        <>
                            <div className="admin-chat-header">
                                <div className="convo-meta">
                                    <h3>{selectedConvo.title}</h3>
                                    <div className="audit-badge">
                                        <ShieldCheck size={14} />
                                        <span>AUDIT MODE • READ ONLY</span>
                                    </div>
                                </div>
                                <div className="user-card-mini">
                                    <div className="user-avatar-mini">
                                        {selectedConvo.user_picture && typeof selectedConvo.user_picture === 'string' ? (
                                            <img src={selectedConvo.user_picture} alt="" referrerPolicy="no-referrer" />
                                        ) : (typeof selectedConvo.user_name === 'string' ? selectedConvo.user_name[0] : 'U')}
                                    </div>
                                    <div className="user-text">
                                        <span className="name">{typeof selectedConvo.user_name === 'string' ? selectedConvo.user_name : 'User'}</span>
                                        <span className="email">{typeof selectedConvo.user_email === 'string' ? selectedConvo.user_email : ''}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="admin-messages-list">
                                {messages.map((msg, i) => (
                                    <div key={msg.id || i} className={`admin-message-wrapper ${msg.role}`}>
                                        <div className="msg-avatar">
                                            {msg.role === 'model' ? (
                                                <Bot size={20} />
                                            ) : (selectedConvo.user_picture && typeof selectedConvo.user_picture === 'string' ? (
                                                <img src={selectedConvo.user_picture} alt="" referrerPolicy="no-referrer" />
                                            ) : <User size={20} />)}
                                        </div>
                                        <div className="msg-bubble">
                                            <div className="msg-content">{formatMarkdown(msg.content)}</div>
                                            <div className="msg-time">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="admin-chat-footer">
                                <div className="readonly-banner">
                                    <ShieldCheck size={16} />
                                    <span>Super Admin View Only. You cannot interact with this conversation.</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="admin-chat-placeholder">
                            <MessageSquare size={64} style={{ opacity: 0.1, marginBottom: '2rem' }} />
                            <h3>Select a Conversation to View</h3>
                            <p>Monitor platform interactions and ensure quality across all AI sessions.</p>
                        </div>
                    )}
                </div>
            </div>
            
        </div>
    );
};

export default AdminConvoPage;
