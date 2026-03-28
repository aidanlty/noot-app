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
  router.get('/jobCards', requireRole(supabase, ['manager']), async (req, res) => {   // MODIFIED - replaced inline auth block with requireRole middleware
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
          appointment:Appointments!Job_Orders_appointment_id_fkey (
            *,
            CustomerProfile:Profiles!Appointments_customer_id_fkey (
              ID,
              Name,
              Email
            ),
            DiagnoseTechnicianProfile:Profiles!Appointments_technician_id_fkey (
              ID,
              Name,
              Email
            )
          ),
          ServiceTechnicianProfile:Profiles!Job_Orders_service_technician_id_fkey (
            ID,
            Name,
            Email
          )
        `, { count: 'exact' })
        .order('Order_ID', { ascending: true })
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

  // get all appointments with customer and technician
  router.get('/getAllAppointments', requireRole(supabase, ['manager']), async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('Appointments')
        .select(`
          *,
          Profiles!Appointments_customer_id_fkey (
            ID,
            Name,
            Email
          ),
          TechnicianProfile:Profiles!Appointments_technician_id_fkey (
            ID,
            Name,
            Email
          )
        `)

      if (error) return res.status(400).json({ error: error.message })
      res.status(200).json({ message: 'Appointments retrieved successfully', data })
    } catch (err) {
      console.error('Get appointments error:', err)
      res.status(500).json({ error: err.message })
    }
  })
  
  // update technician id for appointment
  router.put('/:appointmentId/technician', requireRole(supabase, ['manager']), async (req, res) => {
      try {

      const { appointmentId } = req.params
      const { technician_id } = req.body

      if (!technician_id) {
          return res.status(400).json({ message: 'technician_id is required' })
      }

      const { data, error } = await supabase
          .from('Appointments')
          .update({ technician_id })
          .eq('id', appointmentId)
          .select()
          .single()

      if (error) return res.status(400).json({ error: error.message })
      if (!data) return res.status(404).json({ message: 'Appointment not found' })

      res.json({ message: 'Technician updated successfully', data })
      } catch (err) {
      res.status(500).json({ error: err.message })
      }
  })
  
  // manager cancel appt
  router.put('/cancelAppointment/:id', requireRole(supabase, ['manager']), async (req, res) => {
    try {
      const { id } = req.params
      const { cancel_reason } = req.body

      const { data: existing, error: fetchError } = await supabase
        .from('Appointments')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError || !existing) {
        return res.status(404).json({ message: 'Appointment not found' })
      }

      if (existing.status === 'cancelled') {
        return res.status(400).json({ message: 'Appointment is already cancelled' })
      }

     const { data, error } = await supabase
        .from('Appointments')
        .update({ 
          status: 'cancelled',
          cancel_reason: cancel_reason ?? null
        })
        .eq('id', id)
        .select()
        .single()

     if (error) return res.status(400).json({ error: error.message })
      res.status(200).json({ message: 'Appointment cancelled successfully', data })
    } catch (err) {
      console.error('Cancel appointment error:', err)
      res.status(500).json({ error: err.message })
    }
  })

return router
}