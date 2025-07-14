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

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [isSidebarVisible, setSidebarVisible] = useState(window.innerWidth > 768); // по умолчанию true на ПК

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            setSidebarVisible(!mobile); // Показывать сайдбар на ПК, скрывать на моб.
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);



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
            setMessages((msgs) => [
                ...msgs,
                {
                    content: data.message,
                    sender: data.sender_id,
                    timestamp: data.timestamp,
                },
            ]);
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

    function sendMessage(text) {
        if (!text || !activeChatId || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;

        const message = {
            message: text,
        };

        // Добавляем сообщение себе

        ws.current.send(JSON.stringify(message));
    }




    return (
        <div className={styles.chatPage}>
            {isMobile && (
                <button
                    className={styles.toggleSidebarButton}
                    onClick={() => setSidebarVisible(!isSidebarVisible)}
                >
                    {isSidebarVisible ? "Закрыть чаты" : "Открыть чаты"}
                </button>
            )}

            {/* Список пользователей */}
            <div
                className={`${styles.sidebar} ${
                    isMobile && !isSidebarVisible ? styles.hiddenSidebar : ""
                }`}
            >
            <h3>Чаты</h3>
                <ul style={{ listStyle: "none", padding: 0 }}>
                    {users.map((user) => (
                        <li
                            key={user.id}
                            className={styles.userButton}
                            style={{
                                backgroundColor: activeUser?.id === user.id ? "#b2ebf2" : undefined,
                            }}
                            onClick={() => {
                                handleUserClick(user);
                                setSidebarVisible(false); // Закрыть на мобилке после выбора
                            }}
                        >
                            {user.first_name || user.email}
                        </li>
                    ))}
                </ul>
                <div style={{ marginTop: "1rem" }}>
                    <iframe
                        width="100%"
                        height="200"
                        src="https://www.youtube.com/embed/d0tmGkQNykY"
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>
            </div>

            {/* Чат */}
            <div className={styles.chatBox}>
                <div style={{ fontWeight: "bold", marginBottom: "1rem" }}>
                    {activeUser ? `Чат с ${activeUser.first_name || activeUser.email}` : "Выберите пользователя"}
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
