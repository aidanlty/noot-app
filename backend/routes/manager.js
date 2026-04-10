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
  router.get('/jobCards', requireRole(supabase, ['manager']), async (req, res) => {
    try {
      const { data, error } = await supabase
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
        `)
        .order('Order_ID', { ascending: true })

      if (error) return res.status(500).json({ error: error.message })

      res.json({ data })
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

  // GET routes for ManagerReports
  router.get('/reports/appointments', requireRole(supabase, ['manager']), async (req, res) => {
    try {
      const { dateFrom, dateTo, customerName, vehicleName, licensePlate, assignedTechnician, recordId } = req.query

      let query = supabase
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
        .eq('status', 'completed')

      if (dateFrom) query = query.gte('appointment_date', dateFrom)
      if (dateTo) query = query.lte('appointment_date', dateTo)
      if (recordId) query = query.eq('id', recordId)

      if (vehicleName) {
        const words = vehicleName.trim().split(/\s+/)
        words.forEach(word => {
          query = query.or(
            `vehicle_year.ilike.%${word}%,vehicle_make.ilike.%${word}%,vehicle_model.ilike.%${word}%`
          )
        })
      }

      if (licensePlate) query = query.ilike('vehicle_license_plate', `%${licensePlate}%`)

      const { data, error } = await query.order('appointment_date', { ascending: false }).order('appointment_time', { ascending: false })
      if (error) return res.status(500).json({ error: error.message })

      let results = data || []

      if (customerName) {
        const term = customerName.toLowerCase()
        results = results.filter(a => (a.Profiles?.Name || '').toLowerCase().includes(term))
      }

      if (assignedTechnician) {
        const term = assignedTechnician.toLowerCase()
        results = results.filter(a => (a.TechnicianProfile?.Name || '').toLowerCase().includes(term))
      }

      res.status(200).json({ message: 'Appointments retrieved successfully', data: results })
    } catch (err) {
      console.error('Reports appointments error:', err)
      res.status(500).json({ error: err.message })
    }
  })

  router.get('/reports/jobOrders', requireRole(supabase, ['manager']), async (req, res) => {
    try {
      const { dateFrom, dateTo, customerName, vehicleName, licensePlate, assignedTechnician, recordId } = req.query

      let query = supabase
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
        `)
        .eq('Order_Status', 'Check Out')

      if (recordId) query = query.eq('Order_ID', recordId)
      if (dateFrom) query = query.gte('Check_Out', dateFrom)
      if (dateTo) query = query.lte('Check_Out', dateTo)

      const { data, error } = await query.order('Check_Out', { ascending: false, nullsFirst: false })
      if (error) return res.status(500).json({ error: error.message })

      let results = data || []

      if (customerName) {
        const term = customerName.toLowerCase()
        results = results.filter(j => (j.appointment?.CustomerProfile?.Name || '').toLowerCase().includes(term))
      }

      if (vehicleName) {
        const words = vehicleName.trim().toLowerCase().split(/\s+/)
        results = results.filter(j => {
          const combined = [
            j.appointment?.vehicle_year,
            j.appointment?.vehicle_make,
            j.appointment?.vehicle_model
          ].filter(Boolean).join(' ').toLowerCase()
          return words.every(word => combined.includes(word))
        })
      }

      if (licensePlate) {
        const term = licensePlate.toLowerCase()
        results = results.filter(j => (j.appointment?.vehicle_license_plate || '').toLowerCase().includes(term))
      }

      if (assignedTechnician) {
        const term = assignedTechnician.toLowerCase()
        results = results.filter(j =>
          (j.ServiceTechnicianProfile?.Name || '').toLowerCase().includes(term) ||
          (j.appointment?.DiagnoseTechnicianProfile?.Name || '').toLowerCase().includes(term)
        )
      }

      res.status(200).json({ message: 'Job orders retrieved successfully', data: results })
    } catch (err) {
      console.error('Reports job orders error:', err)
      res.status(500).json({ error: err.message })
    }
  })


  return router
}