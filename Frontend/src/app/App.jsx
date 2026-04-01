import "./App.css";
import { Editor } from "@monaco-editor/react";
import { MonacoBinding } from "y-monaco";
import { useRef, useMemo, useState, useEffect, useCallback } from "react";
import * as Y from "yjs";
import { SocketIOProvider } from "y-socket.io";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { Menu, X as XIcon } from "lucide-react";

const LANGUAGES = [
  { value: "javascript", label: "JavaScript", runnable: true },
  { value: "typescript", label: "TypeScript", runnable: true },
  { value: "python", label: "Python", runnable: true },
  { value: "java", label: "Java", runnable: true },
  { value: "cpp", label: "C++", runnable: true },
  { value: "c", label: "C", runnable: true },
  { value: "html", label: "HTML", runnable: false },
  { value: "css", label: "CSS", runnable: false },
  { value: "json", label: "JSON", runnable: false },
  { value: "markdown", label: "Markdown", runnable: false },
];

/* ===== SVG Icon Components ===== */
function CodeSyncIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="csg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8b5cf6" />
          <stop offset="0.5" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#csg)" opacity="0.15" />
      <path d="M12 10L7 16L12 22" stroke="url(#csg)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 10L25 16L20 22" stroke="url(#csg)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function RoomIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" /><path d="M3 9h6" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
    </svg>
  );
}

/* ===== Terminal Component ===== */
function TerminalOutput({ output, isRunning, theme }) {
  const xtermRef = useRef(null);
  const termRef = useRef(null);
  const fitAddonRef = useRef(null);

  useEffect(() => {
    if (!xtermRef.current) return;
    const term = new Terminal({
      theme: theme === "dark" 
        ? { background: 'transparent', foreground: '#f1f5f9', cursor: '#8b5cf6' } 
        : { background: 'transparent', foreground: '#0f172a', cursor: '#7c3aed' },
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontSize: 13,
      cursorBlink: true,
      disableStdin: true
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(xtermRef.current);
    setTimeout(() => fitAddon.fit(), 50);
    
    termRef.current = term;
    fitAddonRef.current = fitAddon;

    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, [theme]);

  useEffect(() => {
    if (termRef.current) {
      termRef.current.clear();
      if (isRunning) {
        termRef.current.writeln('\x1b[36mRunning your code...\x1b[0m');
      } else if (output) {
        if (output.error) {
          termRef.current.writeln(`\x1b[31;1m${output.error.replace(/\n/g, '\r\n')}\x1b[0m`);
        } else {
          if (output.stdout) termRef.current.write(output.stdout.replace(/\n/g, '\r\n'));
          if (output.stderr) termRef.current.write(`\r\n\x1b[31m${output.stderr.replace(/\n/g, '\r\n')}\x1b[0m`);
          if (!output.stdout && !output.stderr) termRef.current.writeln('\x1b[3mNo output\x1b[0m');
          
          if (output.exitCode !== undefined) {
             const color = output.exitCode === 0 ? '\x1b[32m' : '\x1b[31m';
             termRef.current.writeln(`\r\n\r\n${color}Process exited with code ${output.exitCode}\x1b[0m`);
          }
        }
      }
    }
  }, [output, isRunning]);

  return <div ref={xtermRef} style={{ width: '100%', height: '100%', overflow: 'hidden' }} />;
}

/* ===== Main App ===== */
function App() {
  const editorRef = useRef(null);
  const providerRef = useRef(null);
  const chatEndRef = useRef(null);
  const prevUsersRef = useRef(new Set());

  const userColor = useMemo(() => {
    const colors = [
      "#e06c75", "#61afef", "#98c379", "#e5c07b", "#c678dd",
      "#56b6c2", "#d19a66", "#ff6b81", "#a29bfe", "#00cec9",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  const [username, setUsername] = useState(() =>
    new URLSearchParams(window.location.search).get("username") || ""
  );
  const [room, setRoom] = useState(() =>
    new URLSearchParams(window.location.search).get("room") || ""
  );
  const [users, setUsers] = useState([]);
  const [language, setLanguage] = useState("javascript");
  const [activeTab, setActiveTab] = useState("users");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [outputOpen, setOutputOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [copied, setCopied] = useState(false);
  const [stdinInput, setStdinInput] = useState("");
  const [stdinOpen, setStdinOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditorMounted, setIsEditorMounted] = useState(false);
  const [isProviderReady, setIsProviderReady] = useState(false);
  const bindingRef = useRef(null);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("codesync-theme") || "dark";
  });

  const ydoc = useMemo(() => new Y.Doc(), []);
  const yText = useMemo(() => ydoc.getText("monaco"), [ydoc]);
  const yChat = useMemo(() => ydoc.getArray("chat"), [ydoc]);

  // Toast system
  const addToast = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  // Editor mount
  const handleMount = (editor) => {
    editorRef.current = editor;
    setIsEditorMounted(true);
  };

  // Bind Yjs to Monaco
  useEffect(() => {
    if (isEditorMounted && isProviderReady && !bindingRef.current) {
      bindingRef.current = new MonacoBinding(
        yText,
        editorRef.current.getModel(),
        new Set([editorRef.current]),
        providerRef.current.awareness
      );
    }
    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
    };
  }, [isEditorMounted, isProviderReady, yText]);

  // Theme toggle
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("codesync-theme", next);
  };

  // Apply theme to DOM
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    // Update Monaco editor theme if editor is mounted
    if (window.monaco) {
      window.monaco.editor.setTheme(theme === "dark" ? "vs-dark" : "vs");
    }
  }, [theme]);

  // Join
  const handleJoin = (e) => {
    e.preventDefault();
    const joinUsername = e.target.username.value.trim();
    const joinRoom = e.target.room.value.trim() || "default";
    if (!joinUsername) return;
    setUsername(joinUsername);
    setRoom(joinRoom);
    window.history.pushState({}, "", `?username=${joinUsername}&room=${joinRoom}`);
  };

  // Copy invite link
  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    addToast("Invite link copied!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  // Run code
  const handleRunCode = async () => {
    const code = editorRef.current?.getValue();
    if (!code) return;
    const lang = LANGUAGES.find((l) => l.value === language);
    if (!lang?.runnable) {
      addToast(`${lang?.label || language} cannot be executed`, "error");
      return;
    }
    setIsRunning(true);
    setOutputOpen(true);
    setOutput(null);
    try {
      const apiUrl = import.meta.env.DEV ? "http://localhost:4000" : "";
      const res = await fetch(`${apiUrl}/api/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code, stdin: stdinInput || undefined }),
      });
      const data = await res.json();
      setOutput(data);
    } catch (err) {
      setOutput({ error: err.message });
    } finally {
      setIsRunning(false);
    }
  };

  // Send chat message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    yChat.push([{ username, color: userColor, text: chatInput.trim(), timestamp: Date.now() }]);
    setChatInput("");
  };

  // Yjs connection
  useEffect(() => {
    if (username && room) {
      const socketUrl = import.meta.env.DEV ? "http://localhost:4000" : "/";
      const provider = new SocketIOProvider(socketUrl, room, ydoc, { autoConnect: true });
      providerRef.current = provider;
      setIsProviderReady(true);

      provider.awareness.setLocalStateField("user", { name: username, username, color: userColor });

      const updateUsers = () => {
        const states = Array.from(provider.awareness.getStates().entries());
        const uniqueUsers = [];
        const seen = new Set();
        let cssString = "";

        for (const [clientId, state] of states) {
          if (state.user && state.user.username) {
            if (!seen.has(state.user.username)) {
              uniqueUsers.push(state.user);
              seen.add(state.user.username);
            }
            cssString += `.yRemoteSelectionHead-${clientId}::after { content: "${state.user.username}"; }\n`;
          }
        }

        let styleTag = document.getElementById("yjs-cursor-names");
        if (!styleTag) {
          styleTag = document.createElement("style");
          styleTag.id = "yjs-cursor-names";
          document.head.appendChild(styleTag);
        }
        styleTag.textContent = cssString;
        // Toast for joins/leaves
        const currentNames = new Set(uniqueUsers.map((u) => u.username));
        const prevNames = prevUsersRef.current;
        for (const name of currentNames) {
          if (!prevNames.has(name) && name !== username && prevNames.size > 0) {
            addToast(`${name} joined the room`, "success");
          }
        }
        for (const name of prevNames) {
          if (!currentNames.has(name) && name !== username) {
            addToast(`${name} left the room`, "warning");
          }
        }
        prevUsersRef.current = currentNames;
        setUsers(uniqueUsers);
      };

      updateUsers();
      provider.awareness.on("change", updateUsers);

      // Chat observer
      const chatObserver = () => setChatMessages(yChat.toArray());
      yChat.observe(chatObserver);
      chatObserver();

      function handleBeforeUnload() {
        provider.awareness.setLocalStateField("user", null);
      }
      window.addEventListener("beforeunload", handleBeforeUnload);

      return () => {
        setIsProviderReady(false);
        provider.disconnect();
        yChat.unobserve(chatObserver);
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    }
  }, [username, room]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // ===== JOIN SCREEN =====
  if (!username || !room) {
    return (
      <div className="join-screen">
        <div className="join-bg-orb join-bg-orb-1" />
        <div className="join-bg-orb join-bg-orb-2" />
        <div className="join-bg-orb join-bg-orb-3" />
        <div className="join-card">
          <div className="join-logo">
            <CodeSyncIcon size={48} />
            <h1>CodeSync</h1>
            <p>Real-time collaborative code editor</p>
          </div>
          <form onSubmit={handleJoin} className="join-form">
            <div className="input-group">
              <UserIcon />
              <input type="text" name="username" placeholder="Your username" required autoFocus />
            </div>
            <div className="input-group">
              <RoomIcon />
              <input type="text" name="room" placeholder="Room name (default)" />
            </div>
            <button type="submit" className="join-btn">
              Start Coding <ArrowIcon />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ===== EDITOR SCREEN =====
  const currentLang = LANGUAGES.find((l) => l.value === language);

  return (
    <div className="app-container">
      {/* Toasts */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>{toast.message}</div>
        ))}
      </div>

      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <button 
            className="mobile-menu-btn" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <XIcon size={20} /> : <Menu size={20} />}
          </button>
          <CodeSyncIcon size={24} />
          <span className="header-brand">CodeSync</span>
          <span className="header-divider" />
          <span className="header-room">{room}</span>
        </div>
        <div className="header-right">
          <button onClick={handleCopyLink} className="header-btn">
            {copied ? "✓ Copied!" : "📋 Invite"}
          </button>
          <button onClick={toggleTheme} className="header-btn theme-toggle" title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <select
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value);
              if (editorRef.current) {
                const model = editorRef.current.getModel();
                window.monaco?.editor.setModelLanguage(model, e.target.value);
              }
            }}
            className="header-select"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>{lang.label}</option>
            ))}
          </select>
          {currentLang?.runnable && (
            <>
              <button onClick={() => setStdinOpen(!stdinOpen)} className="header-btn stdin-toggle">
                {stdinOpen ? "⌨ Hide Input" : "⌨ Stdin"}
              </button>
              <button onClick={handleRunCode} disabled={isRunning} className="run-btn">
                {isRunning ? "⏳ Running..." : "▶ Run"}
              </button>
            </>
          )}
        </div>
      </header>

      {/* Workspace */}
      <div className="workspace">
        {/* Sidebar */}
        <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
          <div className="sidebar-tabs">
            <button className={`sidebar-tab ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")}>
              👤 Users ({users.length})
            </button>
            <button className={`sidebar-tab ${activeTab === "chat" ? "active" : ""}`} onClick={() => setActiveTab("chat")}>
              💬 Chat
            </button>
          </div>

          {activeTab === "users" ? (
            <div className="users-panel">
              {users.map((user, i) => (
                <div key={i} className="user-item">
                  <div className="user-avatar" style={{ background: user.color }}>
                    {user.username[0].toUpperCase()}
                  </div>
                  <span className="user-name">{user.username}</span>
                  {user.username === username && <span className="user-you">you</span>}
                </div>
              ))}
            </div>
          ) : (
            <div className="chat-panel">
              <div className="chat-messages">
                {chatMessages.map((msg, i) => (
                  <div key={i} className="chat-message">
                    <span className="chat-author" style={{ color: msg.color }}>{msg.username}</span>
                    <span className="chat-text">{msg.text}</span>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="chat-input-form">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  className="chat-input"
                />
                <button type="submit" className="chat-send">↑</button>
              </form>
            </div>
          )}
        </aside>

        {/* Editor + Output */}
        <div className="editor-area">
          {stdinOpen && (
            <div className="stdin-panel">
              <div className="stdin-header">
                <span>⌨ Standard Input (stdin)</span>
                <button onClick={() => setStdinOpen(false)} className="output-close">✕</button>
              </div>
              <textarea
                className="stdin-textarea"
                value={stdinInput}
                onChange={(e) => setStdinInput(e.target.value)}
                placeholder="Enter input for your program here...&#10;Each line is a separate input"
                spellCheck={false}
              />
            </div>
          )}
          <div className="editor-container" style={outputOpen ? { height: `calc(100% - 200px${stdinOpen ? ' - 120px' : ''})` } : stdinOpen ? { height: 'calc(100% - 120px)' } : undefined}>
            <Editor
              height="100%"
              language={language}
              defaultValue="// Start coding..."
              theme={theme === "dark" ? "vs-dark" : "vs"}
              onMount={(editor, monaco) => {
                window.monaco = monaco;
                handleMount(editor);
              }}
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                minimap: { enabled: false },
                padding: { top: 16 },
                smoothScrolling: true,
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
                renderLineHighlight: "all",
                bracketPairColorization: { enabled: true },
              }}
            />
          </div>

          {outputOpen && (
            <div className="output-panel">
              <div className="output-header">
                <span>Output</span>
                <button onClick={() => setOutputOpen(false)} className="output-close">✕</button>
              </div>
              <div className="output-content" style={{ overflow: 'hidden', padding: '12px 16px' }}>
                <TerminalOutput output={output} isRunning={isRunning} theme={theme} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
