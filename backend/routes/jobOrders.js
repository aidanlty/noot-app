const express = require('express')
const router = express.Router()
const requireRole = require('../middleware/requireRole')

module.exports = (supabase) => {

    // update services in a job card
    router.put('/:orderId/services', requireRole(supabase, ['manager', 'technician']), async (req, res) => {
        try {
            const { orderId } = req.params
            const { services } = req.body

            const { data, error } = await supabase
                .from('Job_Orders')
                .update({ Services: services })
                .eq('"Order_ID"', orderId)
                .select()
                .single()

            if (error) return res.status(500).json({ error: error.message })
            if (!data) return res.status(404).json({ message: 'Job card not found' })

            res.json({ data })
        } catch (err) {
            res.status(500).json({ error: err.message })
        }
    })

    return router
}