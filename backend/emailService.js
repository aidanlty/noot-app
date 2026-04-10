async function sendEmail({ to, subject, html }) {
  if (!to) {
    console.log('⚠️ No email address provided');
    return;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL || 'Porschify <no-reply@porschify.com>',
        to,
        subject,
        html,
      }),
    });

    const text = await response.text();

    if (response.ok) {
      console.log(`✅ Email sent to ${to}`);
      return { success: true, data: text };
    } else {
      console.error('❌ Email failed:', text);
      return { success: false, error: text };
    }
  } catch (error) {
    console.error('❌ Email error:', error.message);
    return { success: false, error: error.message };
  }
}

async function sendStatusEmail({
  to,
  customerName,
  status,
  orderId,
  licensePlate,
  appointmentDate,
  appointmentTime,
}) {
  const subject = `Update on your service (Order ${orderId || 'N/A'})`;

  const html = `
    <p>Hi ${customerName || 'Customer'},</p>
    <p>The status of your vehicle service has been updated to <strong>${status}</strong>.</p>
    ${licensePlate ? `<p>Vehicle: <strong>${licensePlate}</strong></p>` : ''}
    ${appointmentDate ? `<p>Appointment: <strong>${appointmentDate}</strong> ${appointmentTime || ''}</p>` : ''}
    <p>If you have questions, reply to this email.</p>
    <p>– Porschify</p>
  `;

  return sendEmail({ to, subject, html });
}

async function sendMgrNewAppointmentEmail() {
  const subject = '🆕 New Appointment Created';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af;">New Appointment Alert</h2>
      <p>Hello Manager,</p>
      <p>A new customer appointment has been created in Porschify.</p>
      <p><strong>Please check the dashboard for details.</strong></p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="color: #6b7280; font-size: 0.9em;">
        – Porschify <br>
        <em>Appointment booking system</em>
      </p>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL || 'Porschify <no-reply@porschify.com>',
        to: process.env.MANAGER_EMAIL || 'teamnoot1@gmail.com',  // fallback for testing
        subject,
        html,
      }),
    });

    const text = await response.text();

    if (response.ok) {
      console.log('✅ Manager new appointment email sent successfully');
      return { success: true };
    } else {
      console.error('❌ Manager email failed:', text);
      return { success: false, error: text };
    }
  } catch (error) {
    console.error('❌ Manager email error:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { 
  sendStatusEmail, 
  sendMgrNewAppointmentEmail 
};