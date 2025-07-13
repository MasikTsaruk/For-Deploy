// src/App.js
import React, { useEffect, useState } from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    NavLink,
} from 'react-router-dom';

import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import styles from './styles/NavBar.module.css';

function getUserIdFromToken(token) {
    if (!token) return null;
    try {
        const payloadBase64 = token.split('.')[1];
        const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
        const payload = JSON.parse(payloadJson);
        return payload.user_id || null;
    } catch (e) {
        return null;
    }
}

function App() {
    const [accessToken, setAccessToken] = useState(() => localStorage.getItem('access'));
    const [userId, setUserId] = useState(() => getUserIdFromToken(localStorage.getItem('access')));

    const handleLoginSuccess = (token) => {
        localStorage.setItem('access', token);
        setAccessToken(token);
        setUserId(getUserIdFromToken(token));
    };

    return (
        <Router>
            <nav className={styles.navbar}>
                <NavLink to="/" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink}>
                    Home
                </NavLink>
                <NavLink to="/login" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink}>
                    Log In
                </NavLink>
                <NavLink to="/register" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink}>
                    Sign Up
                </NavLink>
            </nav>

            <Routes>
                <Route path="/" element={<ChatPage accessToken={accessToken} currentUserId={userId} />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
            </Routes>
        </Router>
    );
}

export default App;
