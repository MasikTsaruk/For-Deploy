// src/pages/ChatPage.js
import React, { useEffect, useState } from 'react';
import styles from '../styles/ChatPage.module.css';

function ChatPage() {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [chatId, setChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    const token = localStorage.getItem('access');

    useEffect(() => {
        fetch('http://localhost:8000/api/users/', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => setUsers(data))
            .catch(err => console.error(err));
    }, []);

    const selectUser = async (user) => {
        setSelectedUser(user);
        // Получаем или создаем чат
        const res = await fetch('http://localhost:8000/api/chats/get_or_create_chat/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ user_id: user.id })
        });
        const data = await res.json();
        setChatId(data.id);

        // Загружаем сообщения
        const messagesRes = await fetch(`http://localhost:8000/api/messages/?chat_id=${data.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const messagesData = await messagesRes.json();
        setMessages(messagesData);
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage || !chatId) return;

        const res = await fetch('http://localhost:8000/api/messages/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                chat_id: chatId,
                content: newMessage
            })
        });

        if (res.ok) {
            const message = await res.json();
            setMessages(prev => [...prev, message]);
            setNewMessage('');
        }
    };

    return (
        <div className={styles.chatPage}>
            <div className={styles.sidebar}>
                <h3>Пользователи</h3>
                {users.map(user => (
                    <button
                        key={user.id}
                        className={styles.userButton}
                        onClick={() => selectUser(user)}
                    >
                        {user.email}
                    </button>
                ))}
            </div>

            <div className={styles.chatBox}>
                {selectedUser ? (
                    <>
                        <h3>Чат с {selectedUser.email}</h3>
                        <div className={styles.messages}>
                            {messages.map(msg => (
                                <div key={msg.id} className={styles.message}>
                                    <strong>{msg.sender_email}: </strong>{msg.content}
                                </div>
                            ))}
                        </div>
                        <form onSubmit={sendMessage} className={styles.form}>
                            <input
                                type="text"
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                className={styles.input}
                            />
                            <button type="submit" className={styles.sendButton}>Отправить</button>
                        </form>
                    </>
                ) : (
                    <p>Выберите пользователя для начала чата</p>
                )}
            </div>
        </div>
    );
}

export default ChatPage;
