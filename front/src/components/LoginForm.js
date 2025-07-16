import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Form.module.css';
import Spinner from './Spinner'; // спиннер вынесен в отдельный компонент

function LoginForm({ onLoginSuccess }) {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('https://for-deploy-3yby.onrender.com/api/login/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                onLoginSuccess(data.access);
                setTimeout(() => navigate('/'), 500); // Небольшая пауза после логина
            } else {
                setError('Ошибка: ' + (data.detail || JSON.stringify(data)));
            }
        } catch {
            setError('Ошибка соединения.');
        } finally {
            setLoading(false);
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

            <button
                type="submit"
                className={styles.button}
                disabled={loading}
            >
                {loading ? <Spinner size="small" /> : 'Войти'}
            </button>

            {error && <p className={styles.error}>{error}</p>}
        </form>
    );
}

export default LoginForm;
