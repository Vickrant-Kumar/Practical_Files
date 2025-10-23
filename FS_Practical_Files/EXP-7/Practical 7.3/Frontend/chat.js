import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

function Chat() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.on("receiveMessage", (data) => {
      setMessages((prev) => [...prev, data]);
    });
    return () => socket.off("receiveMessage");
  }, []);

  const sendMessage = () => {
    if (name && message) {
      const time = new Date().toLocaleTimeString();
      const msgData = { name, message, time };
      socket.emit("sendMessage", msgData);
      setMessage("");
    }
  };

  return (
    <div className="chat-box">
      <h2>Real-Time Chat</h2>
      <input
        type="text"
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <div className="chat-window">
        {messages.map((msg, index) => (
          <p key={index}>
            <strong>{msg.name}</strong> [{msg.time}]: {msg.message}
          </p>
        ))}
      </div>
      <div className="input-section">
        <input
          type="text"
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default Chat;
