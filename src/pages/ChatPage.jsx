import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Send, Plus, MessageCircle, MoreVertical, Trash2, Edit2, Bot, User, Loader2, X, Search, HelpCircle, ChevronRight, LayoutDashboard } from 'lucide-react';
import './ChatPage.css';

import { useSidebar } from '../context/SidebarContext';

const ChatPage = () => {
    const navigate = useNavigate();
    const { isSidebarOpen, setIsSidebarOpen } = useSidebar();
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
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [targetMessageId, setTargetMessageId] = useState(null);
    const [modelName, setModelName] = useState('');
    const [clarificationData, setClarificationData] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();
    
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
        fetchModelInfo();
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (targetMessageId) {
            const el = document.getElementById(`msg-${targetMessageId}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('highlight-message');
                setTimeout(() => el.classList.remove('highlight-message'), 2000);
                setTargetMessageId(null);
            }
        } else {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, targetMessageId]);

    // Auto-expand textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);

    // Handle initial URL params
    useEffect(() => {
        const convoId = searchParams.get('convoId');
        const msgId = searchParams.get('msgId');
        if (convoId) {
            // Wait for conversations to load first if needed
            if (conversations.length > 0) {
                const convo = conversations.find(c => c.id === convoId) || { id: convoId, title: 'Chat' };
                handleSelectConvo(convo, msgId);
                // Clear params
                setSearchParams({});
            }
        }
    }, [conversations.length]); // Dependencies change when convos load

    useEffect(() => {
        const delaySearch = setTimeout(() => {
            if (searchQuery.trim()) {
                handleSearch();
            } else {
                setSearchResults([]);
                setIsSearching(false);
            }
        }, 500);
        return () => clearTimeout(delaySearch);
    }, [searchQuery]);

    const handleSearch = async () => {
        try {
            setIsSearching(true);
            const response = await api.get(`/api/ai-assistant/search?q=${searchQuery}`);
            setSearchResults(response.data);
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setIsSearching(false);
        }
    };

    const showToast = (message, type = 'error') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
    };

    const fetchModelInfo = async () => {
        try {
            const response = await api.get('/api/ai-assistant/model-info');
            setModelName(response.data.model);
        } catch (err) {
            console.error('Error fetching model info:', err);
        }
    };

    const fetchConversations = async () => {
        try {
            setSidebarLoading(true);
            const response = await api.get('/api/ai-assistant/conversations');
            setConversations(response.data);
        } catch (err) {
            console.error('Error fetching conversations:', err);
        } finally {
            setSidebarLoading(false);
        }
    };

    const fetchMessages = async (convoId) => {
        try {
            const response = await api.get(`/api/ai-assistant/conversations/${convoId}/messages`);
            setMessages(response.data);
        } catch (err) {
            console.error('Error fetching messages:', err);
        }
    };

    const handleSelectConvo = (convo, msgId = null) => {
        setSelectedConvo(convo);
        setMessages([]);
        if (msgId) setTargetMessageId(msgId);
        fetchMessages(convo.id);
        setShowMenu(false);
        setIsSidebarOpen(false); // Close on mobile after selection
        setInput('');
        setTimeout(() => textareaRef.current?.focus(), 100);
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
            const response = await api.post('/api/ai-assistant/conversations', { title: 'New Chat' });
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
            const response = await api.post('/api/ai-assistant/chat', {
                prompt: userMsg,
                conversationId: selectedConvo.id
            });
            
            if (response.data.type === 'clarification') {
                setClarificationData({
                    questions: response.data.questions,
                    originalPrompt: userMsg,
                    answers: {}
                });
                return;
            }

            setClarificationData(null); // Clear on success
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

    const handleAnswerClarification = async (questionId, option) => {
        const updatedAnswers = { ...clarificationData.answers, [questionId]: option };
        setClarificationData(prev => ({ ...prev, answers: updatedAnswers }));
    };

    const submitClarification = async (answers) => {
        let finalPrompt = `Permintaan Awal: ${clarificationData.originalPrompt}\n\nKonteks Tambahan:`;
        clarificationData.questions.forEach(q => {
            finalPrompt += `\n- ${q.question}: ${answers[q.id] || 'Tidak diisi'}`;
        });

        // Set state for real-time update
        setClarificationData(null);
        setInput(finalPrompt);
        // We simulate a send message immediately
        const event = { preventDefault: () => {} };
        setTimeout(() => handleSendMessage(event), 10);
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
            await api.delete(`/api/ai-assistant/conversations/${modal.data.id}`);
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
            await api.put(`/api/ai-assistant/conversations/${modal.data.id}`, { title: editValue });
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
        return bold.split('\n').map((line, i) => (
            <span key={i} dangerouslySetInnerHTML={{ __html: line + (i < bold.split('\n').length - 1 ? '<br/>' : '') }} />
        ));
    };

    return (
        <div className="chat-container">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}

            {/* Sidebar */}
            <div className={`chat-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-header-top">
                        <h2>Chats</h2>
                        <div className="sidebar-header-actions">
                            <button onClick={handleCreateConvo} className="new-chat-btn-small">
                                <Plus size={18} />
                            </button>
                            <button 
                                className="close-sidebar-mobile" 
                                onClick={() => setIsSidebarOpen(false)}
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                    <div className="search-bar">
                        <Search size={16} className="search-icon" />
                        <input 
                            type="text" 
                            placeholder="Search messages..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && <X size={14} className="clear-search" onClick={() => setSearchQuery('')} />}
                    </div>
                </div>
                <div className="sidebar-list">
                    {user.role === 'superadmin' && (
                        <div className="global-nav-section mobile-only">
                            <div className="sidebar-nav-item" onClick={() => { navigate('/admin'); setIsSidebarOpen(false); }}>
                                <LayoutDashboard size={18} />
                                <span>Dashboard</span>
                            </div>
                            <div className="sidebar-divider" />
                        </div>
                    )}
                    {searchQuery.trim() ? (
                        <div className="search-results-list">
                            {isSearching ? (
                                <div className="sidebar-loader"><Loader2 className="spin" size={24} /></div>
                            ) : searchResults.length === 0 ? (
                                <div className="empty-search">No messages found</div>
                            ) : (
                                searchResults.map(res => (
                                    <div 
                                        key={res.message_id} 
                                        className="search-item"
                                        onClick={() => {
                                            const convo = conversations.find(c => c.id === res.conversation_id) || { id: res.conversation_id, title: res.conversation_title };
                                            handleSelectConvo(convo, res.message_id);
                                            // Don't clear searchQuery here to allow clicking other results
                                        }}
                                    >
                                        <div className="search-item-header">
                                            <span className="search-convo-title">{res.conversation_title}</span>
                                            <span className="search-date">{new Date(res.message_at).toLocaleDateString()}</span>
                                        </div>
                                        <p className="search-snippet">{res.content.substring(0, 60)}...</p>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        sidebarLoading ? (
                            <div className="sidebar-loader"><Loader2 className="spin" size={24} /></div>
                        ) : conversations.length === 0 ? (
                            <div className="empty-sidebar-wrapper">
                                <div className="empty-sidebar">
                                    <MessageCircle size={32} />
                                    <p>No conversations yet</p>
                                </div>
                            </div>
                        ) : (
                            <div className="convo-list-actual">
                                {conversations.map(convo => (
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
                                ))}
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* Main */}
            <div className="chat-main">
                {selectedConvo ? (
                    <>
                        <div className="chat-header">
                            <div className="header-left-group">
                                <button 
                                    className="menu-toggle-btn" 
                                    onClick={() => setIsSidebarOpen(true)}
                                >
                                    <MessageCircle size={20} />
                                </button>
                                <div className="header-info">
                                    <span className="title">{selectedConvo.title}</span>
                                </div>
                            </div>
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
                                <div key={msg.id || i} id={`msg-${msg.id}`} className={`message-wrapper ${msg.role}`}>
                                    <div className="message-avatar">
                                         {msg.role === 'model' ? (
                                             <Bot size={20} />
                                         ) : (
                                             user.picture && typeof user.picture === 'string' ? (
                                                 <img src={user.picture} alt="Me" referrerPolicy="no-referrer" />
                                             ) : user.picture && typeof user.picture === 'object' && user.picture.url ? (
                                                 <img src={user.picture.url} alt="Me" referrerPolicy="no-referrer" />
                                             ) : (
                                                 <User size={20} />
                                             )
                                         )}
                                     </div>
                                    <div className="message-bubble"><div className="message-content">{formatMarkdown(msg.content)}</div></div>
                                </div>
                            ))}
                            {loading && (
                                <div className="message-wrapper model">
                                    <div className="message-avatar"><Bot size={20} /></div>
                                    <div className="message-bubble typing"><div className="dot-flashing"></div></div>
                                </div>
                            )}
                            {clarificationData && (
                                <div className="message-wrapper model interviewer">
                                    <div className="message-avatar bot-interview">
                                        <Bot size={20} />
                                    </div>
                                    <div className="interviewer-card shadow-lg">
                                        <div className="interviewer-header">
                                            <HelpCircle size={18} className="text-indigo-500" />
                                            <div>
                                                <h3>Mode Interviewer</h3>
                                                <p>Bantu saya memahami permintaan Anda lebih baik untuk memberikan hasil terbaik.</p>
                                            </div>
                                        </div>
                                        <div className="interviewer-body">
                                            {clarificationData.questions.map((q) => (
                                                <div key={q.id} className="interview-question">
                                                    <p>{q.question}</p>
                                                    <div className="option-chips">
                                                        {q.options.map(opt => (
                                                            <button 
                                                                key={opt} 
                                                                className={`option-chip ${clarificationData.answers[q.id] === opt ? 'selected' : ''}`}
                                                                onClick={() => handleAnswerClarification(q.id, opt)}
                                                            >
                                                                {opt}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="interviewer-footer">
                                            <button className="skip-btn" onClick={() => setClarificationData(null)}>Lewati Interview</button>
                                            <button 
                                                className="submit-interview-btn" 
                                                disabled={Object.keys(clarificationData.answers).length === 0}
                                                onClick={() => submitClarification(clarificationData.answers)}
                                            >
                                                <span>Kirim dengan konteks</span>
                                                <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="chat-input-wrapper">
                            <form onSubmit={handleSendMessage} className="input-container shadow-lg">
                                <textarea ref={textareaRef} rows="1" placeholder="Ask anything..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} disabled={loading} />
                                <button type="submit" className="send-btn" disabled={!input.trim() || loading}><Send size={18} /></button>
                            </form>
                            <div className="chat-footer-meta">
                                {modelName && <span className="model-name">Powered by <strong>{modelName}</strong></span>}
                            </div>
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

        </div>
    );
};

export default ChatPage;
