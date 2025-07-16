import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Form.module.css';

function RegisterForm() {
    const navigate = useNavigate(); // ⬅️ вот он

    const [formData, setFormData] = useState({
        email: '',
        first_name: '',
        last_name: '',
        password: ''
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
            const response = await fetch('https://for-deploy-3yby.onrender.com/api/register/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (response.ok) {
                setMessage('Registration passed correctly!');
                setFormData({ email: '', first_name: '', last_name: '', password: '' });

                // ⬇️ переход на логин через 1 секунду
                setTimeout(() => {
                    navigate('/login');
                }, 1000);
            } else {
                setError(data?.detail || 'Ошибка регистрации');
            }
        } catch {
            setError('Не удалось соединиться с сервером.');
        }
    };

    return (
        <div className={styles.formContainer}>
            <h2>Sign Up</h2>
            <form onSubmit={handleSubmit}>
                <input className={styles.inputField} name="first_name" placeholder="Name" value={formData.first_name} onChange={handleChange} required />
                <input className={styles.inputField} name="last_name" placeholder="Second Name" value={formData.last_name} onChange={handleChange} required />
                <input className={styles.inputField} type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
                <input className={styles.inputField} type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
                <button className={styles.button} type="submit">Sign Up</button>
            </form>
            {message && <p className={styles.success}>{message}</p>}
            {error && <p className={styles.error}>{error}</p>}
        </div>
    );
}

export default RegisterForm;
