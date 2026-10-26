import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DB_FILE = path.resolve(__dirname, 'mockups-db.json')

function mockupPersistencePlugin() {
  return {
    name: 'mockup-persistence',
    configureServer(server: any) {
      server.middlewares.use('/api/mockups', (req: any, res: any) => {
        if (req.method === 'GET') {
          if (fs.existsSync(DB_FILE)) {
            try {
              const data = fs.readFileSync(DB_FILE, 'utf-8')
              res.setHeader('Content-Type', 'application/json')
              res.end(data)
              return
            } catch (err: any) {
              console.error('Error reading mockups-db.json', err)
            }
          }
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify([]))
        } else if (req.method === 'POST') {
          let body = ''
          req.on('data', (chunk: any) => {
            body += chunk
          })
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body)
              fs.writeFileSync(DB_FILE, body, 'utf-8')
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: true, count: Array.isArray(parsed) ? parsed.length : 1 }))
            } catch (err: any) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: err.message }))
            }
          })
        } else {
          res.statusCode = 405
          res.end('Method Not Allowed')
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  server: {
    watch: {
      ignored: ['**/mockups-db.json', '**/mockups-db.json/**', '**/.user_uploaded/**'],
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    mockupPersistencePlugin(),
  ],
})
