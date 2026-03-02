const express = require('express')
const router = express.Router()
const requireRole = require('../middleware/requireRole')

module.exports = (supabase) => {

    // GET all technicians
    router.get('/getTechnicians', requireRole(supabase, ['manager']), async (req, res) => {
    try {

        const { data: technicians, error } = await supabase
        .from('Profiles')
        .select('ID, Name, Email')
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

    // technician's appointments
    router.get('/getAppointments', requireRole(supabase, ['technician']), async (req, res) => {
        try {
            const { data, error } = await supabase
            .from('Appointments')
            .select(`
                *,
                Profiles:customer_id (
                Name,
                Email
                )
            `)
            .eq('technician_id', req.user.id)
            .eq('status', 'booked')
            if (error) return res.status(400).json({ error: error.message })
            res.status(200).json({ message: 'Appointments retrieved successfully', data })
        } catch (err) {
            console.error('Get appointments error:', err)
            res.status(500).json({ error: err.message })
        }
    })  
    return router
}