import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSuccess = async (response) => {
        setLoading(true);
        setError('');
        try {
            const apiResponse = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/login`, {
                idToken: response.credential
            });

            const { token, user } = apiResponse.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            console.log('Login success:', user);
            // Redirect after brief delay
            setTimeout(() => {
                navigate('/');
            }, 500);
        } catch (err) {
            console.error('Login failed:', err.response?.data?.error || err.message);
            setError(err.response?.data?.error || 'Authentication failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleError = () => {
        setError('Google login failed. Please try again.');
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="logo-container">
                    <Bot size={48} className="login-logo-icon" />
                </div>

                <h1>Welcome Back</h1>
                <p className="subtitle">Sign in to your AI Assistant space</p>

                <div className="google-btn-wrapper">
                    {loading ? (
                        <div className="custom-google-login">
                            <div className="loader"></div>
                            Authenticating...
                        </div>
                    ) : (
                        <GoogleLogin
                            onSuccess={handleSuccess}
                            onError={() => {
                                console.error('Google Login Error Details');
                                handleError();
                            }}
                            theme="filled_blue"
                            shape="pill"
                            width="360"
                        />
                    )}
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="footer">
                    <p>© 2026 AI Assistant. Secured by Google SSO.</p>
                </div>
            </div>

            <style>{`
                .loader {
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-top: 2px solid #ffffff;
                    border-radius: 50%;
                    width: 16px;
                    height: 16px;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default LoginPage;
