// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';

function App() {
  return (
      <Router>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/register">Регистрация</Link>
          <Link to="/login">Вход</Link>
        </nav>
        <Routes>
            <Route path="/" element={<ChatPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </Router>
  );
}

export default App;
