import React, { useState} from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Form.module.css';

function LoginForm({ onLoginSuccess }) {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('https://for-deploy-3yby.onrender.com/api/login/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                // Обновляем состояние App через prop-функцию
                onLoginSuccess(data.access);

                navigate('/'); // Переход на главную
            } else {
                setError('Ошибка: ' + JSON.stringify(data));
            }
        } catch {
            setError('Ошибка соединения.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.formContainer}>
            <h2>Log In</h2>

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
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
            />

            <button type="submit" className={styles.button}>Log In</button>

            {error && <p className={styles.error}>{error}</p>}
        </form>
    );
}

export default LoginForm;
