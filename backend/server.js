const express = require('express')
const crypto = require('crypto')

const app = express()
const PORT = 3000

app.use(express.json())

// Simple CORS for your Vue dev server
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173')
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

// USERS (in-memory database)
let users = [
  { id: 1, email: 'customer@test.com', password: '123456', role: 'customer', name: 'Test Customer' },
  { id: 2, email: 'manager@test.com', password: '123456', role: 'manager', name: 'Test Manager' },
  { id: 3, email: 'tech@test.com', password: '123456', role: 'technician', name: 'Test Tech' }
]

// SESSIONS
const sessions = new Map()

function createSession(user) {
  const sessionId = crypto.randomBytes(32).toString('hex')
  sessions.set(sessionId, { userId: user.id, email: user.email, role: user.role, createdAt: Date.now() })
  return sessionId
}

function getSession(sessionId) {
  const session = sessions.get(sessionId)
  if (!session || Date.now() - session.createdAt > 7200000) { // 2h
    sessions.delete(sessionId)
    return null
  }
  return session
}

// AUTH MIDDLEWARE
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const session = getSession(token)
  if (!session) return res.status(401).json({ message: 'Not authenticated' })
  req.user = session
  next()
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' })
    }
    next()
  }
}

// ROUTES
app.get('/', (req, res) => res.json({ status: 'Backend ready!' }))

// LOGIN
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body
  const user = users.find(u => u.email === email && u.password === password)
  
  if (!user) return res.status(401).json({ message: 'Invalid credentials' })
  
  const token = createSession(user)
  res.json({
    user: { email: user.email, role: user.role },
    token
  })
})

// REGISTER
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body
  
  if (users.find(u => u.email === email)) {
    return res.status(409).json({ message: 'Email exists' })
  }
  
  const newUser = {
    id: users.length + 1,
    name,
    email,
    password, // plain for demo
    role: 'customer'
  }
  
  users.push(newUser)
  const token = createSession(newUser)
  
  res.json({
    user: { email: newUser.email, role: newUser.role },
    token
  })
})

// VERIFY (router guard)
app.post('/api/auth/verify', authMiddleware, (req, res) => {
  res.json({ valid: true, email: req.user.email, role: req.user.role })
})

// PROTECTED ROUTES
app.get('/api/manager/data', authMiddleware, requireRole('manager'), (req, res) => {
  res.json({ message: 'Manager data', user: req.user })
})

app.get('/api/customer/data', authMiddleware, requireRole('customer'), (req, res) => {
  res.json({ message: 'Customer data', user: req.user })
})

app.listen(PORT, () => {
  console.log(`🚀 Backend: http://localhost:${PORT}`)
})
