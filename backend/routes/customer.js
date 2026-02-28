const express = require('express')
const router = express.Router()

module.exports = (supabase) => {

router.post('/createAppointment', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return res.status(401).json({ message: 'Not authenticated' })

    const {
      appointment_date,
      appointment_time,
      customer_notes,
      vehicle_license_plate,
      vehicle_make,
      vehicle_year,
      phone_number
    } = req.body

    if (!appointment_date || !appointment_time) {
      return res.status(400).json({ message: 'appointment_date and appointment_time are required' })
    }

    const { data, error } = await supabase
      .from('Appointments')
      .insert([{
        appointment_date,
        appointment_time,
        customer_id: user.id,  // taken from the token
        customer_notes,
        status: 'booked',
        vehicle_license_plate,
        vehicle_make,
        vehicle_year,
        phone_number
      }])
      .select()
      .single()

    if (error) return res.status(400).json({ error: error.message })

    res.status(201).json({ message: 'Appointment created successfully', data })
  } catch (err) {
    console.error('Create appointment error:', err)
    res.status(500).json({ error: err.message })
  }
})

// get timing of booked slots and disallow users to select.
router.get('/bookedSlots', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Appointments')
      .select('appointment_date, appointment_time')
      .eq('status', 'booked')


    if (error) return res.status(400).json({ error: error.message })

    res.json({ data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
  return router
}