import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const TESLA_TOKEN_URL = 'https://auth.tesla.com/oauth2/v3/token'

function teslaApiProxy(): Plugin {
  return {
    name: 'tesla-api-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()

        // CORS
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        if (req.method === 'OPTIONS') { res.statusCode = 200; return res.end() }

        try {
          if (req.url === '/api/token' && req.method === 'POST') {
            const body = await readBody(req)
            const resp = await fetch(TESLA_TOKEN_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                grant_type: 'authorization_code',
                client_id: 'ownerapi',
                code: body.code,
                code_verifier: body.code_verifier,
                redirect_uri: body.redirect_uri,
              }),
            })
            const data = await resp.json()
            res.statusCode = resp.status
            res.setHeader('Content-Type', 'application/json')
            return res.end(JSON.stringify(data))
          }

          if (req.url === '/api/refresh' && req.method === 'POST') {
            const body = await readBody(req)
            const resp = await fetch(TESLA_TOKEN_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                grant_type: 'refresh_token',
                client_id: 'ownerapi',
                refresh_token: body.refresh_token,
              }),
            })
            const data = await resp.json()
            res.statusCode = resp.status
            res.setHeader('Content-Type', 'application/json')
            return res.end(JSON.stringify(data))
          }

          if (req.url === '/api/orders' && req.method === 'GET') {
            const auth = req.headers.authorization
            if (!auth) { res.statusCode = 401; return res.end(JSON.stringify({ error: 'Missing authorization' })) }
            const resp = await fetch('https://owner-api.teslamotors.com/api/1/users/orders', {
              headers: { Authorization: auth, 'Content-Type': 'application/json' },
            })
            const data = await resp.json()
            res.statusCode = resp.status
            res.setHeader('Content-Type', 'application/json')
            return res.end(JSON.stringify(data))
          }

          if (req.url?.startsWith('/api/order-details') && req.method === 'GET') {
            const auth = req.headers.authorization
            if (!auth) { res.statusCode = 401; return res.end(JSON.stringify({ error: 'Missing authorization' })) }
            const url = new URL(req.url, 'http://localhost')
            const refNum = url.searchParams.get('referenceNumber')
            if (!refNum) { res.statusCode = 400; return res.end(JSON.stringify({ error: 'Missing referenceNumber' })) }
            const teslaUrl = `https://akamai-apigateway-vfx.tesla.com/tasks?deviceLanguage=en&deviceCountry=US&referenceNumber=${encodeURIComponent(refNum)}&appVersion=9.99.9-9999`
            const resp = await fetch(teslaUrl, {
              headers: { Authorization: auth, 'Content-Type': 'application/json' },
            })
            const data = await resp.json()
            res.statusCode = resp.status
            res.setHeader('Content-Type', 'application/json')
            return res.end(JSON.stringify(data))
          }

          res.statusCode = 404
          res.end(JSON.stringify({ error: 'Not found' }))
        } catch (err) {
          console.error('API proxy error:', err)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Proxy error' }))
        }
      })
    },
  }
}

function readBody(req: import('http').IncomingMessage): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk: Buffer) => { data += chunk.toString() })
    req.on('end', () => {
      try { resolve(JSON.parse(data)) } catch { reject(new Error('Invalid JSON body')) }
    })
    req.on('error', reject)
  })
}

export default defineConfig({
  plugins: [react(), tailwindcss(), teslaApiProxy()],
})
