<div align="center">
  
  <br>
  <h1>💻 CodeSync</h1>
  <p><strong>A Real-time Collaborative Code Editor with Live Execution</strong></p>

  <p>
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#getting-started">Getting Started</a>
  </p>
</div>

---

**CodeSync** is a highly responsive, modern, and aesthetic web-based IDE built for pair programming and remote collaboration. It combines the power of Microsoft's **Monaco Editor** with **Yjs** CRDT algorithms to deliver a seamless zero-conflict coding experience, alongside a live remote execution engine capable of compiling and running code in real-time.

---

## ✨ Features

- **⚡ Real-time Collaboration**: True multiplayer editing powered by Yjs and WebSockets with zero conflict or lag.
- **🏷️ Remote Cursor Presence**: See exactly where your teammates are typing with color-coded, labeled floating carets.
- **🏃‍♂️ Live Code Execution**: Write and instantly execute code in multiple languages (Python, JavaScript, C++, Java, etc.) right in the browser.
- **🖥️ Native Terminal Output**: Outputs standard streams (stdout/stderr) natively to an embedded `xterm.js` terminal, complete with ANSI color support.
- **💬 Built-in Room Chat**: Discuss algorithms and bugs with your team without leaving the IDE view.
- **🌗 Aesthetic UI**: Beautifully designed glassmorphic joining screens, distinct Light/Dark themes, and a responsive layout that works flawlessly on mobile devices.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS & Vanilla CSS (custom tokens)
- **Editor Engine**: `@monaco-editor/react`
- **Terminal Emulator**: `xterm.js`

### Backend
- **Server**: Node.js & Express
- **Real-time Engine**: `socket.io` & `y-socket.io`
- **Data Sync**: `yjs` (Conflict-free Replicated Data Types)
- **Code Execution**: Wandbox Compilation API Proxy

---

## 🚀 Getting Started

You can run CodeSync locally either via NPM or instantly via Docker.

### Option 1: Development Mode (NPM)

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/codesync.git
   cd codesync
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd Frontend
   npm install
   ```

3. **Install Backend Dependencies**
   ```bash
   cd ../Backend
   npm install
   ```

4. **Start the Application**
   ```bash
   # From the Backend directory, start both client and server concurrently:
   npm run dev
   ```
   > The app will automatically open in your default browser at `http://localhost:5173`.

### Option 2: Production Build (Docker)

CodeSync is fully containerized using a multi-stage Docker build, serving the Vite frontend directly from the Express backend port.

1. **Build and Run via Docker Compose**
   ```bash
   docker-compose up --build -d
   ```
2. Open your browser directly to `http://localhost:8080`.

---

## 🤝 Contributing

Contributions, issues, and feature requests are always welcome! Feel free to check the [issues page](#) if you want to contribute.

## 📝 License

This project is licensed under the **ISC License**.
