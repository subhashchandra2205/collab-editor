import { BrowserRouter, Routes, Route, useParams, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { yCollab } from 'y-codemirror.next'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

// Set VITE_WS_URL in a .env file for deployment (see .env.example).
// Falls back to local dev server on port 1234.
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:1234'

function Home() {
  const navigate = useNavigate()

  const createRoom = () => {
    const roomId = Math.random().toString(36).substring(2, 8)
    navigate(`/room/${roomId}`)
  }

  return (
    <div className="page">
      <h1>Collab Editor</h1>
      <p>A real-time collaborative code editor. Start a session and share the link.</p>
      <button className="btn" onClick={createRoom}>New Session</button>
    </div>
  )
}

function Room() {
  const { roomId } = useParams()
  const editorRef = useRef(null)
  const [status, setStatus] = useState('connecting')
  const [userCount, setUserCount] = useState(1)

  useEffect(() => {
    const ydoc = new Y.Doc()
    const provider = new WebsocketProvider(WS_URL, roomId, ydoc)
    const ytext = ydoc.getText('codemirror')

    provider.on('status', (event) => setStatus(event.status))

    provider.awareness.setLocalStateField('user', {
      name: 'User-' + Math.floor(Math.random() * 1000),
      color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
    })

    provider.awareness.on('change', () => {
      setUserCount(provider.awareness.getStates().size)
    })

    const view = new EditorView({
      doc: ytext.toString(),
      extensions: [basicSetup, javascript(), yCollab(ytext, provider.awareness)],
      parent: editorRef.current,
    })

    return () => {
      view.destroy()
      provider.destroy()
      ydoc.destroy()
    }
  }, [roomId])

  return (
    <div className="page">
      <h2>Room: {roomId}</h2>
      <div className="room-url">{window.location.href}</div>
      <span className={`status ${status}`}>
        {status} · {userCount} {userCount === 1 ? 'user' : 'users'} connected
      </span>
      <div className="editor-shell" ref={editorRef}></div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:roomId" element={<Room />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
