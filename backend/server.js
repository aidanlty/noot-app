require('dotenv').config()
const express = require('express')
const { createClient } = require('@supabase/supabase-js')

const app = express()
const PORT = 3000

// Middleware
app.use(express.json())

app.use((req, res, next) => {
  if (!req.body) req.body = {}
  next()
})

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173')
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

// Supabase client (service role - full access)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Routes
app.use('/api/auth', require('./routes/auth')(supabase))
app.use('/api/technicians', require('./routes/technicians')(supabase))
app.use('/api/manager', require('./routes/manager')(supabase))
app.use('/api/jobOrders', require('./routes/jobOrders')(supabase))   
app.use('/api/customer', require('./routes/customer')(supabase))

// Health check
app.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('count').single()
    res.json({ status: 'Supabase connected!', users: data?.count || 0 })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 Supabase Backend: http://localhost:${PORT}`)
})