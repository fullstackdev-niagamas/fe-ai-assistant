import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Save, RotateCcw, Loader2, Thermometer, Target, Cpu, CheckCircle } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import './ModelControlPage.css';

const ModelControlPage = () => {
    const [config, setConfig] = useState({
        temperature: 0.7,
        top_p: 0.95,
        thinking_budget: 1024
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const token = localStorage.getItem('token');

    const api = axios.create({
        baseURL: API_BASE_URL,
        headers: { Authorization: `Bearer ${token}` }
    });

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/admin/model-config');
            setConfig(response.data);
        } catch (err) {
            setMessage({ text: 'Failed to load configuration', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const response = await api.post('/api/admin/model-config', config);
            setMessage({ text: response.data.message, type: 'success' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (err) {
            setMessage({ text: 'Failed to update configuration', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setConfig({
            temperature: 0.7,
            top_p: 0.95,
            thinking_budget: 1024
        });
    };

    if (loading) {
        return (
            <div className="admin-page-layout">
                <AdminSidebar />
                <div className="loader-container">
                    <Loader2 className="spin" size={40} />
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page-layout">
            <AdminSidebar />
            
            <div className="model-control-container">
                <div className="mc-header">
                    <h1>Global Model Control</h1>
                    <p>Fine-tune AI behavior across all user sessions. Changes apply instantly to new requests.</p>
                </div>

                <div className="mc-grid">
                    {/* Temperature */}
                    <div className="mc-card">
                        <div className="card-icon therm"><Thermometer size={24} /></div>
                        <div className="card-top">
                            <h3>Temperature</h3>
                            <span className="value-badge">{config.temperature.toFixed(2)}</span>
                        </div>
                        <p className="card-desc">Controls randomness. Higher values (e.g. 1.0) make entries more creative, while lower values (e.g. 0.2) make them more deterministic.</p>
                        <div className="slider-wrapper">
                            <input 
                                type="range" 
                                min="0" 
                                max="1" 
                                step="0.05" 
                                value={config.temperature}
                                onChange={(e) => setConfig({...config, temperature: parseFloat(e.target.value)})}
                            />
                            <div className="slider-labels">
                                <span>Deterministic</span>
                                <span>Creative</span>
                            </div>
                        </div>
                    </div>

                    {/* Top P */}
                    <div className="mc-card">
                        <div className="card-icon target"><Target size={24} /></div>
                        <div className="card-top">
                            <h3>Top P</h3>
                            <span className="value-badge">{config.top_p.toFixed(2)}</span>
                        </div>
                        <p className="card-desc">Nucleus sampling. The model considers results of tokens with top_p probability mass. Use 1.0 for standard behavior.</p>
                        <div className="slider-wrapper">
                            <input 
                                type="range" 
                                min="0" 
                                max="1" 
                                step="0.01" 
                                value={config.top_p}
                                onChange={(e) => setConfig({...config, top_p: parseFloat(e.target.value)})}
                            />
                            <div className="slider-labels">
                                <span>Precise</span>
                                <span>Diverse</span>
                            </div>
                        </div>
                    </div>

                    {/* Thinking Budget (Max Tokens) */}
                    <div className="mc-card full-width">
                        <div className="card-icon budget"><Cpu size={24} /></div>
                        <div className="card-top">
                            <h3>Max Output Tokens (Thinking Budget)</h3>
                            <span className="value-badge">{config.thinking_budget} tokens</span>
                        </div>
                        <p className="card-desc">Limit the length of AI responses to manage costs and prevent long, irrelevant outputs.</p>
                        <div className="slider-wrapper">
                            <input 
                                type="range" 
                                min="128" 
                                max="8192" 
                                step="128" 
                                value={config.thinking_budget}
                                onChange={(e) => setConfig({...config, thinking_budget: parseInt(e.target.value)})}
                            />
                            <div className="slider-labels">
                                <span>Short</span>
                                <span>Verbose (8k)</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mc-footer">
                    <button className="btn-reset" onClick={handleReset} disabled={saving}>
                        <RotateCcw size={18} />
                        <span>Reset Defaults</span>
                    </button>
                    <button className="btn-save shadow-lg" onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
                        <span>Apply Global settings</span>
                    </button>
                </div>

                {message.text && (
                    <div className={`mc-toast shadow-2xl ${message.type}`}>
                        {message.type === 'success' ? <CheckCircle size={20} /> : <RotateCcw size={20} />}
                        <span>{message.text}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ModelControlPage;
