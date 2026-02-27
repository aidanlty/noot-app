require('dotenv').config()
const express = require('express')
const { createClient } = require('@supabase/supabase-js')

const app = express()
const PORT = 3000

app.use(express.json())

// 👇 FIX: Ensure req.body is always defined
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

// ** Supabase client (service role - full access)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ** ROUTES **

// Health check
app.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('count').single()
    res.json({ status: 'Supabase connected!', users: data?.count || 0 })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ** LOGIN - FIXED QUERY
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    
    // 1️⃣ Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      return res.status(401).json({ message: authError.message })
    }

    // 2️⃣ Get EXACT role from your users table
    const { data: userProfile, error: profileError } = await supabase
      .from('Profiles')
      .select('ID, Name, Email, Role')
      .eq('Email', email)
      .single()

    if (profileError || !userProfile) {
      return res.status(404).json({ message: 'User profile not found' })
    }

    console.log('🔍 Found user:', userProfile) // DEBUG

    res.json({
      user: {
        id: userProfile.ID,
        email: userProfile.Email,
        role: userProfile.Role,
      },
      token: authData.session.access_token
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: err.message })
  }
})

// ** REGISTER
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    })

    if (authError) {
      return res.status(400).json({ message: authError.message })
    }

    // Insert user profile (default customer)
     const { data: userProfile, error: profileError } = await supabase
      .from('Profiles')
      .insert({
        ID: authData.user.id,  // 👈 links to auth.users
        Name: name,            // 👈 lowercase from req.body, capitalized for column
        Email: email,
        Role: role,
      })
      .select()
      .single()

    if (profileError) {
      console.error('Profile insert error:', profileError) // 👈 check your terminal for the real error
      return res.status(500).json({ message: profileError.message })
    }

    res.json({
      user: {
        id: userProfile.ID,
        email: userProfile.Email,  // 👈 match your column casing
        role: userProfile.Role
      },
      token: authData.session?.access_token
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// VERIFY TOKEN (for router guards)
app.post('/api/auth/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
      return res.status(401).json({ message: 'Invalid token' })
    }

    // Use your real profiles table
    const { data: userProfile, error: profileError } = await supabase
      .from('Profiles')               // or 'users' – but be consistent
      .select('Role')
      .eq('Email', user.email)
      .single()

    if (profileError || !userProfile) {
      return res.status(403).json({ message: 'Profile not found' })
    }

    const role = String(userProfile.Role || 'customer').trim().toLowerCase()

    res.json({
      valid: true,
      email: user.email,
      role,  // 'customer' | 'manager' | 'technician' | 'administrator'
    })
  } catch (err) {
    res.status(401).json({ message: 'Token verification failed' })
  }
})


// ** LOGOUT
app.post('/api/auth/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      return res.status(400).json({ message: error.message })
    }
    
    res.json({ message: 'Logged out' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ** PROTECTED ROUTES (verify token + role)
app.get('/api/manager/data', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return res.status(401).json({ message: 'Not authenticated' })

    // Check role from your table
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('email', user.email)
      .single()

    if (profile?.role !== 'manager') {
      return res.status(403).json({ message: 'Manager access required' })
    }

    // Manager data
    const { data } = await supabase.from('appointments').select('*')
    res.json({ data, user })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// CHANGE PASSWORD
app.post('/api/auth/change-password', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { newPassword } = req.body;

    // get the user via auth token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // update pw via Supabase auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword
    });

    if (updateError) {
      return res.status(400).json({ message: updateError.message });
    }

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Supabase Backend: http://localhost:${3000}`)
})
