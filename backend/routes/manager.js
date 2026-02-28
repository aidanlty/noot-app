const express = require('express')
const router = express.Router()

module.exports = (supabase) => {

  // GET manager data
  router.get('/data', async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '')

      const { data: { user } } = await supabase.auth.getUser(token)
      if (!user) return res.status(401).json({ message: 'Not authenticated' })

      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('email', user.email)
        .single()

      if (profile?.role !== 'manager') {
        return res.status(403).json({ message: 'Manager access required' })
      }

      const { data } = await supabase.from('appointments').select('*')
      res.json({ data, user })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  return router
}