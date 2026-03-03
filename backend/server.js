require('dotenv').config()
const express = require('express')
const { createClient } = require('@supabase/supabase-js')

const app = express()
const PORT = 3000

// Middleware
app.use(express.json())

// Import email service
const { sendStatusEmail } = require('./emailService.js')

app.use((req, res, next) => {
  if (!req.body) req.body = {}
  next()
})

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173')
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

// Supabase client (service role - full access)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

app.post('/api/job-orders/:orderId/status', async (req, res) => {
  const { status } = req.body
  const orderId = req.params.orderId

  try {
    // 1) Update status in Supabase
    const { data: order, error: orderError } = await supabase
      .from('Job_Orders')
      .update({ Order_Status: status })
      .eq('Order_ID', orderId)
      .select(`
        Order_ID,
        Order_Status,
        Customer_ID,
        vehicle_license_plate
      `)
      .single()

    if (orderError || !order) {
      return res.status(400).json({ error: orderError?.message || 'Order not found' })
    }

    // 2) Get customer info
    const { data: customer } = await supabase
      .from('Customers')
      .select('Customer_Name, Email')
      .eq('Customer_ID', order.Customer_ID)
      .single()

    // ✅ 3) EMAIL LOGIC - TESTING MODE
    const testingMode = process.env.EMAIL_TESTING === 'true'
    
    if (customer?.Email) {
      if (testingMode) {
        // 🚫 TESTING: Console log only
        console.log('📧 [TEST MODE] WOULD SEND TO:', customer.Email)
        console.log('📧 [TEST MODE] Customer:', customer.Customer_Name)
        console.log('📧 [TEST MODE] Order:', orderId, 'Status:', status)
        console.log('📧 [TEST MODE] License Plate:', order.vehicle_license_plate)
      } else {
        // ✅ PRODUCTION: Send real email
        console.log(`📧 SENDING REAL EMAIL to ${customer.Email}`)
        await sendStatusEmail({
          to: customer.Email,
          customerName: customer.Customer_Name,
          status,
          orderId: order.Order_ID,
          licensePlate: order.vehicle_license_plate
        })
      }
    } else {
      console.log(`⚠️ No customer email for ${orderId}`)
    }

    res.json({ 
      success: true, 
      emailSent: !testingMode && !!customer?.Email,
      testingMode 
    })

  } catch (err) {
    console.error('Status update error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})


// ✅ BONUS: Appointment status update
app.post('/api/appointments/:appointmentId/status', async (req, res) => {
  const { status } = req.body
  const appointmentId = req.params.appointmentId

  try {
    // 1) Update status in Supabase (adjust table/column names to match yours)
    const { data: appointment, error: apptError } = await supabase
      .from('Appointments')  // Your table name
      .update({ status })     // Your status column
      .eq('id', appointmentId)  // Your ID column
      .select(`
        id,
        status,
        customer_id,
        appointment_date,
        appointment_time,
        vehicle_license_plate
      `)
      .single()

    if (apptError || !appointment) {
      return res.status(400).json({ 
        error: apptError?.message || 'Appointment not found' 
      })
    }

    // 2) Get customer info (adjust column names)
    const { data: customer } = await supabase
      .from('Customers')
      .select('Customer_Name, Email')
      .eq('Customer_ID', appointment.customer_id)  // Adjust FK column name
      .single()

    // ✅ 3) EMAIL LOGIC - TESTING MODE (same as job orders)
    const testingMode = process.env.EMAIL_TESTING === 'true'
    
    if (customer?.Email) {
      if (testingMode) {
        // 🚫 TESTING: Console log only
        console.log('📧 [TEST MODE] WOULD SEND TO:', customer.Email)
        console.log('📧 [TEST MODE] Customer:', customer.Customer_Name)
        console.log('📧 [TEST MODE] Appointment:', appointmentId, 'Status:', status)
        console.log('📧 [TEST MODE] Date/Time:', appointment.appointment_date, appointment.appointment_time)
      } else {
        // ✅ PRODUCTION: Send real email
        console.log(`📧 SENDING REAL EMAIL to ${customer.Email}`)
        await sendStatusEmail({
          to: customer.Email,
          customerName: customer.Customer_Name,
          status,
          orderId: `Appt #${appointment.id}`,
          licensePlate: appointment.vehicle_license_plate,
          appointmentDate: appointment.appointment_date,
          appointmentTime: appointment.appointment_time
        })
      }
    } else {
      console.log(`⚠️ No customer email for appointment ${appointmentId}`)
    }

    res.json({ 
      success: true, 
      emailSent: !testingMode && !!customer?.Email,
      testingMode 
    })

  } catch (err) {
    console.error('Appointment status error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Routes (BEFORE custom routes to avoid conflicts)
app.use('/api/auth', require('./routes/auth')(supabase))
app.use('/api/technicians', require('./routes/technicians')(supabase))
app.use('/api/manager', require('./routes/manager')(supabase))
app.use('/api/job-orders', require('./routes/jobOrders')(supabase))   
app.use('/api/customer', require('./routes/customer')(supabase))

// Health check
app.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('count').single()
    res.json({ status: 'Supabase connected!', users: data?.count || 0 })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 Supabase Backend: http://localhost:${PORT}`)
})
