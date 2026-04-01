import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"
import { YSocketIO } from "y-socket.io/dist/server"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(express.json())
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "Content-Type")
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    if (req.method === "OPTIONS") return res.sendStatus(200)
    next()
})
app.use(express.static(path.join(__dirname, "public")))

const httpServer = createServer(app)

const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: [ "GET", "POST" ]
    }
})

const ySocketIO = new YSocketIO(io)
ySocketIO.initialize()

// Wandbox compiler mapping (free, no API key required)
// Names verified from: https://wandbox.org/api/list.json
const WANDBOX_COMPILERS = {
    javascript: "nodejs-20.17.0",
    typescript: "typescript-5.6.2",
    python:     "cpython-3.12.7",
    java:       "openjdk-jdk-22+36",
    cpp:        "gcc-head",
    c:          "gcc-head-c",
}

// Code execution endpoint
app.post('/api/execute', async (req, res) => {
    try {
        const { language, code, stdin } = req.body

        const compiler = WANDBOX_COMPILERS[language]
        if (!compiler) {
            return res.status(400).json({ error: `Language "${language}" is not supported for execution.` })
        }

        const payload = { code, compiler }
        if (stdin) payload.stdin = stdin

        const response = await fetch("https://wandbox.org/api/compile.json", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })

        if (!response.ok) {
            const text = await response.text()
            return res.status(502).json({ error: `Execution service error: ${text}` })
        }

        const data = await response.json()

        // Wandbox returns compiler_message for build errors, program_output for stdout,
        // program_error for stderr, and status "0" on success.
        const compileError = data.compiler_message || ""
        const stdout      = data.program_output   || ""
        const stderr      = data.program_error     || ""
        const exitCode    = parseInt(data.status ?? "0", 10)

        res.json({
            stdout,
            stderr: compileError ? compileError + "\n" + stderr : stderr,
            exitCode,
        })
    } catch (err) {
        res.status(500).json({ error: `Execution service unavailable: ${err.message}` })
    }
})

app.get('/health', (req, res) => {
    res.status(200).json({
        message: "ok",
        success: true
    })
})

app.get('{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"))
})

httpServer.listen(4000, () => {
    console.log("Server is running on port 4000")
})