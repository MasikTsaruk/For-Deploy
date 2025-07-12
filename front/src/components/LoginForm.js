// src/components/LoginForm.js
import React, { useState } from 'react';
import styles from '../styles/Form.module.css';

function LoginForm() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [token, setToken] = useState('');

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Отправка формы...', formData);
        setError('');

        try {
            const response = await fetch('http://localhost:8000/api/login/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('access', data.access);
                localStorage.setItem('refresh', data.refresh);
                setToken(data.access);
            } else {
                setError('Ошибка: ' + JSON.stringify(data));
            }
        } catch {
            setError('Ошибка соединения.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.formContainer}>
            <h2>Вход</h2>

            <input
                className={styles.inputField}
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
            />

            <input
                className={styles.inputField}
                type="password"
                name="password"
                placeholder="Пароль"
                value={formData.password}
                onChange={handleChange}
                required
            />

            <button type="submit" className={styles.button}>Войти</button>

            {token && <p className={styles.success}>Вход выполнен</p>}
            {error && <p className={styles.error}>{error}</p>}
        </form>

    );
}

export default LoginForm;
