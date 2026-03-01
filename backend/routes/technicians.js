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

    
  return router
}