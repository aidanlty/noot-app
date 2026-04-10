require('dotenv').config()
const express = require('express')
const { createClient } = require('@supabase/supabase-js')

const app = express()
const PORT = 3000

// Middleware
app.use(express.json())

// Import email service
const { sendStatusEmail, sendMgrNewAppointmentEmail } = require('./emailService.js')

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
  const { status, customerEmail, customerName } = req.body
  const orderId = req.params.orderId

  try {
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

    const { data: customer } = await supabase
      .from('Customers')
      .select('Customer_Name, Email')
      .eq('Customer_ID', order.Customer_ID)
      .single()

    const fallbackEmail = 'yourtestemail@gmail.com'
    const recipientEmail = customerEmail || customer?.Email || fallbackEmail
    const usedFallback = !customerEmail && !customer?.Email

    const emailPayload = {
      to: recipientEmail,
      customerName: customer?.Customer_Name || customerName || 'Customer',
      status,
      orderId: order.Order_ID,
      licensePlate: order.vehicle_license_plate
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📧 Job order status email payload')
    console.log('To:', emailPayload.to)
    console.log('Customer Name:', emailPayload.customerName)
    console.log('Status:', emailPayload.status)
    console.log('Order ID:', emailPayload.orderId)
    console.log('License Plate:', emailPayload.licensePlate)
    if (usedFallback) {
      console.log('⚠️ No customer email found — using fallback test email')
    }
    console.log(`📧 SENDING EMAIL to ${recipientEmail}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    await sendStatusEmail(emailPayload)

    return res.json({
      success: true,
      emailSent: true,
      usedFallback,
      sentTo: recipientEmail
    })
  } catch (err) {
    console.error('Status update error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// Appointment status update
app.post('/api/appointments/:appointmentId/status', async (req, res) => {
  const { status, customerEmail, customerName } = req.body
  const appointmentId = req.params.appointmentId

  try {
    const { data: appointment, error: apptError } = await supabase
      .from('Appointments')
      .update({ status })
      .eq('id', appointmentId)
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

    const { data: customer } = await supabase
      .from('Customers')
      .select('Customer_Name, Email')
      .eq('Customer_ID', appointment.customer_id)
      .single()

    const fallbackEmail = 'yourtestemail@gmail.com'
    const recipientEmail = customerEmail || customer?.Email || fallbackEmail
    const usedFallback = !customerEmail && !customer?.Email

    const emailPayload = {
      to: recipientEmail,
      customerName: customer?.Customer_Name || customerName || 'Test Customer',
      status,
      orderId: `Appt #${appointment.id}`,
      licensePlate: appointment.vehicle_license_plate,
      appointmentDate: appointment.appointment_date,
      appointmentTime: appointment.appointment_time
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📧 Appointment status email payload')
    console.log('To:', emailPayload.to)
    console.log('Customer Name:', emailPayload.customerName)
    console.log('Status:', emailPayload.status)
    console.log('Reference:', emailPayload.orderId)
    console.log('License Plate:', emailPayload.licensePlate)
    console.log('Appointment Date:', emailPayload.appointmentDate)
    console.log('Appointment Time:', emailPayload.appointmentTime)
    if (usedFallback) {
      console.log('⚠️ No customer email found — using fallback test email')
    }
    console.log(`📧 SENDING EMAIL to ${recipientEmail}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    await sendStatusEmail(emailPayload)

    return res.json({
      success: true,
      emailSent: true,
      usedFallback,
      sentTo: recipientEmail
    })
  } catch (err) {
    console.error('Appointment status error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/email/manager-new-appointment
// Generic notification - no customer details needed
app.post('/api/email/manager-new-appointment', async (req, res) => {
  console.log('📧 Manager new appointment notification triggered');
  
  try {
    const { sendMgrNewAppointmentEmail } = require('./emailService'); // adjust path
    
    await sendMgrNewAppointmentEmail();
    
    res.json({ 
      success: true, 
      message: 'Manager notified successfully' 
    });
  } catch (error) {
    console.error('❌ Manager email error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send manager notification' 
    });
  }
});

// Routes (BEFORE custom routes to avoid conflicts)
app.use('/api/auth', require('./routes/auth')(supabase))
app.use('/api/technicians', require('./routes/technicians')(supabase))
app.use('/api/manager', require('./routes/manager')(supabase))
app.use('/api/jobOrders', require('./routes/jobOrders')(supabase))
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