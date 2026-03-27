import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Plus, MessageCircle, MoreVertical, Trash2, Edit2, Bot, User, Loader2, X } from 'lucide-react';

const ChatPage = () => {
    const [conversations, setConversations] = useState([]);
    const [selectedConvo, setSelectedConvo] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sidebarLoading, setSidebarLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', type: 'error' });
    const [showMenu, setShowMenu] = useState(false);
    const [modal, setModal] = useState({ show: false, type: '', data: null });
    const [editValue, setEditValue] = useState('');
    
    const messagesEndRef = useRef(null);
    const menuRef = useRef(null);
    const textareaRef = useRef(null);
    
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const api = axios.create({
        baseURL: API_BASE_URL,
        headers: { Authorization: `Bearer ${token}` }
    });

    useEffect(() => {
        fetchConversations();
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
        }
    }, [input]);

    const showToast = (message, type = 'error') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
    };

    const fetchConversations = async () => {
        try {
            setSidebarLoading(true);
            const response = await api.get('/api/conversations');
            setConversations(response.data);
        } catch (err) {
            console.error('Error fetching conversations:', err);
        } finally {
            setSidebarLoading(false);
        }
    };

    const fetchMessages = async (convoId) => {
        try {
            const response = await api.get(`/api/conversations/${convoId}/messages`);
            setMessages(response.data);
        } catch (err) {
            console.error('Error fetching messages:', err);
        }
    };

    const handleSelectConvo = (convo) => {
        setSelectedConvo(convo);
        setMessages([]);
        fetchMessages(convo.id);
        setShowMenu(false);
        setInput('');
    };

    const handleCreateConvo = async () => {
        // If already in an empty New Chat, just warn
        if (selectedConvo?.title === 'New Chat' && messages.length === 0) {
            showToast('You already have an empty new chat!');
            return;
        }

        // If another empty New Chat exists in the list, select it
        const existingEmpty = conversations.find(c => c.title === 'New Chat');
        if (existingEmpty) {
            handleSelectConvo(existingEmpty);
            showToast('Using existing empty chat');
            return;
        }

        try {
            const response = await api.post('/api/conversations', { title: 'New Chat' });
            const existing = conversations.find(c => c.id === response.data.id);
            if (!existing) {
                setConversations(prev => [response.data, ...prev]);
            }
            handleSelectConvo(response.data);
            if (!existing) {
                showToast('New chat created!', 'success');
            }
        } catch (err) {
            showToast('Failed to create chat');
        }
    };

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!input.trim() || !selectedConvo || loading) return;

        const userMsg = input;
        setInput('');
        setLoading(true);
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);

        try {
            const response = await api.post('/api/chat', {
                prompt: userMsg,
                conversationId: selectedConvo.id
            });
            
            if (response.data.newTitle) {
                setConversations(prev => prev.map(c => 
                    c.id === selectedConvo.id ? { ...c, title: response.data.newTitle } : c
                ));
                setSelectedConvo(prev => ({ ...prev, title: response.data.newTitle }));
            }

            setMessages(prev => [...prev, { role: 'model', content: response.data.response }]);
        } catch (err) {
            showToast('Failed to send message');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const openDeleteModal = (id, title, e) => {
        if (e) e.stopPropagation();
        setModal({ show: true, type: 'delete', data: { id, title } });
        setShowMenu(false);
    };

    const openRenameModal = (id, title) => {
        setEditValue(title);
        setModal({ show: true, type: 'rename', data: { id, title } });
        setShowMenu(false);
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/api/conversations/${modal.data.id}`);
            setConversations(conversations.filter(c => c.id !== modal.data.id));
            if (selectedConvo?.id === modal.data.id) {
                setSelectedConvo(null);
                setMessages([]);
            }
            showToast('Conversation deleted', 'success');
        } catch (err) {
            showToast('Failed to delete');
        } finally {
            setModal({ show: false, type: '', data: null });
        }
    };

    const confirmRename = async () => {
        if (!editValue.trim()) return;
        try {
            await api.put(`/api/conversations/${modal.data.id}`, { title: editValue });
            setConversations(prev => prev.map(c => c.id === modal.data.id ? { ...c, title: editValue } : c));
            if (selectedConvo?.id === modal.data.id) {
                setSelectedConvo(prev => ({ ...prev, title: editValue }));
            }
            showToast('Renamed!', 'success');
        } catch (err) {
            showToast('Failed to rename');
        } finally {
            setModal({ show: false, type: '', data: null });
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    };

    const formatMarkdown = (text) => {
        if (!text) return '';
        const bold = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        const italic = bold.replace(/\*(.*?)\*/g, '<em>$1</em>');
        return italic.split('\n').map((line, i) => (
            <span key={i} dangerouslySetInnerHTML={{ __html: line + (i < italic.split('\n').length - 1 ? '<br/>' : '') }} />
        ));
    };

    return (
        <div className="chat-container">
            {/* Sidebar */}
            <div className="chat-sidebar">
                <div className="sidebar-header">
                    <h2>Chats</h2>
                    <button onClick={handleCreateConvo} className="new-chat-btn">
                        <Plus size={18} />
                        <span>New Chat</span>
                    </button>
                </div>
                <div className="sidebar-list">
                    {sidebarLoading ? (
                        <div className="sidebar-loader"><Loader2 className="spin" size={24} /></div>
                    ) : conversations.length === 0 ? (
                        <div className="empty-sidebar-wrapper">
                            <div className="empty-sidebar"><MessageCircle size={32} /><p>No conversations yet</p></div>
                        </div>
                    ) : (
                        conversations.map(convo => (
                            <div key={convo.id} className={`convo-item ${selectedConvo?.id === convo.id ? 'active' : ''}`} onClick={() => handleSelectConvo(convo)}>
                                <div className="convo-icon"><MessageCircle size={18} /></div>
                                <div className="convo-details">
                                    <span className="convo-title">{convo.title}</span>
                                    <span className="convo-date">{formatDate(convo.created_at)}</span>
                                </div>
                                <button onClick={(e) => openDeleteModal(convo.id, convo.title, e)} className="delete-btn">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main */}
            <div className="chat-main">
                {selectedConvo ? (
                    <>
                        <div className="chat-header">
                            <div className="header-info"><span className="title">{selectedConvo.title}</span><span className="status">Active Session</span></div>
                            <div className="header-menu-wrapper" ref={menuRef}>
                                <button className="icon-btn-no-border" onClick={() => setShowMenu(!showMenu)}><MoreVertical size={20} /></button>
                                {showMenu && (
                                    <div className="header-dropdown shadow-lg">
                                        <button onClick={() => openRenameModal(selectedConvo.id, selectedConvo.title)} className="dropdown-item"><Edit2 size={14} /><span>Rename Chat</span></button>
                                        <button onClick={() => openDeleteModal(selectedConvo.id, selectedConvo.title)} className="dropdown-item delete"><Trash2 size={14} /><span>Delete Chat</span></button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="messages-container">
                            {messages.map((msg, i) => (
                                <div key={i} className={`message-wrapper ${msg.role}`}>
                                    <div className="message-avatar">
                                        {msg.role === 'model' ? <Bot size={20} /> : (user.picture ? <img src={user.picture} alt="Me" /> : <User size={20} />)}
                                    </div>
                                    <div className="message-bubble shadow-sm"><div className="message-content">{formatMarkdown(msg.content)}</div></div>
                                </div>
                            ))}
                            {loading && (
                                <div className="message-wrapper model">
                                    <div className="message-avatar"><Bot size={20} /></div>
                                    <div className="message-bubble typing"><div className="dot-flashing"></div></div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="chat-input-wrapper">
                            <form onSubmit={handleSendMessage} className="input-container shadow-lg">
                                <textarea ref={textareaRef} rows="1" placeholder="Ask anything..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} disabled={loading} />
                                <button type="submit" className="send-btn" disabled={!input.trim() || loading}><Send size={18} /></button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="chat-placeholder">
                        <div className="placeholder-content">
                            <Bot size={64} className="placeholder-icon" />
                            <h1>AI Chat Assistant</h1>
                            <p>Select a conversation or start a new one to begin chatting with the AI.</p>
                            <button onClick={handleCreateConvo} className="start-btn">Create First Chat</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals & Toasts */}
            {modal.show && (
                <div className="modal-overlay">
                    <div className="modal-content shadow-2xl">
                        <div className="modal-header">
                            <h3>{modal.type === 'delete' ? 'Delete Conversation' : 'Rename Conversation'}</h3>
                            <button onClick={() => setModal({show: false, type: '', data: null})} className="close-btn"><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            {modal.type === 'delete' ? (
                                <p>Are you sure you want to delete <strong>{modal.data.title}</strong>? This action cannot be undone.</p>
                            ) : (
                                <div className="rename-input-wrapper">
                                    <label>Conversation Title</label>
                                    <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} autoFocus onKeyDown={(e) => e.key === 'Enter' && confirmRename()} />
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setModal({show: false, type: '', data: null})} className="modal-btn-secondary">Cancel</button>
                            {modal.type === 'delete' ? <button onClick={confirmDelete} className="modal-btn-danger">Delete</button> : <button onClick={confirmRename} className="modal-btn-primary">Save Changes</button>}
                        </div>
                    </div>
                </div>
            )}
            {toast.show && <div className={`toast-message toast-${toast.type} shadow-lg`}>{toast.message}</div>}

            <style>{`
                .chat-container { display: flex; height: calc(100vh - 61px); background: #fff; overflow: hidden; font-family: 'Outfit', sans-serif; }
                
                /* Sidebar */
                .chat-sidebar { width: 320px; border-right: 1px solid #f1f5f9; display: flex; flex-direction: column; background: #f8fafc; }
                .sidebar-header { padding: 1.5rem; border-bottom: 1px solid #f1f5f9; }
                .sidebar-header h2 { font-size: 1.25rem; font-weight: 700; color: #1e293b; margin-bottom: 1rem; }
                .new-chat-btn { width: 100%; padding: 0.75rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-weight: 600; color: #6366f1; cursor: pointer; transition: all 0.2s; }
                .new-chat-btn:hover { border-color: #6366f1; background: rgba(99, 102, 241, 0.05); }
                .sidebar-list { flex: 1; overflow-y: auto; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem; }
                .sidebar-loader { display: flex; justify-content: center; padding: 2rem; color: #6366f1; }
                .empty-sidebar-wrapper { flex: 1; display: flex; align-items: center; justify-content: center; }
                .empty-sidebar { display: flex; flex-direction: column; align-items: center; color: #94a3b8; gap: 0.75rem; }
                
                /* Convo Items */
                .convo-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.875rem; border-radius: 12px; cursor: pointer; transition: all 0.2s; border: 1px solid transparent; }
                .convo-item:hover { background: #f1f5f9; }
                .convo-item.active { background: #fff; border-color: #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
                .convo-icon { width: 36px; height: 36px; background: #fff; border: 1px solid #f1f5f9; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #94a3b8; }
                .convo-item.active .convo-icon { background: rgba(99, 102, 241, 0.08); color: #6366f1; }
                .convo-details { flex: 1; min-width: 0; }
                .convo-title { display: block; font-size: 0.875rem; font-weight: 600; color: #334155; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .convo-date { font-size: 0.75rem; color: #94a3b8; }
                .delete-btn { opacity: 0; background: none; border: none; padding: 0.4rem; border-radius: 6px; color: #94a3b8; cursor: pointer; transition: all 0.2s; }
                .convo-item:hover .delete-btn { opacity: 1; }
                .delete-btn:hover { background: #fee2e2; color: #ef4444; }

                /* Main Chat */
                .chat-main { flex: 1; display: flex; flex-direction: column; background: #fff; }
                .chat-header { height: 64px; padding: 0 1.5rem; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; }
                .header-info .title { font-size: 1rem; font-weight: 700; color: #1e293b; margin-right: 0.75rem; }
                .header-info .status { font-size: 0.75rem; color: #10b981; background: rgba(16, 185, 129, 0.1); padding: 0.2rem 0.6rem; border-radius: 20px; font-weight: 600; }
                .icon-btn-no-border { background: none; border: none; padding: 0.5rem; border-radius: 8px; color: #64748b; cursor: pointer; transition: all 0.2s; }
                .icon-btn-no-border:hover { background: #f1f5f9; color: #1e293b; }
                
                .messages-container { flex: 1; overflow-y: auto; padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; }
                .message-wrapper { display: flex; gap: 1rem; max-width: 85%; }
                .message-wrapper.user { align-self: flex-end; flex-direction: row-reverse; }
                /* Avatar Padding Fix & Prevent Stretch */
                .message-avatar { 
                    width: 40px; height: 40px; border-radius: 12px; overflow: hidden; 
                    display: flex; align-items: center; justify-content: center; 
                    flex-shrink: 0; align-self: flex-start; margin-top: 4px; padding: 2px;
                }
                .message-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 10px; flex-shrink: 0; }
                .model .message-avatar { background: #6366f1; color: #fff; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .message-bubble { padding: 1rem 1.25rem; border-radius: 16px; font-size: 0.9375rem; line-height: 1.5; }
                .model .message-bubble { background: #f8fafc; border: 1px solid #f1f5f9; border-bottom-left-radius: 4px; }
                .user .message-bubble { background: #6366f1; color: #fff; border-bottom-right-radius: 4px; }

                .chat-input-wrapper { padding: 1rem 2rem 2rem; }
                .input-container { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 0.5rem; display: flex; align-items: flex-end; gap: 0.5rem; transition: border 0.2s; }
                .input-container:focus-within { border-color: #6366f1; }
                .input-container textarea { flex: 1; padding: 0.75rem 0.5rem; border: none; background: transparent; outline: none; font-size: 0.9375rem; line-height: 1.5; resize: none; max-height: 200px; font-family: inherit; }
                .send-btn { 
                    width: 42px; height: 42px;
                    display: flex; align-items: center; justify-content: center;
                    background: #6366f1; color: #fff; border: none; border-radius: 12px; 
                    cursor: pointer; transition: all 0.2s; flex-shrink: 0;
                }
                .send-btn:disabled { background: #e2e8f0; cursor: not-allowed; }

                /* Placeholder */
                .chat-placeholder { flex: 1; display: flex; align-items: center; justify-content: center; background: #f8fafc; }
                .placeholder-content { display: flex; flex-direction: column; align-items: center; text-align: center; max-width: 440px; }
                .placeholder-icon { color: #6366f1; opacity: 0.15; margin-bottom: 2rem; }
                .chat-placeholder h1 { font-size: 2rem; font-weight: 800; color: #1e293b; margin-bottom: 1rem; }
                .chat-placeholder p { color: #64748b; margin-bottom: 2rem; }
                .start-btn { padding: 1rem 2rem; background: #6366f1; color: #fff; border: none; border-radius: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
                .start-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(99,102,241,0.3); }

                /* Modals & Menus */
                /* Modal Reset & Padding Fix */
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 2000; }
                .modal-content { background: #fff; border-radius: 24px; width: 100%; max-width: 460px; overflow: hidden; animation: modalPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
                @keyframes modalPop { from { transform: scale(0.9) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
                .modal-header { padding: 1.75rem 2rem; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; }
                .modal-header h3 { font-size: 1.25rem; font-weight: 700; color: #1e293b; margin: 0; }
                .modal-body { padding: 2rem; color: #475569; font-size: 1rem; line-height: 1.6; }
                .modal-footer { padding: 1.5rem 2rem; background: #f8fafc; display: flex; justify-content: flex-end; gap: 1rem; border-top: 1px solid #f1f5f9; }
                .modal-overlay .close-btn { 
                    background: transparent !important; border: none !important; 
                    color: #94a3b8 !important; cursor: pointer !important; padding: 0.5rem !important; 
                    border-radius: 8px !important; transition: all 0.2s !important; display: flex !important; align-items: center !important; justify-content: center !important;
                }
                .modal-overlay .close-btn:hover { background: #f1f5f9 !important; color: #1e293b !important; }
                .rename-input-wrapper label { display: block; font-size: 0.75rem; font-weight: 700; color: #94a3b8; margin-bottom: 0.5rem; text-transform: uppercase; }
                .rename-input-wrapper input { width: 100%; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 10px; outline: none; }
                .modal-overlay .modal-btn-secondary { 
                    padding: 0.75rem 1.5rem !important; border-radius: 12px !important; background: #fff !important; 
                    border: 1px solid #e2e8f0 !important; color: #475569 !important; font-weight: 700 !important; 
                    cursor: pointer !important; transition: all 0.2s !important; font-family: inherit !important; font-size: 0.875rem !important;
                    display: inline-flex !important; align-items: center !important; justify-content: center !important;
                }
                .modal-overlay .modal-btn-secondary:hover { background: #f8fafc !important; border-color: #cbd5e1 !important; }

                .modal-overlay .modal-btn-primary { 
                    padding: 0.75rem 1.5rem !important; border-radius: 12px !important; background: #6366f1 !important; 
                    border: none !important; color: #fff !important; font-weight: 700 !important; 
                    cursor: pointer !important; transition: all 0.2s !important; font-family: inherit !important; font-size: 0.875rem !important;
                    display: inline-flex !important; align-items: center !important; justify-content: center !important;
                }
                .modal-overlay .modal-btn-primary:hover { background: #4f46e5 !important; transform: translateY(-1px) !important; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25) !important; }

                .modal-overlay .modal-btn-danger { 
                    padding: 0.75rem 1.5rem !important; border-radius: 12px !important; background: #ef4444 !important; 
                    border: none !important; color: #fff !important; font-weight: 700 !important; 
                    cursor: pointer !important; transition: all 0.2s !important; font-family: inherit !important; font-size: 0.875rem !important;
                    display: inline-flex !important; align-items: center !important; justify-content: center !important;
                }
                .modal-overlay .modal-btn-danger:hover { background: #dc2626 !important; transform: translateY(-1px) !important; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25) !important; }
                .header-menu-wrapper { position: relative; }
                .header-dropdown { position: absolute; top: 100%; right: 0; background: #fff; border: 1px solid #f1f5f9; border-radius: 12px; width: 180px; padding: 0.4rem; z-index: 100; margin-top: 0.5rem; }
                .dropdown-item { display: flex; align-items: center; gap: 0.75rem; width: 100%; padding: 0.6rem 0.8rem; border: none; background: none; border-radius: 8px; color: #475569; cursor: pointer; font-size: 0.8125rem; font-family: inherit; text-align: left; }
                .dropdown-item:hover { background: #f1f5f9; }
                .dropdown-item.delete:hover { background: #fef2f2; color: #ef4444; }

                /* Toasts & Utils */
                .toast-message { position: fixed; bottom: 2rem; left: 2rem; padding: 0.75rem 1.25rem; border-radius: 12px; font-size: 0.875rem; font-weight: 600; color: #fff; z-index: 10000; animation: toastSlide 0.3s ease-out; }
                .toast-error { background: #ef4444; } .toast-success { background: #10b981; }
                @keyframes toastSlide { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                .dot-flashing { position: relative; width: 6px; height: 6px; border-radius: 5px; background-color: #6366f1; color: #6366f1; animation: dot-flashing 1s infinite linear alternate; animation-delay: 0.5s; }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default ChatPage;
