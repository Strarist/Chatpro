# 🚀 ChatPro — AI Chat Application

<p align="center">
  <strong>A production-style AI chat application inspired by modern conversational interfaces.</strong>
</p>

<p align="center">
  Built with React, FastAPI, streaming UX patterns, and production-focused frontend architecture.
</p>

---

A production-style ChatGPT-inspired AI chat application built with React and FastAPI.

## Overview

ChatPro is a modern multi-chat AI application focused on:

* polished UI/UX
* streaming AI responses
* reliable async handling
* multi-chat management
* frontend architecture quality
* production-oriented interaction design

The project emphasizes real-world frontend engineering patterns rather than overly complex infrastructure.

---

# ✨ Features

## 🗂️ Multi-Chat System

* Multiple chat sessions
* Sidebar-based chat navigation
* Auto-generated chat titles
* Delete chat support
* Persistent active chat state

## ⚡ Streaming Responses

* Simulated streaming experience
* Stop generation support
* Regenerate AI response
* Request isolation handling
* Async race-condition protection

## 💾 Persistent State

* LocalStorage persistence
* Chat history retention
* Active chat restoration
* Lightweight memory system

## 📝 Rich Message Rendering

* Markdown rendering
* Syntax-highlighted code blocks
* Responsive message bubbles
* Copy/Edit actions
* Reaction controls

## 🎨 Modern UI/UX

* Dark premium interface
* Responsive centered layout
* Hover interactions
* Smooth transitions
* Product-style sidebar
* Auto-resizing input

---

# 🛠️ Tech Stack

## Frontend

| Technology               | Purpose                 |
| ------------------------ | ----------------------- |
| React                    | Frontend UI             |
| Vite                     | Build tooling           |
| Tailwind CSS             | Styling system          |
| React Markdown           | Markdown rendering      |
| React Syntax Highlighter | Code block highlighting |

* React
* Vite
* Tailwind CSS
* React Markdown
* React Syntax Highlighter

## Backend

| Technology     | Purpose              |
| -------------- | -------------------- |
| FastAPI        | API server           |
| Python         | Backend runtime      |
| OpenRouter API | AI model integration |

* FastAPI
* Python
* OpenRouter API

---

# 📁 Project Structure

```bash
chatbot-ui/
├── src/
│   ├── components/
│   │   ├── ChatWindow.jsx
│   │   ├── InputBox.jsx
│   │   ├── MessageBubble.jsx
│   │   └── Sidebar.jsx
│   ├── hooks/
│   │   └── useChat.js
│   ├── utils/
│   └── App.jsx
│
chatbot-backend/
├── main.py
└── requirements.txt
```

---

# ⚙️ Installation

## Clone Repository

```bash
git clone <your-repo-url>
cd Realtime-Chatbot
```

---

# 💻 Frontend Setup

```bash
cd chatbot-ui
npm install
npm run dev
```

Frontend runs on:

```bash
http://localhost:5173
```

---

# 🔧 Backend Setup

```bash
cd chatbot-backend
python -m venv .venv
```

Activate environment:

## Windows

```bash
.venv\Scripts\activate
```

## Install Dependencies

```bash
pip install -r requirements.txt
```

Run backend:

```bash
uvicorn main:app --reload
```

Backend runs on:

```bash
http://127.0.0.1:8000
```

---

# 🔐 Environment Variables

Create a `.env` file inside `chatbot-backend/`

```env
OPENROUTER_API_KEY=your_api_key_here
```

---

# 🧠 Engineering Focus Areas

This project focuses on:

* async UI handling
* frontend state management
* streaming UX
* React component architecture
* production-grade UI refinement
* scalable chat state handling
* request cancellation safety
* interaction polish

---

# 📌 Current Status

## Implemented

* Multi-chat support
* Streaming responses
* Regenerate response
* Stop generation
* Markdown rendering
* Syntax highlighting
* Persistent storage
* Memory extraction system
* Responsive modern UI

## In Progress

* Final responsive polish
* Layout refinement
* Advanced UX interactions

---

# 📸 Screenshots

<img width="100%" alt="ChatPro Preview" src="./screenshots/chatpro-preview.png" />

> Replace with actual screenshots after deployment/UI finalization.

---

# 🔮 Future Improvements

Planned improvements intentionally reserved for future projects:

* authentication
* realtime collaboration
* websocket streaming
* model switching
* voice input
* file uploads
* vector memory
* advanced tool calling

---

# 👨‍💻 Author

Aditya Gupta

B.Tech — Computer Science Engineering

Focused on:

* Full Stack Development
* Cloud Engineering
* AI Applications
* Frontend Systems

---

# 📄 License

This project is for educational and portfolio purposes.
