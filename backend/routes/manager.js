const express = require('express')
const router = express.Router()
const requireRole = require('../middleware/requireRole')   // NEW

module.exports = (supabase) => {

  // GET manager data
  router.get('/data', async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '')

      const { data: { user } } = await supabase.auth.getUser(token)
      if (!user) return res.status(401).json({ message: 'Not authenticated' })

      const { data: profile } = await supabase
        .from('Profiles')
        .select('"Role"')
        .eq('"Email"', user.email)
        .single()

      if (profile?.Role !== 'manager') {
        return res.status(403).json({ message: 'Manager access required' })
      }

      const { data } = await supabase.from('Appointments').select('*')
      res.json({ data, user })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  // GET all job cards with appointment and technician info
  router.get('/job-cards', requireRole(supabase, ['manager']), async (req, res) => {   // MODIFIED - replaced inline auth block with requireRole middleware
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1)
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10))
      const from = (page - 1) * limit
      const to = from + limit - 1

      // works (tested in testConnection.js
      const { data, error, count } = await supabase
        .from('Job_Orders')
        .select(`
          *,
          customer:Customers!Job_Orders_Customer_ID_fkey (
            "Customer_ID", "Customer_Name", "Email"
          ),
          appointment:Appointments!Job_Orders_appointment_id_fkey (
            *,
            customer:Profiles!Appointments_customer_id_fkey (
              "ID", "Name", "Email"
            ),
            technician:Profiles!Appointments_technician_id_fkey (
              "ID", "Name", "Email"
            )
          ),
          technician:Profiles!Job_Orders_technician_id_fkey (
            "ID", "Name", "Email"
          )
        `, { count: 'exact' })
        .range(from, to)

      if (error) return res.status(500).json({ error: error.message })

      res.json({
        data,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  return router
}