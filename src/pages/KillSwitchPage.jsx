import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldAlert, ShieldCheck, AlertTriangle, Loader2, X } from 'lucide-react';

import AdminSidebar from '../components/AdminSidebar';
import './KillSwitchPage.css';

const KillSwitchPage = () => {
    const [isActive, setIsActive] = useState(false);
    const [updatedAt, setUpdatedAt] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [logs, setLogs] = useState([]);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const token = localStorage.getItem('token');

    const api = axios.create({
        baseURL: API_BASE_URL,
        headers: { Authorization: `Bearer ${token}` }
    });

    const fetchStatus = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/ai-assistant/admin/kill-switch');
            setIsActive(response.data.kill_switch);
            setUpdatedAt(response.data.updated_at);
        } catch (err) {
            setError('Failed to fetch status');
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async () => {
        try {
            const response = await api.get('/api/ai-assistant/admin/kill-switch/logs');
            setLogs(response.data);
        } catch (err) {
            console.error('Failed to fetch logs');
        }
    };

    useEffect(() => {
        fetchStatus();
        fetchLogs();
    }, []);

    const handleToggleClick = () => {
        setShowConfirmModal(true);
    };

    const confirmToggle = async () => {
        setShowConfirmModal(false);
        try {
            setToggling(true);
            setError('');
            const response = await api.post('/api/ai-assistant/admin/kill-switch', { active: !isActive });
            setIsActive(!isActive);
            setUpdatedAt(new Date().toISOString());
            setSuccess(response.data.message);
            fetchLogs();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Action failed');
        } finally {
            setToggling(false);
        }
    };

    if (loading) {
        return (
            <div className="kill-switch-loader">
                <Loader2 className="spin" size={40} />
            </div>
        );
    }

    return (
        <div className="admin-page-layout">
            <AdminSidebar />
            <div className="kill-switch-container">
            <div className="ks-header">
                <h1>Emergency Control</h1>
                <p>Instantly cut off all Gemini API connections to stop usage and prevent costs in case of anomalies.</p>
            </div>

            <div className={`ks-card ${isActive ? 'active-shutdown' : 'active-normal'}`}>
                <div className="ks-icon-wrapper">
                    {isActive ? (
                        <ShieldAlert size={80} className="ks-icon alert-pulse" />
                    ) : (
                        <ShieldCheck size={80} className="ks-icon" />
                    )}
                </div>

                <div className="ks-status-info">
                    <h2>Status: {isActive ? 'SYSTEMS SHUT DOWN' : 'SYSTEMS ACTIVE'}</h2>
                    <p className="status-desc">
                        {isActive 
                            ? 'All outgoing AI requests are blocked. No new messages can be processed.' 
                            : 'AI services are running normally. Usage monitoring is active.'}
                    </p>
                    {updatedAt && (
                        <div className="status-timestamp">
                            Last {isActive ? 'Shutdown' : 'Restore'}: {new Date(updatedAt).toLocaleString()}
                        </div>
                    )}
                </div>

                <div className="ks-action-wrapper">
                    <button 
                        className={`ks-big-btn ${isActive ? 'btn-enable' : 'btn-disable'}`}
                        onClick={handleToggleClick}
                        disabled={toggling}
                    >
                        {toggling ? <Loader2 className="spin" /> : (
                            isActive ? 'RE-ENABLE AI SERVICES' : 'ACTIVATE EMERGENCY KILL SWITCH'
                        )}
                    </button>
                    {isActive && <div className="ks-warning-overlay">SHUTDOWN ACTIVE</div>}
                </div>
            </div>

            {logs.length > 0 && (
                <div className="ks-logs-section shadow-sm">
                    <div className="logs-header">
                        <h3>Recent Activity Logs</h3>
                    </div>
                    <div className="logs-table-wrapper">
                        <table className="logs-table">
                            <thead>
                                <tr>
                                    <th>TIMESTAMP</th>
                                    <th>ADMIN</th>
                                    <th>ACTION</th>
                                    <th>SYSTEM STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log.id}>
                                        <td className="timestamp">{new Date(log.created_at).toLocaleString()}</td>
                                        <td>
                                            <div className="admin-log-user">
                                                <span className="log-user-name">{log.user_name}</span>
                                                <span className="log-user-email">{log.user_email}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`log-action-badge ${log.action === 'SHUTDOWN' ? 'shutdown' : 'enable'}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="log-status">
                                            {log.status ? 'DISABLED' : 'ENABLED'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showConfirmModal && (
                <div className="ks-modal-overlay">
                    <div className="ks-modal shadow-2xl">
                        <div className="ks-modal-header">
                            <AlertTriangle className={isActive ? 'text-green' : 'text-red'} size={24} />
                            <h3>{isActive ? 'Confirm Re-enable' : 'Confirm Shutdown'}</h3>
                            <button className="ks-close-btn" onClick={() => setShowConfirmModal(false)}><X size={20} /></button>
                        </div>
                        <div className="ks-modal-body">
                            <p>
                                {isActive 
                                    ? "Are you sure you want to RE-ENABLE AI services? Full API functionality and billing will resume immediately."
                                    : "This will INSTANTLY cut off all Gemini API connections. All users will be unable to use AI features until re-enabled."}
                            </p>
                        </div>
                        <div className="ks-modal-footer">
                            <button className="ks-btn-secondary" onClick={() => setShowConfirmModal(false)}>Cancel</button>
                            <button 
                                className={`ks-btn-primary ${isActive ? 'bg-green' : 'bg-red'}`} 
                                onClick={confirmToggle}
                            >
                                {isActive ? 'Re-enable Now' : 'Shut Down Now'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {error && <div className="ks-error shadow-lg">{error}</div>}
            {success && <div className="ks-success shadow-lg">{success}</div>}

        </div>
    </div>
    );
};

export default KillSwitchPage;
