import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Loader2, MessageSquare, User, Calendar, ExternalLink, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './DashboardPage.css';

const DashboardPage = () => {
    const [query, setQuery] = useState('');
    const [fields, setFields] = useState(['email', 'message', 'title']);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const navigate = useNavigate();

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const token = localStorage.getItem('token');
    
    const api = axios.create({
        baseURL: API_BASE_URL,
        headers: { Authorization: `Bearer ${token}` }
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim().length >= 2) handleSearch();
            else if (!query.trim()) setResults([]);
        }, 600);
        return () => clearTimeout(timer);
    }, [query, fields]);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/admin/search?q=${query}&fields=${fields.join(',')}`);
            setResults(res.data);
        } catch (err) {
            console.error('Admin Search Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleField = (field) => {
        setFields(prev => prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]);
    };

    const highlightMatch = (text, term) => {
        if (!term || !text) return text;
        const index = text.toLowerCase().indexOf(term.toLowerCase());
        if (index === -1) {
            return text.length > 100 ? text.substring(0, 100) + '...' : text;
        }

        const start = Math.max(0, index - 40);
        const end = Math.min(text.length, index + 60);
        let snippet = text.substring(start, end);
        if (start > 0) snippet = '...' + snippet;
        if (end < text.length) snippet = snippet + '...';

        const parts = snippet.split(new RegExp(`(${term})`, 'gi'));
        return (
            <span>
                {parts.map((part, i) => 
                    part.toLowerCase() === term.toLowerCase() 
                        ? <mark key={i} style={{ background: '#fef08a', color: '#854d0e', padding: '0 2px', borderRadius: '4px' }}>{part}</mark> 
                        : part
                )}
            </span>
        );
    };

    return (
        <div className="dashboard-container">
            <header className="dash-header">
                <div>
                    <h1>Admin Dashboard</h1>
                    <p>Global search for all messages, conversations, and users</p>
                </div>
            </header>

            <div className="search-section shadow-sm">
                <div className="search-input-group">
                    <Search className="dash-search-icon" size={20} />
                    <input 
                        type="text" 
                        placeholder="Type to search platform..." 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                    <div className="search-actions">
                        {loading && <Loader2 className="spin text-indigo-500" size={18} />}
                        <button 
                            className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter size={16} />
                            <span>Filters</span>
                        </button>
                    </div>
                </div>
                
                {showFilters && (
                    <div className="filter-dropdown">
                        <span className="filter-label">SEARCH IN:</span>
                        <div className="filter-chips">
                            {['email', 'message', 'title'].map(f => (
                                <label key={f} className={`filter-chip ${fields.includes(f) ? 'active' : ''}`}>
                                    <input 
                                        type="checkbox" 
                                        checked={fields.includes(f)} 
                                        onChange={() => toggleField(f)} 
                                        hidden
                                    />
                                    <span>{f.toUpperCase()}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="results-container" style={{ minHeight: '600px' }}>
                {results.length > 0 ? (
                    <div className="results-grid">
                        {results.map((item) => (
                            <div key={item.message_id} className="result-card shadow-sm hover:shadow-md transition-all">
                                <div className="result-card-header">
                                    <div className="user-badge">
                                        <div className="avatar-small">
                                            {item.user_username?.[0]?.toUpperCase()}
                                        </div>
                                        <div>
                                            <span className="user-name">{item.user_username}</span>
                                            <span className="user-email">{item.user_email}</span>
                                        </div>
                                    </div>
                                    <span className={`role-tag ${item.user_role}`}>{item.user_role.replace('_', ' ')}</span>
                                </div>
                                <div className="result-card-body" style={{ minHeight: '120px' }}>
                                    <div className="convo-info">
                                        <MessageSquare size={14} />
                                        <span>{item.conversation_title}</span>
                                    </div>
                                    <p className="message-content">"{highlightMatch(item.content, query)}"</p>
                                </div>
                                <div className="result-card-footer">
                                    <div className="date-info">
                                        <Calendar size={14} />
                                        <span>{new Date(item.message_at).toLocaleString()}</span>
                                    </div>
                                    <button 
                                        className="jump-btn"
                                        onClick={() => navigate(`/chat?convoId=${item.conversation_id}&msgId=${item.message_id}`)}
                                    >
                                        <span>Jump to Chat</span>
                                        <ExternalLink size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : query && !loading ? (
                    <div className="no-results">
                        <h3>No matches found for "{query}"</h3>
                        <p>Try adjusting your search filters or check your spelling.</p>
                    </div>
                ) : !query && (
                    <div className="dash-placeholder">
                        <Filter size={64} style={{ opacity: 0.1, marginBottom: '2rem' }} />
                        <h3>Ready to Audit</h3>
                        <p>Search across the entire platform to monitor activity or find specific communications.</p>
                    </div>
                )}
            </div>

        </div>
    );
};

export default DashboardPage;
