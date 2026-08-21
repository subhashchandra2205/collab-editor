import { BrowserRouter, Routes, Route, useParams, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState, useMemo } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { yCollab } from 'y-codemirror.next'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:1234'

const DEMO_LINES = [
  'const project = {',
  '  status: "collaborating",',
  '  teammates: 3',
  '}'
]

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function TypingDemo() {
  const [lines, setLines] = useState(['', '', '', ''])
  const [active, setActive] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function run() {
      while (!cancelled) {
        setLines(['', '', '', ''])
        await sleep(450)

        for (let line = 0; line < DEMO_LINES.length; line += 1) {
          setActive(line % 2)
          for (let i = 1; i <= DEMO_LINES[line].length; i += 1) {
            if (cancelled) return
            setLines((current) => current.map((value, index) => index === line ? DEMO_LINES[line].slice(0, i) : value))
            await sleep(line === 1 ? 28 : 34)
          }
          await sleep(180)
        }
        await sleep(1800)
      }
    }

    run()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="demo-card">
      <div className="demo-topbar">
        <div className="window-dots"><i /><i /><i /></div>
        <span className="demo-file">collab.js</span>
        <span className="demo-live"><b /> LIVE</span>
      </div>
      <div className="demo-editor">
        {lines.map((line, index) => (
          <div className="demo-line" key={index}>
            <span className="line-number">{String(index + 1).padStart(2, '0')}</span>
            <span className={index === 0 || index === 3 ? 'syntax-purple' : index === 1 ? 'syntax-green' : 'syntax-blue'}>{line}</span>
            {active === index % 2 && line.length > 0 && line.length < DEMO_LINES[index].length && <span className={`typing-caret ${index % 2 ? 'amber' : 'cyan'}`} />}
          </div>
        ))}
      </div>
      <div className="demo-bottom">
        <span><i className="avatar cyan-avatar" /> You</span>
        <span><i className="avatar amber-avatar" /> Alex is editing</span>
        <span className="demo-sync">Synced</span>
      </div>
    </div>
  )
}

function Home() {
  const navigate = useNavigate()
  const [roomInput, setRoomInput] = useState('')

  const createRoom = () => {
    const roomId = Math.random().toString(36).substring(2, 8)
    navigate(`/room/${roomId}`)
  }

  const joinRoom = (event) => {
    event.preventDefault()
    const id = roomInput.trim().replace(/^\/+/, '')
    if (id) navigate(`/room/${id}`)
  }

  return (
    <main className="home">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <nav className="nav">
        <button className="brand" onClick={() => navigate('/')} aria-label="Collab Editor home">
          <span className="brand-mark"><span /></span>
          <span>collab<span>editor</span></span>
        </button>
        <div className="nav-meta"><span className="nav-dot" /> Real-time collaboration</div>
      </nav>

      <section className="hero">
        <div className="eyebrow"><span>●</span> Built for teams that move fast</div>
        <h1>Code together.<br /><em>In real time.</em></h1>
        <p className="hero-sub">A minimal collaborative editor where every keystroke appears instantly. No accounts, no merge conflicts, no friction.</p>

        <div className="hero-actions">
          <button className="primary-btn" onClick={createRoom}>Create a room <span>→</span></button>
          <form className="join-form" onSubmit={joinRoom}>
            <span>/</span>
            <input value={roomInput} onChange={(e) => setRoomInput(e.target.value)} placeholder="room name" aria-label="Room name" />
            <button type="submit" aria-label="Join room">Join</button>
          </form>
        </div>

        <TypingDemo />

        <div className="trust-row">
          <span><b>01</b> Conflict-free sync</span>
          <span><b>02</b> Live cursors</span>
          <span><b>03</b> No signup</span>
          <span><b>04</b> Shareable rooms</span>
        </div>
      </section>

      <footer className="home-footer">Open a room · Share the link · Start building</footer>
    </main>
  )
}

function Room() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const editorRef = useRef(null)
  const [status, setStatus] = useState('connecting')
  const [peers, setPeers] = useState([])
  const [copied, setCopied] = useState(false)

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return window.location.href
  }, [roomId])

  useEffect(() => {
    const ydoc = new Y.Doc()
    const provider = new WebsocketProvider(WS_URL, roomId, ydoc)
    const ytext = ydoc.getText('codemirror')

    provider.on('status', (event) => setStatus(event.status))

    const color = randomColor()
    provider.awareness.setLocalStateField('user', {
      name: 'User-' + Math.floor(Math.random() * 1000),
      color,
    })

    const updatePeers = () => {
      const states = Array.from(provider.awareness.getStates().values())
      setPeers(states.map((s) => s.user).filter(Boolean))
    }

    provider.awareness.on('change', updatePeers)
    updatePeers()

    const view = new EditorView({
      doc: ytext.toString(),
      extensions: [basicSetup, oneDark, javascript(), yCollab(ytext, provider.awareness)],
      parent: editorRef.current,
    })

    return () => {
      view.destroy()
      provider.destroy()
      ydoc.destroy()
    }
  }, [roomId])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  const connected = status === 'connected'

  return (
    <main className="room">
      <header className="room-header">
        <div className="room-brand-group">
          <button className="back-btn" onClick={() => navigate('/')} aria-label="Back to home">←</button>
          <div className="room-brand"><span className="brand-mark"><span /></span><strong>collab<span>editor</span></strong></div>
          <span className="header-divider" />
          <div className="room-title"><span>Room</span><strong>{roomId}</strong></div>
        </div>

        <div className="room-actions">
          <div className={`connection ${connected ? 'is-connected' : ''}`}><i /> {connected ? 'Connected' : 'Connecting'}</div>
          <div className="people-count"><span className="mini-avatars">{peers.slice(0, 3).map((p, i) => <i key={i} style={{ background: p.color }} />)}</span>{peers.length} online</div>
          <button className="copy-btn" onClick={copyLink}>{copied ? 'Copied!' : 'Share room'} <span>{copied ? '✓' : '↗'}</span></button>
        </div>
      </header>

      <div className="editor-wrap">
        <div className="editor-toolbar">
          <span className="file-tab"><i /> index.js</span>
          <span className="editor-hint">JavaScript · Auto-saved</span>
        </div>
        <div className="editor-shell" ref={editorRef} />
        <div className="editor-statusbar"><span>UTF-8</span><span>JavaScript</span><span className="status-spacer" /><span>Room / {roomId}</span></div>
      </div>
    </main>
  )
}

function randomColor() {
  const palette = ['#5eead4', '#f5b44d', '#c792ea', '#82aaff', '#f78c6c', '#a3d977']
  return palette[Math.floor(Math.random() * palette.length)]
}

function App() {
  return <BrowserRouter><Routes><Route path="/" element={<Home />} /><Route path="/room/:roomId" element={<Room />} /></Routes></BrowserRouter>
}

export default App
