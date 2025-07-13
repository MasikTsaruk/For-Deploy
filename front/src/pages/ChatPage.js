import React, { useEffect, useState, useRef } from "react";
import styles from "../styles/ChatPage.module.css";
import { useNavigate } from "react-router-dom";


function ChatPage({ accessToken, currentUserId }) {
    const navigate = useNavigate();

    useEffect(() => {
        if (!accessToken) {
            navigate("/login");
        }
    }, [accessToken, navigate]);

    const [users, setUsers] = useState([]);
    const [activeChatId, setActiveChatId] = useState(null);
    const [activeUser, setActiveUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const ws = useRef(null);
    const [input, setInput] = useState("");

    useEffect(() => {
        async function fetchUsers() {
            const res = await fetch("http://localhost:8000/api/users/", {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            const data = await res.json();
            if (res.ok) {
                setUsers(data);
            } else {
                console.error("Ошибка API:", data);
                setUsers([]);
            }
        }
        fetchUsers();
    }, [accessToken]);

    useEffect(() => {
        if (!activeChatId) return;

        async function loadMessages() {
            const res = await fetch(
                `http://localhost:8000/chat/messages/?chat=${activeChatId}`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );
            const data = await res.json();
            setMessages(data);
        }
        loadMessages();

        const socketUrl = `ws://localhost:8000/ws/chat/${activeChatId}/?token=${accessToken}`;
        ws.current = new WebSocket(socketUrl);

        ws.current.onopen = () => {
            console.log("WebSocket connected");
        };

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "chat.message") {
                setMessages((msgs) => [...msgs, data.message]);
            }
        };

        ws.current.onclose = () => {
            console.log("WebSocket disconnected");
        };

        return () => {
            ws.current.close();
        };
    }, [activeChatId, accessToken]);

    async function handleUserClick(user) {
        setActiveUser(user);

        const res = await fetch("http://localhost:8000/chat/chats/get_or_create_chat/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ user_id: user.id }),
        });

        const chat = await res.json();
        setActiveChatId(chat.id);
    }

    async function sendMessage(text) {
        if (!text || !activeChatId) return;

        const data = { chat_id: activeChatId, content: text };
        const response = await fetch('http://localhost:8000/chat/messages/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            const newMessage = await response.json();
            setMessages(prev => [...prev, newMessage]);
        }
    }


    return (
        <div className={styles.chatPage}>
            {/* Список пользователей */}
            <div className={styles.sidebar}>
                <h3>Users</h3>
                <ul style={{ listStyle: "none", padding: 0 }}>
                    {users.map((user) => (
                        <li
                            key={user.id}
                            className={styles.userButton}
                            style={{
                                backgroundColor: activeUser?.id === user.id ? "#b2ebf2" : undefined,
                            }}
                            onClick={() => handleUserClick(user)}
                        >
                            {user.first_name || user.email}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Чат */}
            <div className={styles.chatBox}>
                <div style={{ fontWeight: "bold", marginBottom: "1rem" }}>
                    {activeUser ? `Чат с ${activeUser.first_name || activeUser.email}` : "Choose User"}
                </div>

                <div className={styles.messages}>
                    {messages.map((msg) => {
                        const isMine = msg.sender === currentUserId;
                        return (
                            <div
                                key={msg.id || Math.random()}
                                className={styles.message}
                                style={{ textAlign: isMine ? "right" : "left" }}
                            >
                                <div
                                    style={{
                                        display: "inline-block",
                                        padding: "8px 12px",
                                        borderRadius: 10,
                                        backgroundColor: isMine ? "#90caf9" : "#e0e0e0",
                                        color: isMine ? "#fff" : "#000",
                                    }}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className={styles.form}>
                    <input
                        type="text"
                        className={styles.input}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                sendMessage(input);
                                setInput('');
                            }
                        }}
                        placeholder="Введите сообщение"
                    />
                    <button
                        className={styles.sendButton}
                        onClick={() => {
                            sendMessage(input);
                            setInput('');
                        }}
                        disabled={!activeChatId}
                    >
                        Отправить
                    </button>
                </div>
            </div>
        </div>
    );

}

export default ChatPage;
