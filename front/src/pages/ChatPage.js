import React, { useEffect, useState, useRef } from "react";
import styles from "../styles/ChatPage.module.css";
import { useNavigate } from "react-router-dom";

function ChatPage({ accessToken, currentUserId }) {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [activeChatId, setActiveChatId] = useState(null);
    const [activeUser, setActiveUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [isSidebarVisible, setSidebarVisible] = useState(window.innerWidth > 768);
    const [usersLoading, setUsersLoading] = useState(true);

    const ws = useRef(null);
    const messagesEndRef = useRef(null);
    const clientIdsRef = useRef(new Set());

    useEffect(() => {
        if (!accessToken) {
            navigate("/login");
        }
    }, [accessToken, navigate]);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            setSidebarVisible(!mobile);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        async function fetchUsers() {
            setUsersLoading(true);
            const res = await fetch("https://for-deploy-3yby.onrender.com/api/users/", {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            const data = await res.json();
            if (res.ok) setUsers(data);
            else console.error("Ошибка API:", data);
            setUsersLoading(false);
        }
        fetchUsers();
    }, [accessToken]);


    useEffect(() => {
        if (!activeChatId) return;
        setIsLoading(true);
        clientIdsRef.current = new Set(); // сбрасываем client_id для нового чата

        async function loadMessages() {
            const res = await fetch(`https://for-deploy-3yby.onrender.com/chat/messages/?chat=${activeChatId}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            const data = await res.json();
            if (res.ok) {
                setMessages(data);
                data.forEach((msg) => {
                    if (msg.client_id) clientIdsRef.current.add(msg.client_id);
                });
            }
            setIsLoading(false);
        }
        loadMessages();

        const socketUrl = `ws://for-deploy-3yby.onrender.com/ws/chat/${activeChatId}/?token=${accessToken}`;
        ws.current = new WebSocket(socketUrl);

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.client_id && clientIdsRef.current.has(data.client_id)) return;

            clientIdsRef.current.add(data.client_id);
            setMessages((prev) => [...prev, {
                content: data.message,
                sender: data.sender_id,
                timestamp: data.timestamp,
                client_id: data.client_id,
            }]);
        };

        ws.current.onclose = () => console.log("WebSocket disconnected");

        return () => ws.current.close();
    }, [activeChatId, accessToken]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    useEffect(() => {
        // Если на мобиле и сайдбар виден, то форсируем его перерисовку
        if (isMobile && isSidebarVisible && users.length > 0) {
            // Триггерим ререндер
            setUsers([...users]);
        }
    }, [isSidebarVisible, isMobile, users.length]);


    async function handleUserClick(user) {
        setActiveUser(user);
        const res = await fetch("https://for-deploy-3yby.onrender.com/chat/chats/get_or_create_chat/", {
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

        const timestamp = new Date().toISOString();
        const client_id = crypto.randomUUID();
        const localMessage = {
            content: text,
            sender: currentUserId,
            timestamp,
            client_id,
        };

        clientIdsRef.current.add(client_id);
        setMessages((prev) => [...prev, localMessage]);

        ws.current.send(JSON.stringify({
            message: text,
            client_id,
        }));
    }

    useEffect(() => {
        document.title = 'Chat Portfolio';
    }, []);

    return (
        <div className={styles.chatPage}>
            {isMobile && (
                <button className={styles.toggleSidebarButton}
                        onClick={() => setSidebarVisible(!isSidebarVisible)}>
                    {isSidebarVisible ? "Закрыть чаты" : "Открыть чаты"}
                </button>
            )}

            <div className={`${styles.sidebar} ${isMobile && !isSidebarVisible ? styles.hiddenSidebar : ""}`}>
                <h3>Чаты</h3>
                <ul style={{ listStyle: "none", padding: 0 }}>
                    {usersLoading ? (
                            <li style={{ padding: "1rem", textAlign: "center" }}>Загрузка пользователей...</li>
                        ) : users.length === 0 ? (
                            <li style={{ padding: "1rem", textAlign: "center" }}>Нет пользователей</li>
                        ) : (
                            users.map((user) => (
                                <li
                                    key={user.id}
                                    className={styles.userButton}
                                    style={{ backgroundColor: activeUser?.id === user.id ? "#b2ebf2" : undefined }}
                                    onClick={() => {
                                        handleUserClick(user);
                                        if (isMobile) setSidebarVisible(false); // только на мобилке
                                    }}
                                >
                                    {user.first_name || user.email}
                                </li>
                            ))
                        )}

                </ul>
            </div>

            <div className={styles.chatBox}>
                <div style={{ fontWeight: "bold", marginBottom: "1rem" }}>
                    {activeUser ? `Чат с ${activeUser.first_name || activeUser.email}` : "Выберите пользователя"}
                </div>

                <div className={styles.messages}>
                    {isLoading ? (
                        <div style={{ textAlign: "center", padding: "1rem" }}>Загрузка сообщений...</div>
                    ) : (
                        messages.map((msg, index) => {
                            const isMine = msg.sender === currentUserId;
                            return (
                                <div key={msg.client_id || msg.id || index}
                                     className={styles.message}
                                     style={{ textAlign: isMine ? "right" : "left" }}>
                                    <div style={{
                                        display: "inline-block",
                                        padding: "8px 12px",
                                        borderRadius: 10,
                                        backgroundColor: isMine ? "#90caf9" : "#e0e0e0",
                                        color: isMine ? "#fff" : "#000",
                                    }}>
                                        {msg.content}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
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
                                setInput("");
                            }
                        }}
                        placeholder="Введите сообщение"
                    />
                    <button
                        className={styles.sendButton}
                        onClick={() => {
                            sendMessage(input);
                            setInput("");
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
