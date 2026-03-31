import React from 'react';

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
        // Redirect to NLG Hub login
        const hubUrl = import.meta.env.VITE_NLG_HUB_URL || 'http://localhost:5173/nlg-hub';
        window.location.href = `${hubUrl}/login`;
        return null;
    }

    return children;
};

export default ProtectedRoute;
