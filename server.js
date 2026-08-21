import http from 'http'
import pkg from 'ws'
const { Server: WebSocketServer } = pkg
import { setupWSConnection } from 'y-websocket/bin/utils'

const port = process.env.PORT || 1234

const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' })
  response.end('y-websocket server is running')
})

const wss = new WebSocketServer({ server })

wss.on('connection', (conn, req) => {
  setupWSConnection(conn, req)
})

server.listen(port, '0.0.0.0', () => {
  console.log(`y-websocket server running on 0.0.0.0:${port}`)
})