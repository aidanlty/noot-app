const express = require('express')
const router = express.Router()

module.exports = (supabase) => {

  // LOGIN
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        return res.status(401).json({ message: authError.message })
      }

      const { data: userProfile, error: profileError } = await supabase
        .from('Profiles')
        .select('ID, Name, Email, Role')
        .eq('Email', email)
        .single()

      if (profileError || !userProfile) {
        return res.status(404).json({ message: 'User profile not found' })
      }

      console.log('🔍 Found user:', userProfile)

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

  // REGISTER
  router.post('/register', async (req, res) => {
    try {
      const { name, email, password, role } = req.body

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
      })

      if (authError) {
        return res.status(400).json({ message: authError.message })
      }

      const { data: userProfile, error: profileError } = await supabase
        .from('Profiles')
        .insert({
          ID: authData.user.id,
          Name: name,
          Email: email,
          Role: role,
        })
        .select()
        .single()

      if (profileError) {
        console.error('Profile insert error:', profileError)
        return res.status(500).json({ message: profileError.message })
      }

      res.json({
        user: {
          id: userProfile.ID,
          email: userProfile.Email,
          role: userProfile.Role
        },
        token: authData.session?.access_token
      })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  // VERIFY TOKEN
  router.post('/verify', async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '')

      const { data: { user }, error } = await supabase.auth.getUser(token)
      if (error || !user) {
        return res.status(401).json({ message: 'Invalid token' })
      }

      const { data: userProfile, error: profileError } = await supabase
        .from('Profiles')
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
        role,
      })
    } catch (err) {
      res.status(401).json({ message: 'Token verification failed' })
    }
  })

  // LOGOUT
  router.post('/logout', async (req, res) => {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        return res.status(400).json({ message: error.message })
      }

      res.json({ message: 'Logged out' })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  // CHANGE PASSWORD
  router.post('/change-password', async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '')
      const { newPassword } = req.body

      const { data: { user }, error: authError } = await supabase.auth.getUser(token)
      if (authError || !user) {
        return res.status(401).json({ message: 'Invalid or expired token' })
      }

      const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        password: newPassword
      })

      if (updateError) {
        return res.status(400).json({ message: updateError.message })
      }

      res.json({ message: 'Password updated successfully' })
    } catch (err) {
      console.error('Change password error:', err)
      res.status(500).json({ error: err.message })
    }
  })

  return router
}