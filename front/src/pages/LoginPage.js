// pages/LoginPage.js
import React, {useEffect} from 'react';
import LoginForm from '../components/LoginForm';

function LoginPage({ onLoginSuccess }) {
    useEffect(() => {
        document.title = 'Chat Portfolio';
    }, []);
    return (
    <LoginForm onLoginSuccess={onLoginSuccess} />
);
}

export default LoginPage;
