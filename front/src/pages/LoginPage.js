// pages/LoginPage.js
import React from 'react';
import LoginForm from '../components/LoginForm';

function LoginPage({ onLoginSuccess }) {
    return (
    <div>
    <title>Chat Portfolio</title>
    <LoginForm onLoginSuccess={onLoginSuccess} />
    </div>
);
}

export default LoginPage;
