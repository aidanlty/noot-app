const express = require('express')
const router = express.Router()

module.exports = (supabase) => {

  // GET all technicians
  router.get('/', async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '')

      const { data: { user }, error: authError } = await supabase.auth.getUser(token)
      if (authError || !user) {
        return res.status(401).json({ message: 'Invalid or expired token' })
      }

      const { data: technicians, error } = await supabase
        .from('Profiles')
        .select('ID, Name, Email, Role')
        .eq('Role', 'technician')

      if (error) {
        return res.status(500).json({ message: error.message })
      }

      res.json({ technicians })
    } catch (err) {
      console.error('Get technicians error:', err)
      res.status(500).json({ error: err.message })
    }
  })

  return router
}