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

## 📸 Screenshots

### Editor View
Experience real-time sync with teammates in a sleek dark-themed IDE, featuring integrated chat and standard input/output execution panels.

![Editor Screen](assets/editor_screen.png)

### Join Room Lobby
Seamlessly join rooms alongside a beautiful glassmorphic experience.

![Join Screen](assets/join_screen.png)

---

## ✨ Features

- **⚡ Real-time Collaboration**: True multiplayer editing powered by Yjs and WebSockets with zero conflict or lag.
- **🏷️ Remote Cursor Presence**: See exactly where your teammates are typing with color-coded, labeled floating carets.
- **🏃‍♂️ Live Code Execution**: Write and instantly execute code in multiple languages (Python, JavaScript, C++, Java, etc.) right in the browser.
- **⌨️ Stdin Support**: Provide standard input for your programs through a dedicated input panel.
- **🖥️ Native Terminal Output**: Outputs standard streams (stdout/stderr) natively and aesthetically.
- **💬 Built-in Room Chat**: Discuss algorithms and bugs with your team without leaving the IDE view.
- **🌗 Aesthetic UI**: Beautifully designed glassmorphic joining screens, distinct Light/Dark themes, and a responsive layout that works flawlessly on desktop devices.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS & Vanilla CSS (custom tokens)
- **Editor Engine**: `@monaco-editor/react`
- **Real-Time Data**: `y-monaco`, `y-socket.io`, `yjs`
- **Output Display**: `xterm.js` for native terminal rendering

### Backend
- **Server Environment**: Node.js & Express
- **Socket Network**: `socket.io` for seamless WebSockets.
- **Data Sync**: `y-socket.io` to sync operations reliably across clients.
- **Code Execution Environment**: Proxying requests to the Wandbox Compilation API for isolated compilation.

---

## 🚀 Getting Started

You can run CodeSync locally either via NPM or instantly via Docker, saving you time syncing environments.

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

---

## 🤝 Contributing

Contributions, issues, and feature requests are always welcome! Feel free to check the [issues](#) page if you want to contribute.

## 📝 License

This project is licensed under the **ISC License**.
